// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IRiskEngine.sol";
import "../interfaces/ITokenizedPolicy.sol";

/**
 * @title RiskController
 * @dev Controller for managing risk assessment and parameters
 * Based on the controller pattern from Perimeter Protocol
 */
contract RiskController is AccessControl {
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    
    // Default risk parameters (in basis points)
    uint256 private constant DEFAULT_MAX_LTV = 7000; // 70%
    uint256 private constant DEFAULT_LIQUIDATION_THRESHOLD = 8500; // 85%
    uint256 private constant DEFAULT_BASE_INTEREST_RATE = 500; // 5%
    
    // Risk parameters for each collateral type
    struct CollateralRiskParams {
        uint256 maxLTV; // in basis points (e.g., 7000 = 70%)
        uint256 liquidationThreshold; // in basis points (e.g., 8500 = 85%)
        uint256 baseInterestRate; // in basis points (e.g., 500 = 5%)
        bool configured;
    }
    
    // Mapping from collateral token address to risk parameters
    mapping(address => CollateralRiskParams) private _riskParams;
    
    // Mapping from borrower to their risk score (1-100, higher is better)
    mapping(address => uint256) private _borrowerRiskScores;
    
    // Events
    event RiskParametersUpdated(
        address indexed collateralToken,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    );
    
    event BorrowerRiskScoreUpdated(
        address indexed borrower,
        uint256 oldScore,
        uint256 newScore
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RISK_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Assesses the risk of a loan request
     * @param borrower The address of the borrower
     * @param collateralToken The address of the tokenized policy contract
     * @param collateralTokenId The tokenized policy ID
     * @param requestedAmount The requested loan amount
     * @param duration The loan duration in seconds
     * @return assessment The risk assessment result
     */
    function assessRisk(
        address borrower,
        address collateralToken,
        uint256 collateralTokenId,
        uint256 requestedAmount,
        uint256 duration
    ) external view returns (IRiskEngine.RiskAssessment memory assessment) {
        // Get collateral value
        (,,uint256 collateralValue,uint256 expiryDate) = ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);
        
        // Check if policy is valid
        if (block.timestamp > expiryDate) {
            return IRiskEngine.RiskAssessment({
                approved: false,
                recommendedLTV: 0,
                maxLoanAmount: 0,
                interestRate: 0,
                reason: "Policy is expired"
            });
        }
        
        // Get risk params for this collateral
        CollateralRiskParams memory params = _getCollateralRiskParams(collateralToken);
        
        // Calculate max loan amount based on LTV
        uint256 maxLoanAmount = (collateralValue * params.maxLTV) / 10000;
        
        // Check if requested amount exceeds max loan amount
        if (requestedAmount > maxLoanAmount) {
            return IRiskEngine.RiskAssessment({
                approved: false,
                recommendedLTV: params.maxLTV,
                maxLoanAmount: maxLoanAmount,
                interestRate: 0,
                reason: "Requested amount exceeds maximum LTV"
            });
        }
        
        // Calculate actual LTV for the requested amount
        uint256 actualLTV = (requestedAmount * 10000) / collateralValue;
        
        // Calculate interest rate based on LTV ratio and duration
        uint256 ltvFactor = (actualLTV * 100) / params.maxLTV;
        uint256 durationFactor = _calculateDurationFactor(duration);
        uint256 borrowerRiskScore = _getBorrowerRiskScore(borrower);
        
        // Calculate final interest rate
        uint256 interestRate = _calculateInterestRate(
            params.baseInterestRate,
            ltvFactor,
            durationFactor,
            borrowerRiskScore
        );
        
        // Approve the loan
        return IRiskEngine.RiskAssessment({
            approved: true,
            recommendedLTV: actualLTV,
            maxLoanAmount: maxLoanAmount,
            interestRate: interestRate,
            reason: "Loan approved"
        });
    }
    
    /**
     * @dev Updates risk parameters for a specific collateral type
     * @param collateralToken The address of the collateral token contract
     * @param maxLTV The maximum loan-to-value ratio (in basis points)
     * @param liquidationThreshold The liquidation threshold (in basis points)
     * @param baseInterestRate The base interest rate (in basis points)
     */
    function updateRiskParameters(
        address collateralToken,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    ) external {
        require(hasRole(RISK_MANAGER_ROLE, msg.sender), "RiskController: Must have risk manager role");
        require(collateralToken != address(0), "RiskController: Invalid collateral token");
        require(maxLTV > 0 && maxLTV < 10000, "RiskController: Invalid maxLTV");
        require(liquidationThreshold > maxLTV && liquidationThreshold < 10000, "RiskController: Invalid liquidation threshold");
        require(baseInterestRate < 5000, "RiskController: Base interest rate too high");
        
        _riskParams[collateralToken] = CollateralRiskParams({
            maxLTV: maxLTV,
            liquidationThreshold: liquidationThreshold,
            baseInterestRate: baseInterestRate,
            configured: true
        });
        
        emit RiskParametersUpdated(collateralToken, maxLTV, liquidationThreshold, baseInterestRate);
    }
    
    /**
     * @dev Gets the risk parameters for a specific collateral type
     * @param collateralToken The address of the collateral token contract
     * @return maxLTV The maximum loan-to-value ratio (in basis points)
     * @return liquidationThreshold The liquidation threshold (in basis points)
     * @return baseInterestRate The base interest rate (in basis points)
     */
    function getRiskParameters(
        address collateralToken
    ) external view returns (
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    ) {
        CollateralRiskParams memory params = _getCollateralRiskParams(collateralToken);
        return (
            params.maxLTV,
            params.liquidationThreshold,
            params.baseInterestRate
        );
    }
    
    /**
     * @dev Updates the risk score of a borrower
     * @param borrower The address of the borrower
     * @param riskScore The risk score (1-100, higher is better)
     */
    function updateBorrowerRiskScore(address borrower, uint256 riskScore) external {
        require(hasRole(RISK_MANAGER_ROLE, msg.sender), "RiskController: Must have risk manager role");
        require(borrower != address(0), "RiskController: Invalid borrower address");
        require(riskScore > 0 && riskScore <= 100, "RiskController: Risk score must be between 1-100");
        
        uint256 oldScore = _borrowerRiskScores[borrower];
        _borrowerRiskScores[borrower] = riskScore;
        
        emit BorrowerRiskScoreUpdated(borrower, oldScore, riskScore);
    }
    
    /**
     * @dev Gets the risk score of a borrower
     * @param borrower The address of the borrower
     * @return riskScore The risk score
     */
    function getBorrowerRiskScore(address borrower) external view returns (uint256) {
        return _getBorrowerRiskScore(borrower);
    }
    
    /**
     * @dev Internal function to get the risk score of a borrower
     * @param borrower The address of the borrower
     * @return riskScore The risk score (defaults to 70 if not set)
     */
    function _getBorrowerRiskScore(address borrower) internal view returns (uint256) {
        uint256 score = _borrowerRiskScores[borrower];
        return score == 0 ? 70 : score; // Default to 70 if not set
    }
    
    /**
     * @dev Internal function to get the risk parameters for a collateral
     * @param collateralToken The address of the collateral token
     * @return params The collateral risk parameters
     */
    function _getCollateralRiskParams(address collateralToken) internal view returns (CollateralRiskParams memory) {
        if (_riskParams[collateralToken].configured) {
            return _riskParams[collateralToken];
        }
        
        // Return default parameters if not configured
        return CollateralRiskParams({
            maxLTV: DEFAULT_MAX_LTV,
            liquidationThreshold: DEFAULT_LIQUIDATION_THRESHOLD,
            baseInterestRate: DEFAULT_BASE_INTEREST_RATE,
            configured: false
        });
    }
    
    /**
     * @dev Internal function to calculate interest rate
     * @param baseRate The base interest rate in basis points
     * @param ltvFactor The LTV factor (0-100 scale)
     * @param durationFactor The duration factor
     * @param borrowerRiskScore The borrower risk score (1-100)
     * @return interestRate The calculated interest rate in basis points
     */
    function _calculateInterestRate(
        uint256 baseRate,
        uint256 ltvFactor,
        uint256 durationFactor,
        uint256 borrowerRiskScore
    ) internal pure returns (uint256) {
        // Adjust for LTV (higher LTV = higher rate)
        uint256 ltvAdjustment = (baseRate * ltvFactor) / 100;
        
        // Adjust for duration (longer duration = higher rate)
        uint256 durationAdjustment = (baseRate * durationFactor) / 100;
        
        // Adjust for borrower risk (lower score = higher rate)
        uint256 riskAdjustment = (baseRate * (100 - borrowerRiskScore)) / 100;
        
        // Calculate total interest rate (base + adjustments)
        uint256 totalRate = baseRate + ltvAdjustment + durationAdjustment + riskAdjustment;
        
        // Cap the interest rate at a reasonable maximum (30%)
        return totalRate > 3000 ? 3000 : totalRate;
    }
    
    /**
     * @dev Calculate the duration factor based on loan duration
     * @param duration The loan duration in seconds
     * @return factor The duration factor (0-100 scale)
     */
    function _calculateDurationFactor(uint256 duration) internal pure returns (uint256) {
        // Short-term: 1-7 days
        if (duration <= 7 days) {
            return 10;
        }
        // Medium-term: 8-30 days
        else if (duration <= 30 days) {
            return 25;
        }
        // Long-term: 31-90 days
        else if (duration <= 90 days) {
            return 50;
        }
        // Extended: 91-365 days
        else if (duration <= 365 days) {
            return 75;
        }
        // Very long-term: over 1 year
        else {
            return 100;
        }
    }
} 