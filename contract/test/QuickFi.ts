/// <reference types="mocha" />

import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("QuickFi", function () {
  async function deployQuickFiFixture() {
    const [owner, user] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6) as Contract;
    await mockUSDC.waitForDeployment();

    // Deploy TokenizedPolicy
    const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
    const tokenizedPolicy = await TokenizedPolicy.deploy("Insurance Policy Token", "IPT") as Contract;
    await tokenizedPolicy.waitForDeployment();

    // Deploy RiskEngine
    const RiskEngine = await ethers.getContractFactory("RiskEngine");
    const riskEngine = await RiskEngine.deploy();
    await riskEngine.waitForDeployment();

    // Deploy LoanOrigination with placeholder
    const LoanOrigination = await ethers.getContractFactory("LoanOrigination");
    const loanOrigination = await LoanOrigination.deploy(
      await riskEngine.getAddress(),
      owner.address,
      await mockUSDC.getAddress()
    ) as Contract;
    await loanOrigination.waitForDeployment();

    // Deploy MorphoAdapter
    const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
    const morphoAdapter = await MorphoAdapter.deploy(
      await loanOrigination.getAddress(),
      await mockUSDC.getAddress()
    ) as Contract;

    // Update LoanOrigination with correct MorphoAdapter
    await loanOrigination.updateMorphoAdapter(await morphoAdapter.getAddress());

    // Set risk parameters
    await riskEngine.updateRiskParameters(
      await tokenizedPolicy.getAddress(),
      7000, // 70% max LTV
      8500, // 85% liquidation threshold
      500   // 5% base interest rate
    );

    // Mint USDC to MorphoAdapter
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1,000,000 USDC
    await mockUSDC.mint(await morphoAdapter.getAddress(), usdcAmount);

    // Mint some USDC to user for testing
    await mockUSDC.mint(user.address, ethers.parseUnits("10000", 6)); // 10,000 USDC

    return {
      owner,
      user,
      mockUSDC,
      tokenizedPolicy,
      riskEngine,
      loanOrigination,
      morphoAdapter
    };
  }

  describe("TokenizedPolicy", function () {
    it("Should mint a new tokenized policy", async function () {
      const { tokenizedPolicy, user } = await deployQuickFiFixture();

      const now = Math.floor(Date.now() / 1000);
      const expiryDate = now + 365 * 24 * 60 * 60; // 1 year from now
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Insurance Policy Document"));

      // Mint a policy
      await tokenizedPolicy.mintPolicy(
        user.address,
        "POL-123456",
        await tokenizedPolicy.getAddress(), // Use contract itself as issuer for test
        ethers.parseUnits("10000", 6), // 10,000 USDC valuation
        expiryDate,
        documentHash
      );

      // Check policy details
      const [policyNumber, issuer, valuationAmount, policyExpiryDate] = await tokenizedPolicy.getPolicyDetails(0);
      
      expect(policyNumber).to.equal("POL-123456");
      expect(issuer).to.equal(await tokenizedPolicy.getAddress());
      expect(valuationAmount).to.equal(ethers.parseUnits("10000", 6));
      expect(policyExpiryDate).to.equal(expiryDate);
    });

    it("Should update the valuation of a policy", async function () {
      const { tokenizedPolicy, user } = await deployQuickFiFixture();

      const now = Math.floor(Date.now() / 1000);
      const expiryDate = now + 365 * 24 * 60 * 60; // 1 year from now
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Insurance Policy Document"));

      // Mint a policy
      await tokenizedPolicy.mintPolicy(
        user.address,
        "POL-123456",
        await tokenizedPolicy.getAddress(),
        ethers.parseUnits("10000", 6),
        expiryDate,
        documentHash
      );

      // Update valuation
      await tokenizedPolicy.updateValuation(0, ethers.parseUnits("12000", 6));

      // Check updated valuation
      const [,,valuationAmount,] = await tokenizedPolicy.getPolicyDetails(0);
      expect(valuationAmount).to.equal(ethers.parseUnits("12000", 6));
    });
  });

  describe("RiskEngine", function () {
    it("Should assess risk correctly", async function () {
      const { riskEngine, tokenizedPolicy, user } = await deployQuickFiFixture();

      const now = Math.floor(Date.now() / 1000);
      const expiryDate = now + 365 * 24 * 60 * 60; // 1 year from now
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Insurance Policy Document"));

      // Mint a policy
      await tokenizedPolicy.mintPolicy(
        user.address,
        "POL-123456",
        await tokenizedPolicy.getAddress(),
        ethers.parseUnits("10000", 6),
        expiryDate,
        documentHash
      );

      // Assess risk for a loan request
      const assessment = await riskEngine.assessRisk(
        user.address,
        await tokenizedPolicy.getAddress(),
        0,
        ethers.parseUnits("5000", 6), // 5,000 USDC loan request
        30 * 24 * 60 * 60 // 30 days duration
      );

      // Check risk assessment
      expect(assessment.approved).to.be.true;
      expect(assessment.maxLoanAmount).to.equal(ethers.parseUnits("7000", 6)); // 70% of 10,000
      expect(assessment.recommendedLTV).to.equal(5000); // 50%
    });

    it("Should reject loan if requested amount exceeds max LTV", async function () {
      const { riskEngine, tokenizedPolicy, user } = await deployQuickFiFixture();

      const now = Math.floor(Date.now() / 1000);
      const expiryDate = now + 365 * 24 * 60 * 60; // 1 year from now
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Insurance Policy Document"));

      // Mint a policy
      await tokenizedPolicy.mintPolicy(
        user.address,
        "POL-123456",
        await tokenizedPolicy.getAddress(),
        ethers.parseUnits("10000", 6),
        expiryDate,
        documentHash
      );

      // Assess risk for a loan request that exceeds max LTV
      const assessment = await riskEngine.assessRisk(
        user.address,
        await tokenizedPolicy.getAddress(),
        0,
        ethers.parseUnits("8000", 6), // 8,000 USDC loan request (exceeds 70% LTV)
        30 * 24 * 60 * 60 // 30 days duration
      );

      // Check risk assessment
      expect(assessment.approved).to.be.false;
      expect(assessment.reason).to.equal("Requested amount exceeds maximum LTV");
    });
  });

  describe("Loan Flow", function () {
    it("Should execute full loan lifecycle", async function () {
      const { user, mockUSDC, tokenizedPolicy, loanOrigination, morphoAdapter } = await deployQuickFiFixture();

      const now = Math.floor(Date.now() / 1000);
      const expiryDate = now + 365 * 24 * 60 * 60; // 1 year from now
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Insurance Policy Document"));

      // Mint a policy
      await tokenizedPolicy.mintPolicy(
        user.address,
        "POL-123456",
        await tokenizedPolicy.getAddress(),
        ethers.parseUnits("10000", 6),
        expiryDate,
        documentHash
      );

      // Approve token for loan origination
      await (tokenizedPolicy as any).connect(user).approve(await loanOrigination.getAddress(), 0);

      // Request loan
      await (loanOrigination as any).connect(user).requestLoan(
        await tokenizedPolicy.getAddress(),
        0,
        ethers.parseUnits("5000", 6), // 5,000 USDC loan
        30 * 24 * 60 * 60 // 30 days
      );

      // Activate the loan
      await (loanOrigination as any).connect(user).activateLoan(0);

      // Check loan status
      const loan = await loanOrigination.getLoan(0);
      expect(loan.status).to.equal(2); // ACTIVE

      // Check funds were received
      expect(await mockUSDC.balanceOf(user.address)).to.equal(ethers.parseUnits("15000", 6)); // 10,000 initial + 5,000 loan

      // Approve USDC for repayment
      await (mockUSDC as any).connect(user).approve(await loanOrigination.getAddress(), ethers.parseUnits("5050", 6));

      // Repay loan (principal + small interest)
      await (loanOrigination as any).connect(user).repayLoan(0, ethers.parseUnits("5050", 6));

      // Check loan status after repayment
      const loanAfterRepay = await loanOrigination.getLoan(0);
      expect(loanAfterRepay.status).to.equal(3); // REPAID

      // Check collateral was returned
      expect(await tokenizedPolicy.ownerOf(0)).to.equal(user.address);
    });
  });
}); 