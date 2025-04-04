// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ILoanOrigination.sol";

/**
 * @title IMorphoAdapter
 * @dev Interface for the Morpho Blue adapter that enables loan execution
 */
interface IMorphoAdapter {
    /**
     * @dev Event emitted when collateral is deposited into Morpho
     */
    event CollateralDeposited(
        uint256 indexed loanId, 
        address indexed token, 
        uint256 tokenId, 
        uint256 value
    );
    
    /**
     * @dev Event emitted when USDC is borrowed from Morpho
     */
    event TokensBorrowed(
        uint256 indexed loanId, 
        address indexed borrower, 
        uint256 amount
    );
    
    /**
     * @dev Event emitted when a loan is repaid to Morpho
     */
    event LoanRepaid(
        uint256 indexed loanId, 
        address indexed borrower, 
        uint256 amount
    );
    
    /**
     * @dev Event emitted when collateral is released from Morpho
     */
    event CollateralReleased(
        uint256 indexed loanId, 
        address indexed token, 
        uint256 tokenId, 
        address recipient
    );
    
    /**
     * @dev Deposits a tokenized policy as collateral into Morpho
     * @param loanId The loan ID
     * @param token The address of the tokenized policy contract
     * @param tokenId The tokenized policy ID
     * @return success Whether the deposit was successful
     */
    function depositCollateral(
        uint256 loanId,
        address token,
        uint256 tokenId
    ) external returns (bool success);
    
    /**
     * @dev Borrows USDC from Morpho using the deposited collateral
     * @param loanId The loan ID
     * @param amount The amount to borrow
     * @param recipient The address to receive the borrowed funds
     * @return success Whether the borrowing was successful
     */
    function borrowUSDC(
        uint256 loanId,
        uint256 amount,
        address recipient
    ) external returns (bool success);
    
    /**
     * @dev Repays a loan to Morpho
     * @param loanId The loan ID
     * @param amount The amount to repay
     * @return success Whether the repayment was successful
     */
    function repayLoan(
        uint256 loanId,
        uint256 amount
    ) external returns (bool success);
    
    /**
     * @dev Liquidates a defaulted loan through Morpho
     * @param loanId The loan ID
     * @return recoveredAmount The amount recovered from liquidation
     */
    function liquidateLoan(
        uint256 loanId
    ) external returns (uint256 recoveredAmount);
    
    /**
     * @dev Releases collateral after loan repayment
     * @param loanId The loan ID
     * @param recipient The address to receive the released collateral
     * @return success Whether the release was successful
     */
    function releaseCollateral(
        uint256 loanId,
        address recipient
    ) external returns (bool success);
} 