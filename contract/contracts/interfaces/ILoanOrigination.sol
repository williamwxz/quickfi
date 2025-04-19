// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ILoanOrigination
 * @dev Interface for loan origination module based on Perimeter Protocol
 */
interface ILoanOrigination {
    /**
     * @dev Enum representing the status of a loan
     */
    enum LoanStatus {
        NONE,
        PENDING,
        ACTIVE,
        REPAID,
        DEFAULTED,
        LIQUIDATED
    }

    /**
     * @dev Structure representing a loan
     */
    struct Loan {
        uint256 id;
        address borrower;
        uint256 collateralTokenId;
        address collateralToken;
        uint256 principal;
        uint256 interestRate;
        uint256 startTime;
        uint256 duration;
        uint256 endTime;
        LoanStatus status;
        address stablecoin;  // Added stablecoin field
    }

    /**
     * @dev Event emitted when a loan request is created
     */
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralTokenId,
        uint256 principal
    );

    /**
     * @dev Event emitted when a loan is activated
     */
    event LoanActivated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralTokenId,
        uint256 principal
    );

    /**
     * @dev Event emitted when a loan is repaid
     */
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amountRepaid
    );

    /**
     * @dev Event emitted when a loan is defaulted and liquidated
     */
    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralTokenId
    );

    /**
     * @dev Requests a loan with the tokenized policy as collateral
     * @param collateralToken Address of the tokenized policy contract
     * @param collateralTokenId Token ID of the tokenized policy
     * @param principal Amount of stablecoin requested
     * @param duration Duration of the loan in seconds
     * @param stablecoin Address of the stablecoin to use
     * @return loanId The created loan ID
     */
    function requestLoan(
        address collateralToken,
        uint256 collateralTokenId,
        uint256 principal,
        uint256 duration,
        address stablecoin
    ) external returns (uint256 loanId);

    /**
     * @dev Retrieves a loan's details
     * @param loanId The loan ID
     * @return Loan The loan details
     */
    function getLoan(uint256 loanId) external view returns (Loan memory);

    /**
     * @dev Repays a loan
     * @param loanId The loan ID
     * @param amount The amount to repay
     */
    function repayLoan(uint256 loanId, uint256 amount) external;

    /**
     * @dev Liquidates a defaulted loan
     * @param loanId The loan ID
     */
    function liquidateLoan(uint256 loanId) external;
}