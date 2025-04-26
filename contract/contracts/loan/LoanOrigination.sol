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
import "../interfaces/ITokenRegistry.sol";
import "../mocks/MockTokenizedPolicy.sol";

/**
 * @title LoanOrigination
 * @dev Implementation of the loan origination contract based on Perimeter Protocol
 */
contract LoanOrigination is ILoanOrigination, AccessControl, ReentrancyGuard {
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
    address public tokenRegistry;

    // Loans mapping
    mapping(uint256 => Loan) private _loans;

    // Borrower loans mapping
    mapping(address => uint256[]) private _borrowerLoans;

    // Collateral token approvals
    mapping(address => mapping(uint256 => bool)) private _collateralApprovals;

    // Events
    event MorphoAdapterUpdated(
        address indexed oldAdapter,
        address indexed newAdapter
    );
    event TokenRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry
    );
    event CollateralApproved(
        address indexed borrower,
        address indexed token,
        uint256 tokenId
    );
    event PolicyDefaultNotified(
        uint256 indexed loanId,
        string policyNumber,
        bytes32 requestId
    );
    event LoanDefaulted(uint256 indexed loanId);

    /**
     * @dev Constructor for the LoanOrigination contract
     * @param _riskEngine The address of the risk engine contract
     * @param _morphoAdapter The address of the Morpho adapter contract
     * @param _tokenRegistry The address of the token registry contract
     */
    constructor(
        address _riskEngine,
        address _morphoAdapter,
        address _tokenRegistry
    ) {
        require(
            _riskEngine != address(0),
            "LoanOrigination: Risk engine cannot be zero address"
        );
        require(
            _morphoAdapter != address(0),
            "LoanOrigination: Morpho adapter cannot be zero address"
        );
        require(
            _tokenRegistry != address(0),
            "LoanOrigination: Token registry cannot be zero address"
        );

        riskEngine = _riskEngine;
        morphoAdapter = _morphoAdapter;
        tokenRegistry = _tokenRegistry;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDATOR_ROLE, msg.sender);
        _grantRole(LOAN_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev See {ILoanOrigination-requestLoan}
     */
    function requestLoan(
        address collateralToken,
        uint256 collateralTokenId,
        uint256 principal,
        uint256 duration,
        address stablecoin
    ) external override nonReentrant returns (uint256) {
        require(
            collateralToken != address(0),
            "LoanOrigination: Collateral token cannot be zero address"
        );
        require(
            principal > 0,
            "LoanOrigination: Principal must be greater than zero"
        );
        require(
            duration > 0,
            "LoanOrigination: Duration must be greater than zero"
        );
        require(
            stablecoin != address(0),
            "LoanOrigination: Stablecoin cannot be zero address"
        );

        // Check if stablecoin is supported
        require(
            ITokenRegistry(tokenRegistry).isTokenSupported(stablecoin),
            "LoanOrigination: Stablecoin not supported"
        );

        // Get token info
        ITokenRegistry.TokenInfo memory tokenInfo = ITokenRegistry(
            tokenRegistry
        ).getTokenInfo(stablecoin);

        // Check loan amount limits
        require(
            principal >= tokenInfo.minLoanAmount,
            "LoanOrigination: Principal below minimum"
        );
        require(
            principal <= tokenInfo.maxLoanAmount,
            "LoanOrigination: Principal above maximum"
        );

        // Check if the borrower owns the collateral
        IERC721 token = IERC721(collateralToken);
        require(
            token.ownerOf(collateralTokenId) == msg.sender,
            "LoanOrigination: Borrower does not own the collateral"
        );

        // Check if the token is approved for transfer
        require(
            token.getApproved(collateralTokenId) == address(this) ||
                token.isApprovedForAll(msg.sender, address(this)),
            "LoanOrigination: Collateral not approved for transfer"
        );

        // Get policy details from Oracle
        (
            ,
            ,
            // string memory policyNumber (unused here)
            // address issuer (unused)
            uint256 valuationAmount,
            uint256 expiryDate,

        ) = // bytes32 documentHash (unused)
            ITokenizedPolicy(collateralToken).getPolicyDetails(
                collateralTokenId
            );

        // Check if policy is expired
        require(
            expiryDate > block.timestamp,
            "LoanOrigination: Policy is expired"
        );

        // Check if policy valuation is sufficient
        require(
            valuationAmount > 0,
            "LoanOrigination: Policy valuation must be greater than zero"
        );

        // Get current valuation from Oracle
        uint256 currentValuation = ITokenizedPolicy(collateralToken)
            .getValuation(collateralTokenId);
        require(
            currentValuation > 0,
            "LoanOrigination: Oracle valuation must be greater than zero"
        );

        // Assess risk
        IRiskEngine.RiskAssessment memory assessment = IRiskEngine(riskEngine)
            .assessRisk(
                msg.sender,
                collateralToken,
                collateralTokenId,
                principal,
                duration
            );

        // Check if loan is approved
        require(
            assessment.approved,
            "LoanOrigination: Loan not approved by risk engine"
        );

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
            status: LoanStatus.PENDING,
            stablecoin: stablecoin,
            repaidAmount: 0
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

        require(
            loan.status == LoanStatus.PENDING,
            "LoanOrigination: Loan is not pending"
        );
        require(
            loan.borrower == msg.sender,
            "LoanOrigination: Not the borrower"
        );

        // Transfer collateral to Morpho via adapter
        IERC721(loan.collateralToken).transferFrom(
            msg.sender,
            address(this),
            loan.collateralTokenId
        );

        // Approve Morpho adapter to use the collateral
        IERC721(loan.collateralToken).approve(
            morphoAdapter,
            loan.collateralTokenId
        );

        // Deposit collateral via Morpho adapter
        bool depositSuccess = IMorphoAdapter(morphoAdapter).depositCollateral(
            loanId,
            loan.collateralToken,
            loan.collateralTokenId
        );
        require(
            depositSuccess,
            "LoanOrigination: Failed to deposit collateral"
        );

        // Borrow stablecoin via Morpho adapter
        bool borrowSuccess = IMorphoAdapter(morphoAdapter).borrowToken(
            loanId,
            loan.stablecoin,
            loan.principal,
            msg.sender
        );
        require(borrowSuccess, "LoanOrigination: Failed to borrow stablecoin");

        // Update loan status
        loan.status = LoanStatus.ACTIVE;
        loan.startTime = block.timestamp;
        loan.endTime = block.timestamp + loan.duration;

        // Emit event
        emit LoanActivated(
            loanId,
            msg.sender,
            loan.collateralTokenId,
            loan.principal
        );
    }

    /**
     * @dev See {ILoanOrigination-repayLoan}
     */
    function repayLoan(
        uint256 loanId,
        uint256 amount
    ) external override nonReentrant {
        Loan storage loan = _loans[loanId];

        require(
            loan.status == LoanStatus.ACTIVE,
            "LoanOrigination: Loan is not active"
        );
        require(
            amount > 0,
            "LoanOrigination: Amount must be greater than zero"
        );

        // Calculate remaining repayment amount (principal + interest)
        uint256 totalRepayment = _calculateRepaymentAmount(loan);
        uint256 remainingRepayment = totalRepayment - loan.repaidAmount;
        
        require(remainingRepayment > 0, "LoanOrigination: Loan is already fully repaid");

        // If amount exceeds remaining repayment, cap it at remaining repayment
        uint256 actualRepaymentAmount = amount > remainingRepayment ? remainingRepayment : amount;

        // Transfer stablecoin from borrower to this contract
        IERC20(loan.stablecoin).safeTransferFrom(msg.sender, address(this), actualRepaymentAmount);

        // Approve Morpho adapter to use stablecoin
        IERC20(loan.stablecoin).approve(morphoAdapter, actualRepaymentAmount);

        // Repay loan via Morpho adapter
        bool repaySuccess = IMorphoAdapter(morphoAdapter).repayLoan(
            loanId,
            loan.stablecoin,
            actualRepaymentAmount
        );
        require(repaySuccess, "LoanOrigination: Failed to repay loan");

        // Update repaid amount in the loan struct
        loan.repaidAmount += actualRepaymentAmount;

        // If fully repaid
        if (loan.repaidAmount >= totalRepayment) {
            bool releaseSuccess = IMorphoAdapter(morphoAdapter).releaseCollateral(
                loanId,
                loan.borrower
            );
            require(releaseSuccess, "LoanOrigination: Failed to release collateral");

            loan.status = LoanStatus.REPAID;
        }

        emit LoanRepaid(loanId, loan.borrower, actualRepaymentAmount);
    }

    /**
     * @dev See {ILoanOrigination-liquidateLoan}
     */
    function liquidateLoan(uint256 loanId) external override nonReentrant {
        require(
            hasRole(LIQUIDATOR_ROLE, msg.sender) || msg.sender == morphoAdapter,
            "LoanOrigination: Caller is not a liquidator or adapter"
        );

        Loan storage loan = _loans[loanId];
        require(
            loan.status == LoanStatus.ACTIVE,
            "LoanOrigination: Loan is not active"
        );

        // Get the stablecoin from the loan
        address stablecoin = loan.stablecoin;

        // Check if loan is past due
        bool isPastDue = block.timestamp > loan.endTime;

        // Check if collateral value has dropped below threshold
        bool isCollateralInsufficient = _isCollateralInsufficient(loan);

        require(
            isPastDue || isCollateralInsufficient,
            "LoanOrigination: Loan cannot be liquidated"
        );

        // Liquidate via Morpho adapter
        IMorphoAdapter(morphoAdapter).liquidateLoan(loanId, stablecoin);

        // Update loan status
        loan.status = LoanStatus.LIQUIDATED;

        // Emit event
        emit LoanLiquidated(loanId, loan.borrower, loan.collateralTokenId);

        // Notify insurance company about the default
        bytes32 requestId = _notifyInsuranceCompany(loan, msg.sender);
        emit PolicyDefaultNotified(loanId, _getPolicyNumber(loan), requestId);
    }

    /**
     * @dev See {ILoanOrigination-getLoan}
     */
    function getLoan(
        uint256 loanId
    ) external view override returns (Loan memory) {
        return _loans[loanId];
    }

    /**
     * @dev Get all loans for a borrower
     * @param borrower The borrower address
     * @return loanIds Array of loan IDs
     */
    function getBorrowerLoans(
        address borrower
    ) external view returns (uint256[] memory) {
        return _borrowerLoans[borrower];
    }

    /**
     * @dev Update the Morpho adapter address
     * @param newAdapter The new Morpho adapter address
     */
    function updateMorphoAdapter(address newAdapter) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "LoanOrigination: Must have admin role"
        );
        require(
            newAdapter != address(0),
            "LoanOrigination: Adapter cannot be zero address"
        );

        address oldAdapter = morphoAdapter;
        morphoAdapter = newAdapter;

        emit MorphoAdapterUpdated(oldAdapter, newAdapter);
    }

    /**
     * @dev Update the token registry address
     * @param newRegistry The new token registry address
     */
    function updateTokenRegistry(address newRegistry) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "LoanOrigination: Must have admin role"
        );
        require(
            newRegistry != address(0),
            "LoanOrigination: Registry cannot be zero address"
        );

        address oldRegistry = tokenRegistry;
        tokenRegistry = newRegistry;

        emit TokenRegistryUpdated(oldRegistry, newRegistry);
    }

    /**
     * @dev Get the total repayment amount for a loan
     * @param loanId The loan ID
     * @return amount The total repayment amount
     */
    function getTotalRepaymentAmount(
        uint256 loanId
    ) external view returns (uint256) {
        return _calculateRepaymentAmount(_loans[loanId]);
    }

    /**
     * @dev Calculate the total repayment amount (principal + interest)
     * @param loan The loan
     * @return amount The total repayment amount
     */
    function _calculateRepaymentAmount(
        Loan memory loan
    ) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp > loan.endTime
            ? loan.duration
            : block.timestamp - loan.startTime;

        // Calculate interest (APR * principal * timeElapsed / 1 year)
        uint256 interest = (loan.interestRate * loan.principal * timeElapsed) /
            (10000 * 365 days);

        return loan.principal + interest;
    }

    /**
     * @dev Check if collateral value is insufficient
     * @param loan The loan
     * @return isInsufficient Whether the collateral is insufficient
     */
    function _isCollateralInsufficient(
        Loan memory loan
    ) internal view returns (bool) {
        // Get current collateral value from Oracle
        uint256 currentValue = ITokenizedPolicy(loan.collateralToken)
            .getValuation(loan.collateralTokenId);

        // Get liquidation threshold for this collateral
        (, uint256 liquidationThreshold, ) = IRiskEngine(riskEngine)
            .getRiskParameters(loan.collateralToken);

        // Calculate total repayment amount
        uint256 totalRepayment = _calculateRepaymentAmount(loan);

        // Check if current value * liquidation threshold < total repayment
        return ((currentValue * liquidationThreshold) / 10000) < totalRepayment;
    }

    /**
     * @dev Notifies the insurance company about a policy default via Oracle
     * Only used when Oracle integration is enabled
     * @param loan The loan
     * @param liquidator The address that liquidated the loan
     * @return requestId The ID of the oracle request
     */
    function _notifyInsuranceCompany(
        Loan memory loan,
        address liquidator
    ) internal returns (bytes32) {
        // Check if the collateral token supports the MockTokenizedPolicy interface
        // In a production environment, this would be a proper interface check
        try
            MockTokenizedPolicy(loan.collateralToken).notifyPolicyDefault(
                loan.collateralTokenId,
                liquidator,
                "Loan defaulted and liquidated"
            )
        returns (bytes32 requestId) {
            return requestId;
        } catch {
            // If the collateral token doesn't support the interface, return a dummy request ID
            return bytes32(0);
        }
    }

    /**
     * @dev Gets the policy number for a loan
     * Only used when Oracle integration is enabled
     * @param loan The loan
     * @return The policy number
     */
    function _getPolicyNumber(
        Loan memory loan
    ) internal view returns (string memory) {
        try
            ITokenizedPolicy(loan.collateralToken).getPolicyDetails(
                loan.collateralTokenId
            )
        returns (
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

    function getRemainingRepayment(
        uint256 loanId
    ) external view override returns (uint256) {
        Loan memory loan = _loans[loanId];
        uint256 totalRepayment = _calculateRepaymentAmount(loan);
        return totalRepayment - loan.repaidAmount;
    }
}
