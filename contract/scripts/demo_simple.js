// Simple Demo Script for Pharos Hackathon
// This script demonstrates a simplified version of the QuickFi protocol using mocked components

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting QuickFi Simple Demo...");

  const [deployer, borrower, lender] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Borrower: ${borrower.address}`);
  console.log(`Lender: ${lender.address}`);

  // Deploy mock USDC
  console.log("\n==== Deploying Mock Contracts ====");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.waitForDeployment();
  console.log(`MockUSDC deployed to: ${await mockUSDC.getAddress()}`);

  // Deploy mock TokenizedPolicy
  const MockTokenizedPolicy = await ethers.getContractFactory("MockTokenizedPolicy");
  const mockTokenizedPolicy = await MockTokenizedPolicy.deploy(
    "Mock Tokenized Policy",
    "MTP"
  );
  await mockTokenizedPolicy.waitForDeployment();
  console.log(`MockTokenizedPolicy deployed to: ${await mockTokenizedPolicy.getAddress()}`);

  // Deploy mock PolicyOracle
  const MockPolicyOracle = await ethers.getContractFactory("MockPolicyOracle");
  const mockPolicyOracle = await MockPolicyOracle.deploy();
  await mockPolicyOracle.waitForDeployment();
  console.log(`MockPolicyOracle deployed to: ${await mockPolicyOracle.getAddress()}`);

  // Configure TokenizedPolicy to use the Oracle
  await mockTokenizedPolicy.setPolicyOracle(await mockPolicyOracle.getAddress(), true);
  console.log("TokenizedPolicy configured to use the Oracle");

  // Mint USDC to participants
  console.log("\n==== Distributing USDC ====");
  const lenderAmount = ethers.parseUnits("100000", 6);  // 100k USDC
  const borrowerAmount = ethers.parseUnits("1000", 6);  // 1k USDC

  await mockUSDC.mint(lender.address, lenderAmount);
  await mockUSDC.mint(borrower.address, borrowerAmount);

  console.log(`Minted ${ethers.formatUnits(lenderAmount, 6)} USDC to lender: ${lender.address}`);
  console.log(`Minted ${ethers.formatUnits(borrowerAmount, 6)} USDC to borrower: ${borrower.address}`);

  // Mint policy tokens to borrower
  console.log("\n==== Creating Tokenized Insurance Policies ====");
  const policyNumber = "POL-123456";
  const issuer = deployer.address;
  const valuationAmount = ethers.parseUnits("10000", 6); // $10,000 policy
  const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Insurance Policy Document"));

  await mockTokenizedPolicy.mintPolicy(
    borrower.address,
    policyNumber,
    issuer,
    valuationAmount,
    expiryDate,
    documentHash
  );
  console.log(`Minted policy token #0 to borrower: ${borrower.address}`);

  // Set policy data in the Oracle
  await mockPolicyOracle.setPolicyValuation(policyNumber, valuationAmount);
  await mockPolicyOracle.setPolicyExpiryDate(policyNumber, expiryDate);
  console.log(`Oracle updated with policy data for ${policyNumber}`);

  // Check ownership
  const owner = await mockTokenizedPolicy.ownerOf(0);
  console.log(`Policy token #0 owner: ${owner}`);

  // Get policy details
  const policyDetails = await mockTokenizedPolicy.getPolicyDetails(0);
  console.log(`Policy Details:
  - Policy Number: ${policyDetails[0]}
  - Issuer: ${policyDetails[1]}
  - Valuation: ${ethers.formatUnits(policyDetails[2], 6)} USDC
  - Expiry Date: ${new Date(Number(policyDetails[3]) * 1000).toLocaleDateString()}
  `);

  // Get policy valuation and expiry from Oracle
  const oracleValuation = await mockTokenizedPolicy.getValuation(0);
  const oracleExpiry = await mockTokenizedPolicy.getExpiryDate(0);
  console.log(`Oracle Data for Policy:
  - Valuation from Oracle: ${ethers.formatUnits(oracleValuation, 6)} USDC
  - Expiry Date from Oracle: ${new Date(Number(oracleExpiry) * 1000).toLocaleDateString()}
  `);

  // Simulate a loan process (without actual contracts)
  console.log("\n==== Simulating Loan Process ====");

  // 1. Calculate loan parameters
  const loanAmount = ethers.parseUnits("7000", 6); // $7,000 loan (70% LTV)
  const interestRate = 500; // 5.00% APR
  const loanDuration = 30 * 24 * 60 * 60; // 30 days in seconds
  const loanEndDate = new Date((Date.now() / 1000 + loanDuration) * 1000).toLocaleDateString();

  console.log(`Loan Parameters:
  - Loan Amount: ${ethers.formatUnits(loanAmount, 6)} USDC
  - Interest Rate: ${interestRate / 100}%
  - Duration: 30 days
  - End Date: ${loanEndDate}
  `);

  // 2. Simulate loan funding
  console.log("Lender funds the loan...");
  await mockUSDC.connect(lender).transfer(borrower.address, loanAmount);
  console.log(`Transferred ${ethers.formatUnits(loanAmount, 6)} USDC from lender to borrower`);

  // Check borrower's balance
  const borrowerBalance = await mockUSDC.balanceOf(borrower.address);
  console.log(`Borrower's USDC balance: ${ethers.formatUnits(borrowerBalance, 6)} USDC`);

  // 3. Simulate loan repayment
  console.log("\n==== Simulating Loan Repayment ====");

  // Calculate interest
  const interest = (loanAmount * BigInt(interestRate) * BigInt(loanDuration)) / BigInt(10000 * 365 * 24 * 60 * 60);
  const repaymentAmount = loanAmount + interest;

  console.log(`Repayment Calculation:
  - Principal: ${ethers.formatUnits(loanAmount, 6)} USDC
  - Interest: ${ethers.formatUnits(interest, 6)} USDC
  - Total Repayment: ${ethers.formatUnits(repaymentAmount, 6)} USDC
  `);

  console.log("Borrower repays the loan...");
  await mockUSDC.connect(borrower).transfer(lender.address, repaymentAmount);
  console.log(`Transferred ${ethers.formatUnits(repaymentAmount, 6)} USDC from borrower to lender`);

  // Check final balances
  const finalBorrowerBalance = await mockUSDC.balanceOf(borrower.address);
  const finalLenderBalance = await mockUSDC.balanceOf(lender.address);

  console.log(`Final Balances:
  - Borrower: ${ethers.formatUnits(finalBorrowerBalance, 6)} USDC
  - Lender: ${ethers.formatUnits(finalLenderBalance, 6)} USDC
  `);

  // 4. Mint a second policy and simulate default
  console.log("\n==== Simulating Loan Default ====");

  // Mint second policy
  const secondPolicyNumber = "POL-789012";
  await mockTokenizedPolicy.mintPolicy(
    borrower.address,
    secondPolicyNumber,
    issuer,
    valuationAmount,
    expiryDate,
    documentHash
  );
  console.log(`Minted policy token #1 to borrower: ${borrower.address}`);

  // Set policy data in the Oracle
  await mockPolicyOracle.setPolicyValuation(secondPolicyNumber, valuationAmount);
  await mockPolicyOracle.setPolicyExpiryDate(secondPolicyNumber, expiryDate);
  console.log(`Oracle updated with policy data for ${secondPolicyNumber}`);

  // Simulate loan funding
  console.log("Lender funds a second loan...");
  await mockUSDC.connect(lender).transfer(borrower.address, loanAmount);
  console.log(`Transferred ${ethers.formatUnits(loanAmount, 6)} USDC from lender to borrower`);

  // Simulate default (transfer policy to lender)
  console.log("Loan defaults, policy is liquidated...");
  await mockTokenizedPolicy.connect(borrower).transferFrom(borrower.address, lender.address, 1);
  console.log(`Policy token #1 transferred from borrower to lender`);

  // Check final ownership
  const finalOwner = await mockTokenizedPolicy.ownerOf(1);
  console.log(`Policy token #1 final owner: ${finalOwner}`);

  console.log("\n==== Demo Completed Successfully! ====");
  console.log(`
Summary:
1. Created tokenized insurance policies with Oracle integration
2. Simulated a successful loan and repayment
3. Simulated a loan default and liquidation
4. Demonstrated the complete loan lifecycle using mock components for Pharos hackathon
5. Integrated with Oracle for policy valuation and expiry date
  `);

  // Demonstrate Oracle update
  console.log("\n==== Demonstrating Oracle Update ====");

  // Update policy valuation in Oracle
  const newValuation = ethers.parseUnits("12000", 6); // Increased to $12,000
  await mockPolicyOracle.setPolicyValuation(policyNumber, newValuation);
  console.log(`Updated policy valuation in Oracle to ${ethers.formatUnits(newValuation, 6)} USDC`);

  // Get updated valuation from TokenizedPolicy
  const updatedValuation = await mockTokenizedPolicy.getValuation(0);
  console.log(`New valuation from TokenizedPolicy: ${ethers.formatUnits(updatedValuation, 6)} USDC`);

  // Request valuation update (simulating Chainlink request)
  const requestId = await mockTokenizedPolicy.requestValuationUpdate(0);
  console.log(`Requested valuation update from Oracle, request ID: ${requestId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
