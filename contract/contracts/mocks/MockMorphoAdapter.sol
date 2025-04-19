// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IMorphoAdapter.sol";
import "../interfaces/ILoanOrigination.sol";

/**
 * @title MockMorphoAdapter
 * @dev Mock implementation of MorphoAdapter for demo purposes
 * This contract simulates the interaction with Morpho Blue protocol without actual external dependencies
 */
contract MockMorphoAdapter is
    IMorphoAdapter,
    AccessControl,
    ReentrancyGuard,
    Pausable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LOAN_ORIGINATOR_ROLE = keccak256("LOAN_ORIGINATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Addresses
    address public loanOrigination;
    address public tokenRegistry;

    // Loan collateral tracking
    struct CollateralInfo {
        address token;         // The token contract address
        uint256 tokenId;       // The token ID
        uint256 valuationAmount; // The valuation amount
        bool isDeposited;      // Whether the collateral is deposited
        address stablecoin;    // The stablecoin used for the loan
    }

    // Mappings
    mapping(uint256 => CollateralInfo) private _collaterals;
    mapping(uint256 => uint256) private _borrowedAmounts;
    mapping(uint256 => uint256) private _repaidAmounts;

    // Events
    event LoanOriginatorUpdated(address indexed oldOriginator, address indexed newOriginator);
    event TokenRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event ContractPaused(address account);
    event ContractUnpaused(address account);

    constructor(address _loanOrigination, address _tokenRegistry) {
        require(_loanOrigination != address(0), "MockMorphoAdapter: Loan origination cannot be zero address");
        require(_tokenRegistry != address(0), "MockMorphoAdapter: Token registry cannot be zero address");

        loanOrigination = _loanOrigination;
        tokenRegistry = _tokenRegistry;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(LOAN_ORIGINATOR_ROLE, _loanOrigination);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Modifier to check if caller is the loan origination contract
     */
    modifier onlyLoanOriginator() {
        require(
            msg.sender == loanOrigination ||
            hasRole(LOAN_ORIGINATOR_ROLE, msg.sender),
            "MockMorphoAdapter: Caller is not the loan originator"
        );
        _;
    }

    /**
     * @dev See {IMorphoAdapter-depositCollateral}
     */
    function depositCollateral(
        uint256 loanId,
        address token,
        uint256 tokenId
    ) external override onlyLoanOriginator nonReentrant whenNotPaused returns (bool) {
        require(token != address(0), "MockMorphoAdapter: Token cannot be zero address");
        require(!_collaterals[loanId].isDeposited, "MockMorphoAdapter: Collateral already deposited");

        // Get loan details from origination contract
        ILoanOrigination.Loan memory loan = ILoanOrigination(loanOrigination).getLoan(loanId);

        // Verify loan details match
        require(loan.collateralToken == token, "MockMorphoAdapter: Token mismatch");
        require(loan.collateralTokenId == tokenId, "MockMorphoAdapter: Token ID mismatch");

        // Transfer token from loan origination to this contract
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);

        // Store collateral info
        _collaterals[loanId] = CollateralInfo({
            token: token,
            tokenId: tokenId,
            valuationAmount: loan.principal,
            isDeposited: true,
            stablecoin: loan.stablecoin
        });

        // Emit event
        emit CollateralDeposited(loanId, token, tokenId, loan.principal);

        return true;
    }

    /**
     * @dev See {IMorphoAdapter-borrowToken}
     */
    function borrowToken(
        uint256 loanId,
        address token,
        uint256 amount,
        address recipient
    ) external override onlyLoanOriginator nonReentrant whenNotPaused returns (bool) {
        require(recipient != address(0), "MockMorphoAdapter: Recipient cannot be zero address");
        require(token != address(0), "MockMorphoAdapter: Token cannot be zero address");
        require(amount > 0, "MockMorphoAdapter: Amount must be greater than zero");
        require(_collaterals[loanId].isDeposited, "MockMorphoAdapter: Collateral not deposited");

        // Store the stablecoin used for this loan
        _collaterals[loanId].stablecoin = token;

        // For demo purposes, we'll transfer tokens directly instead of borrowing from Morpho
        IERC20(token).transfer(recipient, amount);

        // Track borrowed amount
        _borrowedAmounts[loanId] = amount;

        // Emit event
        emit TokensBorrowed(loanId, recipient, token, amount);

        return true;
    }

    /**
     * @dev See {IMorphoAdapter-repayLoan}
     */
    function repayLoan(
        uint256 loanId,
        address token,
        uint256 amount
    ) external override onlyLoanOriginator nonReentrant whenNotPaused returns (bool) {
        require(token != address(0), "MockMorphoAdapter: Token cannot be zero address");
        require(amount > 0, "MockMorphoAdapter: Amount must be greater than zero");
        require(_collaterals[loanId].isDeposited, "MockMorphoAdapter: Collateral not deposited");
        require(_collaterals[loanId].stablecoin == token, "MockMorphoAdapter: Token mismatch");

        // Update repaid amount
        _repaidAmounts[loanId] += amount;

        // Emit event
        ILoanOrigination.Loan memory loan = ILoanOrigination(loanOrigination).getLoan(loanId);
        emit LoanRepaid(loanId, loan.borrower, token, amount);

        return true;
    }

    /**
     * @dev See {IMorphoAdapter-liquidateLoan}
     */
    function liquidateLoan(
        uint256 loanId,
        address token
    ) external override onlyLoanOriginator nonReentrant whenNotPaused returns (uint256) {
        require(_collaterals[loanId].isDeposited, "MockMorphoAdapter: Collateral not deposited");
        require(token != address(0), "MockMorphoAdapter: Token cannot be zero address");
        require(_collaterals[loanId].stablecoin == token, "MockMorphoAdapter: Token mismatch");

        // Calculate outstanding amount (borrowed - repaid)
        uint256 outstandingAmount = _borrowedAmounts[loanId] - _repaidAmounts[loanId];

        // Recover collateral
        _collaterals[loanId].isDeposited = false;

        // Emit event
        emit CollateralReleased(loanId, _collaterals[loanId].token, _collaterals[loanId].tokenId, address(this));

        return outstandingAmount;
    }

    /**
     * @dev See {IMorphoAdapter-releaseCollateral}
     */
    function releaseCollateral(
        uint256 loanId,
        address recipient
    ) external override onlyLoanOriginator nonReentrant whenNotPaused returns (bool) {
        require(recipient != address(0), "MockMorphoAdapter: Recipient cannot be zero address");
        require(_collaterals[loanId].isDeposited, "MockMorphoAdapter: Collateral not deposited");

        // Check if loan is fully repaid
        uint256 outstandingAmount = _borrowedAmounts[loanId] - _repaidAmounts[loanId];
        require(outstandingAmount == 0, "MockMorphoAdapter: Loan not fully repaid");

        // Transfer token to recipient
        IERC721(_collaterals[loanId].token).transferFrom(
            address(this),
            recipient,
            _collaterals[loanId].tokenId
        );

        // Mark collateral as released
        _collaterals[loanId].isDeposited = false;

        // Emit event
        emit CollateralReleased(
            loanId,
            _collaterals[loanId].token,
            _collaterals[loanId].tokenId,
            recipient
        );

        return true;
    }

    /**
     * @dev Update the loan origination address
     */
    function updateLoanOriginator(address newOriginator) external onlyRole(ADMIN_ROLE) {
        require(newOriginator != address(0), "MockMorphoAdapter: Originator cannot be zero address");

        address oldOriginator = loanOrigination;
        loanOrigination = newOriginator;

        // Revoke role from old originator
        _revokeRole(LOAN_ORIGINATOR_ROLE, oldOriginator);

        // Grant role to new originator
        _grantRole(LOAN_ORIGINATOR_ROLE, newOriginator);

        emit LoanOriginatorUpdated(oldOriginator, newOriginator);
    }

    /**
     * @dev Update the token registry address
     */
    function updateTokenRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "MockMorphoAdapter: Registry cannot be zero address");

        address oldRegistry = tokenRegistry;
        tokenRegistry = newRegistry;

        emit TokenRegistryUpdated(oldRegistry, newRegistry);
    }

    /**
     * @dev Get collateral info for a loan
     */
    function getCollateralInfo(uint256 loanId) external view returns (
        address token,
        uint256 tokenId,
        uint256 valuationAmount,
        bool isDeposited
    ) {
        CollateralInfo memory info = _collaterals[loanId];
        return (
            info.token,
            info.tokenId,
            info.valuationAmount,
            info.isDeposited
        );
    }

    /**
     * @dev Get loan status
     */
    function getLoanStatus(uint256 loanId) external view returns (
        uint256 borrowed,
        uint256 repaid,
        uint256 outstanding
    ) {
        uint256 _borrowed = _borrowedAmounts[loanId];
        uint256 _repaid = _repaidAmounts[loanId];
        uint256 _outstanding = _borrowed > _repaid ? _borrowed - _repaid : 0;

        return (_borrowed, _repaid, _outstanding);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
}