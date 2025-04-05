// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITokenizedPolicy.sol";
import "./MockRiskEngine.sol";

/**
 * @title MockRiskController
 * @dev Mock risk controller for testing
 */
contract MockRiskController {
    // Risk parameters
    uint256 public constant MAX_LTV = 7000; // 70%
    uint256 public constant LIQUIDATION_THRESHOLD = 8500; // 85%
    uint256 public constant BASE_INTEREST_RATE = 500; // 5%

    // Risk engine reference
    MockRiskEngine public riskEngine;

    // Events
    event RiskAssessed(
        address indexed collateralToken,
        uint256 indexed collateralTokenId,
        uint256 loanAmount,
        uint256 loanDuration,
        bool approved
    );

    /**
     * @dev Constructor
     * @param _riskEngine Address of the risk engine
     */
    constructor(address _riskEngine) {
        require(_riskEngine != address(0), "MockRiskController: Zero address");
        riskEngine = MockRiskEngine(_riskEngine);
    }

    /**
     * @dev Assesses the risk of a loan
     * @param collateralToken The address of the collateral token contract
     * @param collateralTokenId The ID of the collateral token
     * @param loanAmount The amount of the loan
     * @param loanDuration The duration of the loan in seconds
     * @return approved Whether the loan is approved
     */
    function assessRisk(
        address collateralToken,
        uint256 collateralTokenId,
        uint256 loanAmount,
        uint256 loanDuration
    ) external returns (bool) {
        require(collateralToken != address(0), "MockRiskController: Zero address");
        require(loanAmount > 0, "MockRiskController: Invalid loan amount");
        require(loanDuration > 0, "MockRiskController: Invalid loan duration");

        // Get policy details but don't use the values
        ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);

        // Skip policy expiry check for testing

        // Assess risk using risk engine
        bool approved = riskEngine.evaluateRisk(
            collateralToken,
            collateralTokenId,
            loanAmount,
            loanDuration
        );

        emit RiskAssessed(
            collateralToken,
            collateralTokenId,
            loanAmount,
            loanDuration,
            approved
        );

        return approved;
    }

    /**
     * @dev Updates risk parameters for a collateral token
     * @param collateralToken The address of the collateral token
     * @param maxLTV The maximum loan-to-value ratio
     * @param liquidationThreshold The liquidation threshold
     * @param baseInterestRate The base interest rate
     */
    function updateRiskParameters(
        address collateralToken,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    ) external {
        // This is a mock function that doesn't do anything in tests
    }
} 