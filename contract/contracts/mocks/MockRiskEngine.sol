// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITokenizedPolicy.sol";

/**
 * @title MockRiskEngine
 * @dev Mock risk engine for testing
 */
contract MockRiskEngine {
    // Max LTV is 70%
    uint256 public constant MAX_LTV = 7000;

    // Risk assessment result structure
    struct RiskAssessment {
        bool approved;
        uint256 recommendedLTV;
        uint256 maxLoanAmount;
        uint256 interestRate;
        string reason;
    }

    /**
     * @dev Assesses the risk of a loan request
     * @param collateralToken The address of the collateral token contract
     * @param collateralTokenId The ID of the collateral token
     * @param requestedAmount The requested loan amount
     * @return assessment The risk assessment result
     */
    function assessRisk(
        address,  // borrower (unused)
        address collateralToken,
        uint256 collateralTokenId,
        uint256 requestedAmount,
        uint256  // duration (unused)
    ) external view returns (RiskAssessment memory assessment) {
        // Get collateral value from policy
        (
            ,  // string memory policyNumber (unused)
            ,  // address issuer (unused)
            uint256 collateralValue,
            ,  // uint256 expiryDate (unused)
            // bytes32 documentHash (unused)
        ) = ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);

        // Skip expiry check for testing

        // Calculate max loan amount
        uint256 maxLoanAmount = (collateralValue * MAX_LTV) / 10000;

        // Check if requested amount exceeds max loan amount
        if (requestedAmount > maxLoanAmount) {
            return RiskAssessment({
                approved: false,
                recommendedLTV: MAX_LTV,
                maxLoanAmount: maxLoanAmount,
                interestRate: 500, // 5% base rate
                reason: "Requested amount exceeds maximum LTV"
            });
        }

        // Calculate actual LTV
        uint256 actualLTV = (requestedAmount * 10000) / collateralValue;

        // Approve the loan
        return RiskAssessment({
            approved: true,
            recommendedLTV: actualLTV,
            maxLoanAmount: maxLoanAmount,
            interestRate: 500, // 5% base rate
            reason: "Loan approved"
        });
    }

    /**
     * @dev Gets the maximum loan-to-value ratio
     * @return The maximum LTV in basis points
     */
    function getMaxLTV() external pure returns (uint256) {
        return MAX_LTV;
    }

    /**
     * @dev Evaluates the risk of a loan
     * @param collateralToken The address of the collateral token contract
     * @param collateralTokenId The ID of the collateral token
     * @param loanAmount The amount of the loan
     * @return approved Whether the loan is approved
     */
    function evaluateRisk(
        address collateralToken,
        uint256 collateralTokenId,
        uint256 loanAmount,
        uint256  // loanDuration (unused)
    ) external view returns (bool) {
        // Get collateral value from policy
        (
            ,  // string memory policyNumber (unused)
            ,  // address issuer (unused)
            uint256 collateralValue,
            ,  // uint256 expiryDate (unused)
            // bytes32 documentHash (unused)
        ) = ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);

        // Skip expiry check for testing
        
        // Calculate LTV
        uint256 ltv = (loanAmount * 10000) / collateralValue;
        
        // Check if LTV is within limits
        return ltv <= MAX_LTV;
    }
} 