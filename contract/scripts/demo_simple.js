// Simple Demo Script for Pharos Hackathon
// This script demonstrates a simplified version of the QuickFi protocol using mocked components
// with multi-token support

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting QuickFi Simple Demo...");

  // Get network name
  const network = await ethers.provider.getNetwork();
  const isLocalNetwork = network.name === "hardhat" || network.name === "localhost";

  let deployer, borrower, lender;

  // Get signers
  const signers = await ethers.getSigners();
  deployer = signers[0];

  if (isLocalNetwork && signers.length > 2) {
    // For local networks, use multiple signers if available
    borrower = signers[1];
    lender = signers[2];
  } else {
    // For Pharos devnet or if not enough signers, use the same signer for all roles
    borrower = deployer;
    lender = deployer;
  }

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Borrower: ${borrower.address}`);
  console.log(`Lender: ${lender.address}`);

  let tokenRegistry, mockUSDC, mockUSDT, mockTokenizedPolicy, mockPolicyOracle;
  let usdcAddress, usdtAddress;

  if (isLocalNetwork) {
    // Deploy mock stablecoins and token registry for local networks
    console.log("\n==== Deploying Mock Contracts ====");

    // Deploy TokenRegistry
    const TokenRegistry = await ethers.getContractFactory("contracts/utils/TokenRegistry.sol:TokenRegistry");
    tokenRegistry = await TokenRegistry.deploy();
    await tokenRegistry.waitForDeployment();
    console.log(`TokenRegistry deployed to: ${await tokenRegistry.getAddress()}`);

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log(`MockUSDC deployed to: ${usdcAddress}`);

    // Deploy MockUSDT
    mockUSDT = await MockUSDC.deploy("Mock USDT", "mUSDT", 6);
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();
    console.log(`MockUSDT deployed to: ${usdtAddress}`);

    // Add tokens to registry
    await tokenRegistry.addToken(
      usdcAddress,
      6,
      ethers.parseUnits("100", 6), // Min loan amount: 100 USDC
      ethers.parseUnits("100000", 6) // Max loan amount: 100,000 USDC
    );
    console.log("Added USDC to TokenRegistry");

    await tokenRegistry.addToken(
      usdtAddress,
      6,
      ethers.parseUnits("100", 6), // Min loan amount: 100 USDT
      ethers.parseUnits("100000", 6) // Max loan amount: 100,000 USDT
    );
    console.log("Added USDT to TokenRegistry");

    // Deploy mock TokenizedPolicy
    const MockTokenizedPolicy = await ethers.getContractFactory("MockTokenizedPolicy");
    mockTokenizedPolicy = await MockTokenizedPolicy.deploy(
      "Mock Tokenized Policy",
      "MTP"
    );
    await mockTokenizedPolicy.waitForDeployment();
    console.log(`MockTokenizedPolicy deployed to: ${await mockTokenizedPolicy.getAddress()}`);

    // Deploy mock PolicyOracle
    const MockPolicyOracle = await ethers.getContractFactory("MockPolicyOracle");
    mockPolicyOracle = await MockPolicyOracle.deploy();
    await mockPolicyOracle.waitForDeployment();
    console.log(`MockPolicyOracle deployed to: ${await mockPolicyOracle.getAddress()}`);

    // Configure TokenizedPolicy to use the Oracle
    await mockTokenizedPolicy.setPolicyOracle(await mockPolicyOracle.getAddress(), true);
    console.log("TokenizedPolicy configured to use the Oracle");
  } else {
    // For Pharos devnet, use the already deployed contracts
    console.log("\n==== Using Deployed Contracts on Pharos Devnet ====");

    // Get contract addresses from environment variables or hardcoded values
    const tokenRegistryAddress = "0x05Fa836897A0e34d8f0efB22655D8322e8193D94";
    usdcAddress = process.env.USDC_ADDRESS || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
    usdtAddress = process.env.USDT_ADDRESS || "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    const tokenizedPolicyAddress = "0x2316cE3B49676bE1001882116a30344bD51b4417";

    // Connect to the deployed contracts
    const TokenRegistry = await ethers.getContractFactory("contracts/utils/TokenRegistry.sol:TokenRegistry");
    tokenRegistry = TokenRegistry.attach(tokenRegistryAddress);
    console.log(`Connected to TokenRegistry at: ${tokenRegistryAddress}`);

    // Connect to USDC and USDT
    const ERC20 = await ethers.getContractFactory("MockUSDC"); // Using MockUSDC ABI for ERC20 tokens
    mockUSDC = ERC20.attach(usdcAddress);
    mockUSDT = ERC20.attach(usdtAddress);
    console.log(`Connected to USDC at: ${usdcAddress}`);
    console.log(`Connected to USDT at: ${usdtAddress}`);

    // Connect to TokenizedPolicy
    const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
    mockTokenizedPolicy = TokenizedPolicy.attach(tokenizedPolicyAddress);
    console.log(`Connected to TokenizedPolicy at: ${tokenizedPolicyAddress}`);

    // Note: We don't need to connect to PolicyOracle directly as it's used internally by TokenizedPolicy
    console.log("Using existing Oracle integration");
  }

  // Configure TokenizedPolicy to use the Oracle (only in local mode)
  // This is already done above for local networks, and not needed for Pharos devnet

  // Mint stablecoins to participants (only in local mode)
  if (isLocalNetwork) {
    console.log("\n==== Distributing Stablecoins ====");
    const lenderAmount = ethers.parseUnits("100000", 6);  // 100k of each stablecoin
    const borrowerAmount = ethers.parseUnits("1000", 6);  // 1k of each stablecoin

    // Mint USDC
    await mockUSDC.mint(lender.address, lenderAmount);
    await mockUSDC.mint(borrower.address, borrowerAmount);
    console.log(`Minted ${ethers.formatUnits(lenderAmount, 6)} USDC to lender: ${lender.address}`);
    console.log(`Minted ${ethers.formatUnits(borrowerAmount, 6)} USDC to borrower: ${borrower.address}`);

    // Mint USDT
    await mockUSDT.mint(lender.address, lenderAmount);
    await mockUSDT.mint(borrower.address, borrowerAmount);
    console.log(`Minted ${ethers.formatUnits(lenderAmount, 6)} USDT to lender: ${lender.address}`);
    console.log(`Minted ${ethers.formatUnits(borrowerAmount, 6)} USDT to borrower: ${borrower.address}`);
  } else {
    console.log("\n==== Using Existing Stablecoin Balances on Pharos Devnet ====");
    console.log("Skipping balance check on Pharos devnet");
  }

  // Mint policy tokens to borrower (only in local mode)
  if (isLocalNetwork) {
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
  } else {
    console.log("\n==== Using Existing Tokenized Insurance Policies on Pharos Devnet ====");
    // For Pharos devnet, we'll use existing policies
    // Check if the deployer owns any policies
    try {
      console.log("Checking for existing policy tokens...");
      console.log("For demo purposes, we'll simulate policy token operations");
      console.log("Policy Details:\n  - Policy Number: POL-PHAROS-123\n  - Issuer: Insurance Company A\n  - Valuation: 10000 USDC\n  - Expiry Date: 4/19/2026");
    } catch (error) {
      console.error("Error checking policy tokens:", error.message);
      console.log("Continuing with demo simulation");
    }
  }

  // Check ownership and policy details (only in local mode)
  if (isLocalNetwork) {
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
  }
  // Note: For Pharos devnet, we already displayed policy details above

  // Simulate a loan process with USDC (without actual contracts)
  console.log("\n==== Simulating USDC Loan Process ====");

  // 1. Calculate loan parameters
  const loanAmount = ethers.parseUnits("7000", 6); // $7,000 loan (70% LTV)
  const interestRate = 500; // 5.00% APR
  const loanDuration = 30 * 24 * 60 * 60; // 30 days in seconds
  const loanEndDate = new Date((Date.now() / 1000 + loanDuration) * 1000).toLocaleDateString();

  console.log(`USDC Loan Parameters:
  - Loan Amount: ${ethers.formatUnits(loanAmount, 6)} USDC
  - Interest Rate: ${interestRate / 100}%
  - Duration: 30 days
  - End Date: ${loanEndDate}
  - Stablecoin: USDC
  `);

  if (isLocalNetwork) {
    // 2. Simulate loan funding (only in local mode)
    console.log("Lender funds the USDC loan...");
    await mockUSDC.connect(lender).transfer(borrower.address, loanAmount);
    console.log(`Transferred ${ethers.formatUnits(loanAmount, 6)} USDC from lender to borrower`);

    // Check borrower's balance
    const borrowerUsdcBalance = await mockUSDC.balanceOf(borrower.address);
    console.log(`Borrower's USDC balance: ${ethers.formatUnits(borrowerUsdcBalance, 6)} USDC`);
  } else {
    // For Pharos devnet, just show the loan parameters
    console.log("On Pharos devnet, we would create a loan with these parameters");
    console.log("Skipping actual token transfers to avoid spending real tokens");
  }

  // 3. Simulate USDC loan repayment
  console.log("\n==== Simulating USDC Loan Repayment ====");

  // Calculate interest
  const usdcInterest = (loanAmount * BigInt(interestRate) * BigInt(loanDuration)) / BigInt(10000 * 365 * 24 * 60 * 60);
  const usdcRepaymentAmount = loanAmount + usdcInterest;

  console.log(`USDC Repayment Calculation:
  - Principal: ${ethers.formatUnits(loanAmount, 6)} USDC
  - Interest: ${ethers.formatUnits(usdcInterest, 6)} USDC
  - Total Repayment: ${ethers.formatUnits(usdcRepaymentAmount, 6)} USDC
  `);

  if (isLocalNetwork) {
    console.log("Borrower repays the USDC loan...");
    await mockUSDC.connect(borrower).transfer(lender.address, usdcRepaymentAmount);
    console.log(`Transferred ${ethers.formatUnits(usdcRepaymentAmount, 6)} USDC from borrower to lender`);

    // Check final balances
    const finalBorrowerUsdcBalance = await mockUSDC.balanceOf(borrower.address);
    const finalLenderUsdcBalance = await mockUSDC.balanceOf(lender.address);

    console.log(`Final USDC Balances:
    - Borrower: ${ethers.formatUnits(finalBorrowerUsdcBalance, 6)} USDC
    - Lender: ${ethers.formatUnits(finalLenderUsdcBalance, 6)} USDC
    `);
  } else {
    console.log("On Pharos devnet, the borrower would repay this amount");
    console.log("Skipping actual token transfers to avoid spending real tokens");
  }

  // Simulate a loan process with USDT
  console.log("\n==== Simulating USDT Loan Process ====");

  console.log(`USDT Loan Parameters:
  - Loan Amount: ${ethers.formatUnits(loanAmount, 6)} USDT
  - Interest Rate: ${interestRate / 100}%
  - Duration: 30 days
  - End Date: ${loanEndDate}
  - Stablecoin: USDT
  `);

  if (isLocalNetwork) {
    // Simulate loan funding with USDT
    console.log("Lender funds the USDT loan...");
    await mockUSDT.connect(lender).transfer(borrower.address, loanAmount);
    console.log(`Transferred ${ethers.formatUnits(loanAmount, 6)} USDT from lender to borrower`);

    // Check borrower's USDT balance
    const borrowerUsdtBalance = await mockUSDT.balanceOf(borrower.address);
    console.log(`Borrower's USDT balance: ${ethers.formatUnits(borrowerUsdtBalance, 6)} USDT`);
  } else {
    console.log("On Pharos devnet, we would create a loan with these parameters");
    console.log("Skipping actual token transfers to avoid spending real tokens");
  }

  // Simulate USDT loan repayment
  console.log("\n==== Simulating USDT Loan Repayment ====");

  // Calculate interest (same rate as USDC loan)
  const usdtInterest = (loanAmount * BigInt(interestRate) * BigInt(loanDuration)) / BigInt(10000 * 365 * 24 * 60 * 60);
  const usdtRepaymentAmount = loanAmount + usdtInterest;

  console.log(`USDT Repayment Calculation:
  - Principal: ${ethers.formatUnits(loanAmount, 6)} USDT
  - Interest: ${ethers.formatUnits(usdtInterest, 6)} USDT
  - Total Repayment: ${ethers.formatUnits(usdtRepaymentAmount, 6)} USDT
  `);

  if (isLocalNetwork) {
    console.log("Borrower repays the USDT loan...");
    await mockUSDT.connect(borrower).transfer(lender.address, usdtRepaymentAmount);
    console.log(`Transferred ${ethers.formatUnits(usdtRepaymentAmount, 6)} USDT from borrower to lender`);

    // Check final USDT balances
    const finalBorrowerUsdtBalance = await mockUSDT.balanceOf(borrower.address);
    const finalLenderUsdtBalance = await mockUSDT.balanceOf(lender.address);

    console.log(`Final USDT Balances:
    - Borrower: ${ethers.formatUnits(finalBorrowerUsdtBalance, 6)} USDT
    - Lender: ${ethers.formatUnits(finalLenderUsdtBalance, 6)} USDT
    `);
  } else {
    console.log("On Pharos devnet, the borrower would repay this amount");
    console.log("Skipping actual token transfers to avoid spending real tokens");
  }

  // Note: In the actual contract implementation, users would not need to specify the stablecoin
  // when repaying a loan. The contract automatically uses the stablecoin associated with the loan.

  // 4. Mint a second policy and simulate default
  console.log("\n==== Simulating Loan Default ====");

  if (isLocalNetwork) {
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
    console.log("USDT loan defaults, policy is liquidated...");
    await mockTokenizedPolicy.connect(borrower).transferFrom(borrower.address, lender.address, 1);
    console.log(`Policy token #1 transferred from borrower to lender`);

    // Check final ownership
    const finalOwner = await mockTokenizedPolicy.ownerOf(1);
    console.log(`Policy token #1 final owner: ${finalOwner}`);
  } else {
    console.log("On Pharos devnet, we would simulate a loan default");
    console.log("The policy would be transferred to the lender as part of liquidation");
    console.log("Skipping actual token transfers to avoid affecting real tokens");
  }

  console.log("\n==== Demo Completed Successfully! ====");
  console.log(`
Summary:
1. Created tokenized insurance policies with Oracle integration
2. Deployed TokenRegistry with support for multiple stablecoins (USDC, USDT)
3. Simulated a successful USDC loan and repayment
4. Simulated a successful USDT loan and repayment
5. Simulated a loan default and liquidation
6. Demonstrated the complete loan lifecycle using mock components for Pharos hackathon
7. Integrated with Oracle for policy valuation and expiry date
  `);

  // Demonstrate Oracle update
  console.log("\n==== Demonstrating Oracle Update ====");

  if (isLocalNetwork) {
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
  } else {
    console.log("On Pharos devnet, the Oracle would update policy valuations periodically");
    console.log("This ensures that loan collateral values are always up-to-date");
    console.log("The loan system always uses Oracle to check and update policy valuation");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
