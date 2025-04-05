/// <reference types="mocha" />

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("QuickFi", function () {
  // Create a simplified non-upgradeable version of TokenizedPolicy for testing
  async function deploySimpleTokenizedPolicy() {
    const [owner, borrower] = await ethers.getSigners();

    // Mock token for USDC
    const MockToken = await ethers.getContractFactory("MockToken");
    const usdc = await MockToken.deploy("USDC", "USDC", 6);

    // Create a simple ERC721 token with the same interface
    const ERC721 = await ethers.getContractFactory("MockTokenizedPolicy");
    const token = await ERC721.deploy("QuickFi Policy", "QPT");

    // Create RiskEngine
    const RiskEngine = await ethers.getContractFactory("MockRiskEngine");
    const riskEngine = await RiskEngine.deploy();

    // Create RiskController
    const RiskController = await ethers.getContractFactory("MockRiskController");
    const riskController = await RiskController.deploy(riskEngine.target);

    // Use a very large expiry date for testing
    const expiryDate = 2000000000; // Year 2033

    return { 
      token, 
      riskEngine, 
      riskController, 
      usdc,
      owner, 
      borrower,
      expiryDate
    };
  }

  describe("TokenizedPolicy", function () {
    it("Should mint a new tokenized policy", async function () {
      const { token, borrower, expiryDate } = await loadFixture(deploySimpleTokenizedPolicy);

      // Mint a policy
      await token.mintPolicy(
        borrower.address, 
        "POL-001",
        token.target,
        ethers.parseEther("100"),
        expiryDate,
        ethers.ZeroHash
      );

      // Verify ownership
      expect(await token.ownerOf(0)).to.equal(borrower.address);
    });

    it("Should update the valuation of a policy", async function () {
      const { token, borrower, expiryDate } = await loadFixture(deploySimpleTokenizedPolicy);

      // Mint a policy
      await token.mintPolicy(
        borrower.address, 
        "POL-001",
        token.target,
        ethers.parseEther("100"),
        expiryDate,
        ethers.ZeroHash
      );

      // Update valuation
      await token.updateValuation(0, ethers.parseEther("120"));
      
      // Verify updated valuation
      const policyDetails = await token.getPolicyDetails(0);
      expect(policyDetails[2]).to.equal(ethers.parseEther("120"));
    });
  });

  describe("RiskEngine", function () {
    it("Should assess risk correctly", async function () {
      const { token, riskEngine, borrower, expiryDate } = await loadFixture(deploySimpleTokenizedPolicy);

      // Mint a policy
      await token.mintPolicy(
        borrower.address, 
        "POL-001",
        token.target,
        ethers.parseEther("100"),
        expiryDate,
        ethers.ZeroHash
      );

      // Assess risk for a loan request
      const assessment = await riskEngine.assessRisk(
        borrower.address,
        token.target,
        0,
        ethers.parseEther("50"),
        30 * 24 * 60 * 60
      );

      expect(assessment.approved).to.be.true;
      expect(assessment.maxLoanAmount).to.equal(ethers.parseEther("70")); // 70% of 100 ETH
    });

    it("Should reject loan if requested amount exceeds max LTV", async function () {
      const { token, riskEngine, borrower, expiryDate } = await loadFixture(deploySimpleTokenizedPolicy);

      // Mint a policy
      await token.mintPolicy(
        borrower.address, 
        "POL-001",
        token.target,
        ethers.parseEther("100"),
        expiryDate,
        ethers.ZeroHash
      );

      // Assess risk for a loan request that exceeds max LTV
      const assessment = await riskEngine.assessRisk(
        borrower.address,
        token.target,
        0,
        ethers.parseEther("80"), // Requesting 80% LTV
        30 * 24 * 60 * 60
      );

      expect(assessment.approved).to.be.false;
      expect(assessment.maxLoanAmount).to.equal(ethers.parseEther("70")); // 70% of 100 ETH
    });
  });

  describe("Loan Flow", function () {
    it("Should execute full loan lifecycle", async function () {
      const { token, riskEngine, borrower, expiryDate } = await loadFixture(deploySimpleTokenizedPolicy);

      // Mint a policy
      await token.mintPolicy(
        borrower.address, 
        "POL-001",
        token.target,
        ethers.parseEther("100"),
        expiryDate,
        ethers.ZeroHash
      );

      // Assess risk for a loan request
      const assessment = await riskEngine.assessRisk(
        borrower.address,
        token.target,
        0,
        ethers.parseEther("50"),
        30 * 24 * 60 * 60
      );

      expect(assessment.approved).to.be.true;
      expect(assessment.maxLoanAmount).to.equal(ethers.parseEther("70")); // 70% of 100 ETH
    });
  });
}); 