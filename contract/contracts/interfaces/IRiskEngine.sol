// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRiskEngine
 * @dev Interface for risk assessment engine
 */
interface IRiskEngine {
    // Risk assessment result
    struct RiskAssessment {
        bool approved;
        uint256 recommendedLTV;
        uint256 maxLoanAmount;
        uint256 interestRate;
        string reason;
    }

    /**
     * @dev Initializes the contract
     */
    function initialize() external;

    /**
     * @dev Assesses the risk of a loan request
     * @param borrower The address of the borrower
     * @param collateralToken The address of the collateral token contract
     * @param collateralTokenId The ID of the collateral token
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
    ) external;

    /**
     * @dev Gets the risk parameters for a collateral token
     * @param collateralToken The address of the collateral token contract
     * @return maxLTV The maximum loan-to-value ratio in basis points
     * @return liquidationThreshold The liquidation threshold in basis points
     * @return baseInterestRate The base interest rate in basis points
     */
    function getRiskParameters(
        address collateralToken
    ) external view returns (
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    );

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
    ) external returns (bool);

    /**
     * @dev Gets the maximum loan-to-value ratio
     * @return The maximum LTV in basis points
     */
    function getMaxLTV() external view returns (uint256);

    /**
     * @dev Gets the minimum loan duration
     * @return The minimum duration in seconds
     */
    function getMinDuration() external view returns (uint256);

    /**
     * @dev Gets the maximum loan duration
     * @return The maximum duration in seconds
     */
    function getMaxDuration() external view returns (uint256);
} 