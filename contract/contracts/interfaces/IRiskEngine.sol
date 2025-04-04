// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRiskEngine
 * @dev Interface for the risk assessment engine
 */
interface IRiskEngine {
    /**
     * @dev Initializes the risk engine
     */
    function initialize() external;
    
    /**
     * @dev Structure representing risk assessment result
     */
    struct RiskAssessment {
        bool approved;
        uint256 recommendedLTV;
        uint256 maxLoanAmount;
        uint256 interestRate;
        string reason;
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
    ) external view returns (RiskAssessment memory assessment);
    
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
    ) external;
    
    /**
     * @dev Gets the current risk parameters for a specific collateral type
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
    );
} 