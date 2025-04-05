// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interfaces/IRiskEngine.sol";
import "../interfaces/ITokenizedPolicy.sol";

/**
 * @title RiskEngineUpgradeable
 * @dev Upgradeable contract for evaluating loan risk
 */
contract RiskEngineUpgradeable is 
    IRiskEngine,
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    // Roles
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");

    // Risk parameters
    uint256 public constant MAX_LTV = 7000; // 70% in basis points
    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 365 days;
    uint256 public constant DEFAULT_LIQUIDATION_THRESHOLD = 8500; // 85% in basis points
    uint256 public constant DEFAULT_BASE_INTEREST_RATE = 500; // 5% in basis points

    // Risk parameters for each collateral type
    struct CollateralRiskParams {
        uint256 maxLTV;
        uint256 liquidationThreshold;
        uint256 baseInterestRate;
        bool configured;
    }

    // Mapping from collateral token address to risk parameters
    mapping(address => CollateralRiskParams) private _riskParams;

    // Events
    event RiskParametersUpdated(
        uint256 maxLtv,
        uint256 minDuration,
        uint256 maxDuration
    );

    /**
     * @dev Constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer
     */
    function initialize() external override initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RISK_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Assesses the risk of a loan request
     * @param collateralToken The address of the collateral token contract
     * @param collateralTokenId The ID of the collateral token
     * @param requestedAmount The requested loan amount
     * @param duration The loan duration in seconds
     * @return assessment The risk assessment result
     */
    function assessRisk(
        address,  // borrower (unused but kept for interface compatibility)
        address collateralToken,
        uint256 collateralTokenId,
        uint256 requestedAmount,
        uint256 duration
    ) external view override returns (RiskAssessment memory assessment) {
        require(collateralToken != address(0), "RiskEngine: Zero address");
        require(requestedAmount > 0, "RiskEngine: Invalid loan amount");
        require(duration >= MIN_DURATION, "RiskEngine: Duration too short");
        require(duration <= MAX_DURATION, "RiskEngine: Duration too long");

        // Get policy details
        (
            ,  // string memory policyNumber (unused)
            ,  // address issuer (unused)
            uint256 collateralValue,
            uint256 expiryDate,
            // bytes32 documentHash (unused)
        ) = ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);

        // Check policy expiry
        if (expiryDate <= block.timestamp + duration) {
            return RiskAssessment({
                approved: false,
                recommendedLTV: 0,
                maxLoanAmount: 0,
                interestRate: 0,
                reason: "Policy expires before loan end"
            });
        }

        // Get risk parameters
        CollateralRiskParams memory params = _getCollateralRiskParams(collateralToken);

        // Calculate max loan amount
        uint256 maxLoanAmount = (collateralValue * params.maxLTV) / 10000;

        // Check if requested amount exceeds max loan amount
        if (requestedAmount > maxLoanAmount) {
            return RiskAssessment({
                approved: false,
                recommendedLTV: params.maxLTV,
                maxLoanAmount: maxLoanAmount,
                interestRate: 0,
                reason: "Requested amount exceeds maximum LTV"
            });
        }

        // Calculate actual LTV
        uint256 actualLTV = (requestedAmount * 10000) / collateralValue;

        // Calculate interest rate
        uint256 interestRate = _calculateInterestRate(
            params.baseInterestRate,
            actualLTV,
            duration
        );

        return RiskAssessment({
            approved: true,
            recommendedLTV: actualLTV,
            maxLoanAmount: maxLoanAmount,
            interestRate: interestRate,
            reason: "Loan approved"
        });
    }

    /**
     * @dev Updates the risk parameters for a collateral token
     * @param collateralToken The address of the collateral token contract
     * @param maxLTV The maximum loan-to-value ratio in basis points
     * @param liquidationThreshold The liquidation threshold in basis points
     * @param baseInterestRate The base interest rate in basis points
     */
    function updateRiskParameters(
        address collateralToken,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    ) external override onlyRole(RISK_MANAGER_ROLE) {
        require(collateralToken != address(0), "RiskEngine: Zero address");
        require(maxLTV > 0 && maxLTV <= MAX_LTV, "RiskEngine: Invalid maxLTV");
        require(liquidationThreshold > maxLTV && liquidationThreshold <= 10000, "RiskEngine: Invalid liquidation threshold");
        require(baseInterestRate <= 5000, "RiskEngine: Base interest rate too high");

        _riskParams[collateralToken] = CollateralRiskParams({
            maxLTV: maxLTV,
            liquidationThreshold: liquidationThreshold,
            baseInterestRate: baseInterestRate,
            configured: true
        });
    }

    /**
     * @dev Gets the risk parameters for a collateral token
     * @param collateralToken The address of the collateral token contract
     * @return maxLTV The maximum loan-to-value ratio in basis points
     * @return liquidationThreshold The liquidation threshold in basis points
     * @return baseInterestRate The base interest rate in basis points
     */
    function getRiskParameters(
        address collateralToken
    ) external view override returns (
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
     * @dev Evaluates the risk of a loan
     * @param collateralToken The address of the collateral token contract
     * @param collateralTokenId The ID of the collateral token
     * @param loanAmount The amount of the loan
     * @param loanDuration The duration of the loan in seconds
     * @return approved Whether the loan is approved
     */
    function evaluateRisk(
        address collateralToken,
        uint256 collateralTokenId,
        uint256 loanAmount,
        uint256 loanDuration
    ) external view override returns (bool) {
        require(collateralToken != address(0), "RiskEngine: Zero address");
        require(loanAmount > 0, "RiskEngine: Invalid loan amount");
        require(loanDuration >= MIN_DURATION, "RiskEngine: Duration too short");
        require(loanDuration <= MAX_DURATION, "RiskEngine: Duration too long");

        // Get policy details
        (
            ,  // string memory policyNumber (unused)
            ,  // address issuer (unused)
            uint256 collateralValue,
            uint256 expiryDate,
            // bytes32 documentHash (unused)
        ) = ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);

        // Check policy expiry
        require(expiryDate > block.timestamp + loanDuration, "RiskEngine: Policy expires before loan end");

        // Calculate LTV
        uint256 ltv = (loanAmount * 10000) / collateralValue;
        require(ltv <= MAX_LTV, "RiskEngine: LTV too high");

        // Additional risk checks can be added here

        return true;
    }

    /**
     * @dev Gets the maximum loan-to-value ratio
     * @return The maximum LTV in basis points
     */
    function getMaxLTV() external pure override returns (uint256) {
        return MAX_LTV;
    }

    /**
     * @dev Gets the minimum loan duration
     * @return The minimum duration in seconds
     */
    function getMinDuration() external pure override returns (uint256) {
        return MIN_DURATION;
    }

    /**
     * @dev Gets the maximum loan duration
     * @return The maximum duration in seconds
     */
    function getMaxDuration() external pure override returns (uint256) {
        return MAX_DURATION;
    }

    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(RISK_MANAGER_ROLE) {}

    /**
     * @dev Gets the risk parameters for a collateral token
     * @param collateralToken The address of the collateral token contract
     * @return params The risk parameters
     */
    function _getCollateralRiskParams(address collateralToken) internal view returns (CollateralRiskParams memory) {
        if (_riskParams[collateralToken].configured) {
            return _riskParams[collateralToken];
        }

        // Return default parameters if not configured
        return CollateralRiskParams({
            maxLTV: MAX_LTV,
            liquidationThreshold: DEFAULT_LIQUIDATION_THRESHOLD,
            baseInterestRate: DEFAULT_BASE_INTEREST_RATE,
            configured: false
        });
    }

    /**
     * @dev Calculates the interest rate for a loan
     * @param baseRate The base interest rate in basis points
     * @param ltv The loan-to-value ratio in basis points
     * @param duration The loan duration in seconds
     * @return The calculated interest rate in basis points
     */
    function _calculateInterestRate(
        uint256 baseRate,
        uint256 ltv,
        uint256 duration
    ) internal pure returns (uint256) {
        // Higher LTV = higher rate
        uint256 ltvFactor = (ltv * 100) / MAX_LTV;
        uint256 ltvAdjustment = (baseRate * ltvFactor) / 100;

        // Longer duration = higher rate
        uint256 durationFactor;
        if (duration <= 7 days) {
            durationFactor = 10;
        } else if (duration <= 30 days) {
            durationFactor = 25;
        } else if (duration <= 90 days) {
            durationFactor = 50;
        } else if (duration <= 180 days) {
            durationFactor = 75;
        } else {
            durationFactor = 100;
        }
        uint256 durationAdjustment = (baseRate * durationFactor) / 100;

        // Calculate total rate (base + adjustments)
        uint256 totalRate = baseRate + ltvAdjustment + durationAdjustment;

        // Cap at 30% APR
        return totalRate > 3000 ? 3000 : totalRate;
    }
} 