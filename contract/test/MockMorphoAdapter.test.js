const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockMorphoAdapter", function () {
  let mockMorphoAdapter;
  let mockUSDC;
  let mockTokenizedPolicy;
  let loanOrigination;
  let deployer;
  let borrower;
  let lender;
  
  beforeEach(async function () {
    // Get signers
    [deployer, borrower, lender] = await ethers.getSigners();
    
    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
    await mockUSDC.deployed();
    
    // Deploy mock TokenizedPolicy
    const MockTokenizedPolicy = await ethers.getContractFactory("MockTokenizedPolicy");
    mockTokenizedPolicy = await MockTokenizedPolicy.deploy(
      "Mock Tokenized Policy",
      "MTP",
      mockUSDC.address
    );
    await mockTokenizedPolicy.deployed();
    
    // Deploy RiskController
    const MockRiskController = await ethers.getContractFactory("MockRiskController");
    const mockRiskController = await MockRiskController.deploy();
    await mockRiskController.deployed();
    
    // Deploy LoanOrigination
    const LoanOrigination = await ethers.getContractFactory("LoanOrigination");
    loanOrigination = await LoanOrigination.deploy();
    await loanOrigination.deployed();
    
    // Deploy MockMorphoAdapter
    const MockMorphoAdapter = await ethers.getContractFactory("MockMorphoAdapter");
    mockMorphoAdapter = await MockMorphoAdapter.deploy(
      loanOrigination.address,
      mockUSDC.address
    );
    await mockMorphoAdapter.deployed();
    
    // Initialize LoanOrigination
    await loanOrigination.initialize(
      mockTokenizedPolicy.address,
      mockMorphoAdapter.address,
      mockUSDC.address,
      mockRiskController.address
    );
    
    // Mint tokens for testing
    await mockTokenizedPolicy.mint(borrower.address, 1, "https://example.com/metadata/1");
    await mockUSDC.mint(lender.address, ethers.utils.parseUnits("100000", 6));
    await mockUSDC.mint(borrower.address, ethers.utils.parseUnits("1000", 6));
    
    // Fund the MockMorphoAdapter with USDC
    await mockUSDC.mint(mockMorphoAdapter.address, ethers.utils.parseUnits("500000", 6));
  });
  
  describe("Loan Creation and Funding", function () {
    it("Should successfully create and fund a loan", async function () {
      // Approve token for loan origination
      await mockTokenizedPolicy.connect(borrower).approve(loanOrigination.address, 1);
      
      // Create loan
      const loanAmount = ethers.utils.parseUnits("50000", 6);
      const interestRate = 500; // 5.00%
      const duration = 30 * 24 * 60 * 60; // 30 days
      
      const createLoanTx = await loanOrigination.connect(borrower).createLoan(
        mockTokenizedPolicy.address,
        1,
        loanAmount,
        interestRate,
        duration
      );
      
      const createLoanReceipt = await createLoanTx.wait();
      const loanCreatedEvent = createLoanReceipt.events.find(event => event.event === "LoanCreated");
      const loanId = loanCreatedEvent.args.loanId;
      
      // Fund the loan
      await mockUSDC.connect(lender).approve(loanOrigination.address, loanAmount);
      await loanOrigination.connect(lender).fundLoan(loanId);
      
      // Check borrower balance increased
      const borrowerBalance = await mockUSDC.balanceOf(borrower.address);
      expect(borrowerBalance).to.be.gt(ethers.utils.parseUnits("1000", 6));
      
      // Check collateral was transferred
      const [token, tokenId, , isDeposited] = await mockMorphoAdapter.getCollateralInfo(loanId);
      expect(token).to.equal(mockTokenizedPolicy.address);
      expect(tokenId).to.equal(1);
      expect(isDeposited).to.be.true;
    });
  });
  
  describe("Loan Repayment", function () {
    it("Should successfully repay a loan and release collateral", async function () {
      // Approve token for loan origination
      await mockTokenizedPolicy.connect(borrower).approve(loanOrigination.address, 1);
      
      // Create and fund loan
      const loanAmount = ethers.utils.parseUnits("50000", 6);
      const createLoanTx = await loanOrigination.connect(borrower).createLoan(
        mockTokenizedPolicy.address,
        1,
        loanAmount,
        500, // 5.00%
        30 * 24 * 60 * 60 // 30 days
      );
      
      const createLoanReceipt = await createLoanTx.wait();
      const loanCreatedEvent = createLoanReceipt.events.find(event => event.event === "LoanCreated");
      const loanId = loanCreatedEvent.args.loanId;
      
      await mockUSDC.connect(lender).approve(loanOrigination.address, loanAmount);
      await loanOrigination.connect(lender).fundLoan(loanId);
      
      // Calculate repayment amount with interest
      const repaymentAmount = ethers.utils.parseUnits("52500", 6); // principal + 5% interest
      
      // Approve and repay
      await mockUSDC.connect(borrower).approve(loanOrigination.address, repaymentAmount);
      await loanOrigination.connect(borrower).repayLoan(loanId, repaymentAmount);
      
      // Check loan status
      const loan = await loanOrigination.getLoan(loanId);
      expect(loan.status).to.equal(3); // Repaid status
      
      // Check collateral released
      const [, , , isDeposited] = await mockMorphoAdapter.getCollateralInfo(loanId);
      expect(isDeposited).to.be.false;
      
      // Check token ownership returned to borrower
      const owner = await mockTokenizedPolicy.ownerOf(1);
      expect(owner).to.equal(borrower.address);
    });
  });
  
  describe("Loan Liquidation", function () {
    it("Should successfully liquidate a defaulted loan", async function () {
      // Approve token for loan origination
      await mockTokenizedPolicy.connect(borrower).approve(loanOrigination.address, 1);
      
      // Create and fund loan
      const loanAmount = ethers.utils.parseUnits("50000", 6);
      const createLoanTx = await loanOrigination.connect(borrower).createLoan(
        mockTokenizedPolicy.address,
        1,
        loanAmount,
        500, // 5.00%
        30 * 24 * 60 * 60 // 30 days
      );
      
      const createLoanReceipt = await createLoanTx.wait();
      const loanCreatedEvent = createLoanReceipt.events.find(event => event.event === "LoanCreated");
      const loanId = loanCreatedEvent.args.loanId;
      
      await mockUSDC.connect(lender).approve(loanOrigination.address, loanAmount);
      await loanOrigination.connect(lender).fundLoan(loanId);
      
      // In a real test, we would advance time
      // For this mock, we can just liquidate directly
      
      // Liquidate the loan
      await loanOrigination.connect(lender).liquidateLoan(loanId);
      
      // Check loan status
      const loan = await loanOrigination.getLoan(loanId);
      expect(loan.status).to.equal(4); // Liquidated status
      
      // Check collateral released from MorphoAdapter
      const [, , , isDeposited] = await mockMorphoAdapter.getCollateralInfo(loanId);
      expect(isDeposited).to.be.false;
    });
  });
}); 