// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILoanOrigination.sol";
import "../interfaces/IRiskEngine.sol";
import "../interfaces/IMorphoAdapter.sol";
import "../interfaces/ITokenizedPolicy.sol";
import "../mocks/MockTokenizedPolicy.sol";

/**
 * @title LoanOriginationWithOracle
 * @dev Enhanced implementation of the loan origination contract with Oracle integration
 * This contract extends the base LoanOrigination with Oracle notification capabilities
 */
contract LoanOriginationWithOracle is ILoanOrigination, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant LOAN_MANAGER_ROLE = keccak256("LOAN_MANAGER_ROLE");

    // Counters
    Counters.Counter private _loanIdCounter;

    // Core contract addresses
    address public immutable riskEngine;
    address public morphoAdapter;
    address public usdcToken;

    // Loans mapping
    mapping(uint256 => Loan) private _loans;

    // Borrower loans
    mapping(address => uint256[]) private _borrowerLoans;

    // Events
    event MorphoAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);
    event PolicyDefaultNotified(uint256 indexed loanId, string policyNumber, bytes32 requestId);

    /**
     * @dev Constructor
     * @param _riskEngine The risk engine address
     * @param _morphoAdapter The Morpho adapter address
     * @param _usdcToken The USDC token address
     */
    constructor(
        address _riskEngine,
        address _morphoAdapter,
        address _usdcToken
    ) {
        require(_riskEngine != address(0), "LoanOrigination: Risk engine cannot be zero address");
        require(_morphoAdapter != address(0), "LoanOrigination: Morpho adapter cannot be zero address");
        require(_usdcToken != address(0), "LoanOrigination: USDC token cannot be zero address");

        riskEngine = _riskEngine;
        morphoAdapter = _morphoAdapter;
        usdcToken = _usdcToken;

        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDATOR_ROLE, msg.sender);
        _grantRole(LOAN_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Updates the Morpho adapter address
     * @param newAdapter The new Morpho adapter address
     */
    function updateMorphoAdapter(address newAdapter) external onlyRole(ADMIN_ROLE) {
        require(newAdapter != address(0), "LoanOrigination: New adapter cannot be zero address");

        address oldAdapter = morphoAdapter;
        morphoAdapter = newAdapter;

        emit MorphoAdapterUpdated(oldAdapter, newAdapter);
    }

    /**
     * @dev See {ILoanOrigination-requestLoan}
     */
    function requestLoan(
        address collateralToken,
        uint256 collateralTokenId,
        uint256 principal,
        uint256 duration
    ) external override nonReentrant returns (uint256) {
        require(collateralToken != address(0), "LoanOrigination: Collateral token cannot be zero address");
        require(principal > 0, "LoanOrigination: Principal must be greater than zero");
        require(duration > 0, "LoanOrigination: Duration must be greater than zero");

        // Check if the borrower owns the collateral
        IERC721 token = IERC721(collateralToken);
        require(token.ownerOf(collateralTokenId) == msg.sender, "LoanOrigination: Borrower does not own the collateral");

        // Check if the collateral is approved for transfer
        require(
            token.getApproved(collateralTokenId) == address(this) ||
            token.isApprovedForAll(msg.sender, address(this)),
            "LoanOrigination: Collateral not approved for transfer"
        );

        // Get policy details
        (
            ,  // string memory policyNumber (unused here, used in _getPolicyNumber)
            ,  // address issuer (unused)
            uint256 valuationAmount,
            uint256 expiryDate,
              // bytes32 documentHash (unused)
        ) = ITokenizedPolicy(collateralToken).getPolicyDetails(collateralTokenId);

        // Check if policy is expired
        require(expiryDate > block.timestamp, "LoanOrigination: Policy is expired");

        // Check if policy valuation is sufficient
        require(valuationAmount > 0, "LoanOrigination: Policy valuation must be greater than zero");

        // Assess risk
        IRiskEngine.RiskAssessment memory assessment = IRiskEngine(riskEngine).assessRisk(
            msg.sender, // borrower
            collateralToken,
            collateralTokenId,
            principal,
            duration
        );

        // Check if loan is approved
        require(assessment.approved, "LoanOrigination: Loan not approved by risk engine");

        // Create loan
        uint256 loanId = _loanIdCounter.current();
        _loanIdCounter.increment();

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        _loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            collateralTokenId: collateralTokenId,
            collateralToken: collateralToken,
            principal: principal,
            interestRate: assessment.interestRate,
            startTime: startTime,
            duration: duration,
            endTime: endTime,
            status: LoanStatus.PENDING
        });

        // Add loan to borrower's loans
        _borrowerLoans[msg.sender].push(loanId);

        // Emit event
        emit LoanRequested(loanId, msg.sender, collateralTokenId, principal);

        return loanId;
    }

    /**
     * @dev Activates a loan by transferring the collateral and disbursing funds
     * @param loanId The loan ID
     */
    function activateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = _loans[loanId];

        require(loan.status == LoanStatus.PENDING, "LoanOrigination: Loan is not pending");
        require(loan.borrower == msg.sender, "LoanOrigination: Not the borrower");

        // Transfer collateral to Morpho via adapter
        IERC721(loan.collateralToken).transferFrom(
            msg.sender,
            address(this),
            loan.collateralTokenId
        );

        // Approve Morpho adapter to use the collateral
        IERC721(loan.collateralToken).approve(morphoAdapter, loan.collateralTokenId);

        // Deposit collateral via Morpho adapter
        bool depositSuccess = IMorphoAdapter(morphoAdapter).depositCollateral(
            loanId,
            loan.collateralToken,
            loan.collateralTokenId
        );
        require(depositSuccess, "LoanOrigination: Failed to deposit collateral");

        // Borrow USDC via Morpho adapter
        bool borrowSuccess = IMorphoAdapter(morphoAdapter).borrowUSDC(
            loanId,
            loan.principal,
            msg.sender
        );
        require(borrowSuccess, "LoanOrigination: Failed to borrow USDC");

        // Update loan status
        loan.status = LoanStatus.ACTIVE;

        // Emit event
        emit LoanActivated(loanId, msg.sender, loan.collateralTokenId, loan.principal);
    }

    /**
     * @dev See {ILoanOrigination-repayLoan}
     */
    function repayLoan(uint256 loanId, uint256 amount) external override nonReentrant {
        Loan storage loan = _loans[loanId];

        require(loan.status == LoanStatus.ACTIVE, "LoanOrigination: Loan is not active");
        require(amount > 0, "LoanOrigination: Amount must be greater than zero");

        // Calculate total repayment amount (principal + interest)
        uint256 totalRepayment = _calculateRepaymentAmount(loan);
        require(amount <= totalRepayment, "LoanOrigination: Amount exceeds total repayment");

        // Transfer USDC from borrower to this contract
        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), amount);

        // Approve Morpho adapter to use USDC
        IERC20(usdcToken).approve(morphoAdapter, amount);

        // Repay loan via Morpho adapter
        bool repaySuccess = IMorphoAdapter(morphoAdapter).repayLoan(loanId, amount);
        require(repaySuccess, "LoanOrigination: Failed to repay loan");

        // If full repayment, release collateral
        if (amount == totalRepayment) {
            bool releaseSuccess = IMorphoAdapter(morphoAdapter).releaseCollateral(
                loanId,
                loan.borrower
            );
            require(releaseSuccess, "LoanOrigination: Failed to release collateral");

            // Update loan status
            loan.status = LoanStatus.REPAID;
        }

        // Emit event
        emit LoanRepaid(loanId, loan.borrower, amount);
    }

    /**
     * @dev See {ILoanOrigination-liquidateLoan}
     * Enhanced with Oracle notification to insurance company
     */
    function liquidateLoan(uint256 loanId) external override nonReentrant {
        require(
            hasRole(LIQUIDATOR_ROLE, msg.sender) ||
            msg.sender == morphoAdapter,
            "LoanOrigination: Caller is not a liquidator or adapter"
        );

        Loan storage loan = _loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "LoanOrigination: Loan is not active");

        // Check if loan is past due
        bool isPastDue = block.timestamp > loan.endTime;

        // Check if collateral value has dropped below threshold
        bool isCollateralInsufficient = _isCollateralInsufficient(loan);

        require(isPastDue || isCollateralInsufficient, "LoanOrigination: Loan cannot be liquidated");

        // Liquidate via Morpho adapter
        // In a real implementation, this would call the Morpho adapter to liquidate the loan
        // For this demo, we'll just update the status

        // Update loan status
        loan.status = LoanStatus.LIQUIDATED;

        // Notify insurance company via Oracle
        bytes32 requestId = _notifyInsuranceCompany(loan, msg.sender);

        // Emit events
        emit LoanLiquidated(loanId, loan.borrower, loan.collateralTokenId);
        emit PolicyDefaultNotified(loanId, _getPolicyNumber(loan), requestId);
    }

    /**
     * @dev See {ILoanOrigination-getLoan}
     */
    function getLoan(uint256 loanId) external view override returns (Loan memory) {
        return _loans[loanId];
    }

    /**
     * @dev Gets all loans for a borrower
     * @param borrower The borrower address
     * @return loanIds The loan IDs
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return _borrowerLoans[borrower];
    }

    /**
     * @dev Calculates the repayment amount for a loan
     * @param loan The loan
     * @return The repayment amount
     */
    function _calculateRepaymentAmount(Loan memory loan) internal view returns (uint256) {
        // Calculate interest (APR * principal * timeElapsed / 1 year)
        uint256 timeElapsed = block.timestamp - loan.startTime;
        if (timeElapsed > loan.duration) {
            timeElapsed = loan.duration;
        }

        uint256 interest = (loan.principal * loan.interestRate * timeElapsed) / (10000 * 365 days);

        return loan.principal + interest;
    }

    /**
     * @dev Checks if the collateral value is insufficient
     * @param loan The loan
     * @return Whether the collateral value is insufficient
     */
    function _isCollateralInsufficient(Loan memory loan) internal view returns (bool) {
        // Get current collateral value
        uint256 currentValue = ITokenizedPolicy(loan.collateralToken).getValuation(loan.collateralTokenId);

        // Get liquidation threshold for this collateral
        (,uint256 liquidationThreshold,) = IRiskEngine(riskEngine).getRiskParameters(loan.collateralToken);

        // Calculate total repayment amount
        uint256 totalRepayment = _calculateRepaymentAmount(loan);

        // Check if current value * liquidation threshold < total repayment
        return (currentValue * liquidationThreshold / 10000) < totalRepayment;
    }

    /**
     * @dev Notifies the insurance company about a policy default via Oracle
     * @param loan The loan
     * @param liquidator The address that liquidated the loan
     * @return requestId The ID of the oracle request
     */
    function _notifyInsuranceCompany(Loan memory loan, address liquidator) internal returns (bytes32) {
        // Check if the collateral token supports the MockTokenizedPolicy interface
        // In a production environment, this would be a proper interface check
        try MockTokenizedPolicy(loan.collateralToken).notifyPolicyDefault(
            loan.collateralTokenId,
            liquidator,
            "Loan defaulted and liquidated"
        ) returns (bytes32 requestId) {
            return requestId;
        } catch {
            // If the collateral token doesn't support the interface, return a dummy request ID
            return bytes32(0);
        }
    }

    /**
     * @dev Gets the policy number for a loan
     * @param loan The loan
     * @return The policy number
     */
    function _getPolicyNumber(Loan memory loan) internal view returns (string memory) {
        try ITokenizedPolicy(loan.collateralToken).getPolicyDetails(loan.collateralTokenId) returns (
            string memory policyNumber,
            address,
            uint256,
            uint256,
            bytes32
        ) {
            return policyNumber;
        } catch {
            return "";
        }
    }
}
