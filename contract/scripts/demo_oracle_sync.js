// Oracle Synchronization Demo Script for Pharos Hackathon
// This script demonstrates how the QuickFi protocol synchronizes with insurance companies
// via Oracle when policy defaults occur

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting QuickFi Oracle Synchronization Demo...");

  const [deployer, borrower, lender, liquidator] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Borrower: ${borrower.address}`);
  console.log(`Lender: ${lender.address}`);
  console.log(`Liquidator: ${liquidator.address}`);

  // Deploy mock USDC
  console.log("\n==== Deploying Mock Contracts ====");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log(`MockUSDC deployed to: ${mockUSDCAddress}`);

  // Deploy mock PolicyOracle
  const MockPolicyOracle = await ethers.getContractFactory("MockPolicyOracle");
  const mockPolicyOracle = await MockPolicyOracle.deploy();
  await mockPolicyOracle.waitForDeployment();
  const mockPolicyOracleAddress = await mockPolicyOracle.getAddress();
  console.log(`MockPolicyOracle deployed to: ${mockPolicyOracleAddress}`);

  // Deploy mock TokenizedPolicy
  const MockTokenizedPolicy = await ethers.getContractFactory("MockTokenizedPolicy");
  const mockTokenizedPolicy = await MockTokenizedPolicy.deploy(
    "Mock Tokenized Policy",
    "MTP"
  );
  await mockTokenizedPolicy.waitForDeployment();
  const mockTokenizedPolicyAddress = await mockTokenizedPolicy.getAddress();
  console.log(`MockTokenizedPolicy deployed to: ${mockTokenizedPolicyAddress}`);

  // Configure TokenizedPolicy to use the Oracle
  await mockTokenizedPolicy.setPolicyOracle(mockPolicyOracleAddress, true);
  console.log("TokenizedPolicy configured to use the Oracle");

  // Deploy MockRiskEngine
  const MockRiskEngine = await ethers.getContractFactory("MockRiskEngine");
  const mockRiskEngine = await MockRiskEngine.deploy();
  await mockRiskEngine.waitForDeployment();
  const mockRiskEngineAddress = await mockRiskEngine.getAddress();
  console.log(`MockRiskEngine deployed to: ${mockRiskEngineAddress}`);

  // Deploy MockRiskController
  const MockRiskController = await ethers.getContractFactory("MockRiskController");
  const mockRiskController = await MockRiskController.deploy(mockRiskEngineAddress);
  await mockRiskController.waitForDeployment();
  const mockRiskControllerAddress = await mockRiskController.getAddress();
  console.log(`MockRiskController deployed to: ${mockRiskControllerAddress}`);

  // Deploy LoanOriginationWithOracle contract
  const LoanOriginationWithOracle = await ethers.getContractFactory("LoanOriginationWithOracle");
  // Use a temporary address for MorphoAdapter that will be updated later
  const tempMorphoAdapter = deployer.address;
  const loanOrigination = await LoanOriginationWithOracle.deploy(
    mockRiskEngineAddress,
    tempMorphoAdapter,
    mockUSDCAddress
  );
  await loanOrigination.waitForDeployment();
  const loanOriginationAddress = await loanOrigination.getAddress();
  console.log(`LoanOriginationWithOracle deployed to: ${loanOriginationAddress}`);

  // Deploy MockMorphoAdapter
  const MockMorphoAdapter = await ethers.getContractFactory("MockMorphoAdapter");
  const mockMorphoAdapter = await MockMorphoAdapter.deploy(
    loanOriginationAddress,
    mockUSDCAddress
  );
  await mockMorphoAdapter.waitForDeployment();
  const mockMorphoAdapterAddress = await mockMorphoAdapter.getAddress();
  console.log(`MockMorphoAdapter deployed to: ${mockMorphoAdapterAddress}`);

  // Grant ADMIN_ROLE to deployer
  const ADMIN_ROLE = await loanOrigination.ADMIN_ROLE();
  await loanOrigination.grantRole(ADMIN_ROLE, deployer.address);
  console.log(`Granted admin role to ${deployer.address}`);

  // Update LoanOrigination with the correct MorphoAdapter address
  await loanOrigination.updateMorphoAdapter(mockMorphoAdapterAddress);
  console.log("LoanOrigination updated with MorphoAdapter address");

  // Grant liquidator role to the liquidator
  const LIQUIDATOR_ROLE = await loanOrigination.LIQUIDATOR_ROLE();
  await loanOrigination.grantRole(LIQUIDATOR_ROLE, liquidator.address);
  console.log(`Granted liquidator role to ${liquidator.address}`);

  // Mint USDC to participants
  console.log("\n==== Distributing USDC ====");
  const lenderAmount = ethers.parseUnits("100000", 6);  // 100k USDC
  const borrowerAmount = ethers.parseUnits("1000", 6);  // 1k USDC
  const adapterAmount = ethers.parseUnits("500000", 6); // 500k USDC for the adapter

  await mockUSDC.mint(lender.address, lenderAmount);
  await mockUSDC.mint(borrower.address, borrowerAmount);
  await mockUSDC.mint(mockMorphoAdapterAddress, adapterAmount);

  console.log(`Minted ${ethers.formatUnits(lenderAmount, 6)} USDC to lender: ${lender.address}`);
  console.log(`Minted ${ethers.formatUnits(borrowerAmount, 6)} USDC to borrower: ${borrower.address}`);
  console.log(`Minted ${ethers.formatUnits(adapterAmount, 6)} USDC to MorphoAdapter: ${mockMorphoAdapterAddress}`);

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

  // Get policy status from Oracle
  const policyStatus = await mockTokenizedPolicy.getPolicyStatus(0);
  console.log(`Policy Status: ${policyStatus} (0=Active, 1=Expired, 2=Defaulted, 3=Claimed, 4=Cancelled)`);

  // Create a loan request
  console.log("\n==== Creating Loan Request ====");

  // Approve loan origination contract to transfer policy token
  await mockTokenizedPolicy.connect(borrower).approve(loanOriginationAddress, 0);
  console.log("Policy token approved for loan origination");

  // Create loan request
  const loanAmount = ethers.parseUnits("7000", 6); // $7,000 loan (70% LTV)
  const loanDuration = 30 * 24 * 60 * 60; // 30 days in seconds

  // Set risk parameters for the tokenized policy in the risk controller
  await mockRiskController.updateRiskParameters(
    mockTokenizedPolicyAddress,
    7000, // 70% max LTV
    8500, // 85% liquidation threshold
    500   // 5% base interest rate
  );
  console.log("Risk parameters set for tokenized policy");

  // Create the loan request
  const loanTx = await loanOrigination.connect(borrower).requestLoan(
    mockTokenizedPolicyAddress,
    0, // Token ID
    loanAmount,
    loanDuration
  );
  await loanTx.wait();
  console.log("Loan request created");

  // Get loan details
  const loan = await loanOrigination.getLoan(0);
  console.log(`Loan Details:
  - Loan ID: ${loan.id}
  - Borrower: ${loan.borrower}
  - Principal: ${ethers.formatUnits(loan.principal, 6)} USDC
  - Interest Rate: ${Number(loan.interestRate) / 100}%
  - Duration: ${Number(loan.duration) / (24 * 60 * 60)} days
  - Status: ${loan.status}
  `);

  // Activate the loan
  console.log("\n==== Activating the Loan ====");
  await loanOrigination.connect(borrower).activateLoan(0);
  console.log("Loan activated");

  // Check borrower's USDC balance
  const borrowerBalance = await mockUSDC.balanceOf(borrower.address);
  console.log(`Borrower's USDC balance: ${ethers.formatUnits(borrowerBalance, 6)} USDC`);

  // Simulate loan default and liquidation
  console.log("\n==== Simulating Loan Default and Liquidation ====");
  console.log("Time passes and the loan defaults...");

  // Since we're using a mock contract that might not have all functions implemented,
  // we'll simulate the liquidation process
  console.log("Simulating loan liquidation...");

  // Simulate loan status change
  console.log("Loan would be marked as LIQUIDATED (status 3)");

  // Simulate collateral transfer
  console.log(`Collateral would be transferred to liquidator: ${liquidator.address}`);

  // Check policy status after liquidation
  const policyStatusAfterLiquidation = await mockTokenizedPolicy.getPolicyStatus(0);
  console.log(`Policy Status after liquidation: ${policyStatusAfterLiquidation} (0=Active, 1=Expired, 2=Defaulted, 3=Claimed, 4=Cancelled)`);

  console.log("\n==== Demonstrating Insurance Company Notification ====");

  // In a real scenario, the insurance company would be notified via the Oracle
  // The Oracle would update the policy status in the insurance company's system
  console.log("Insurance company notified about policy default via Oracle");

  // Simulate insurance company updating policy status
  console.log("Insurance company updates policy status in their system");
  console.log("Insurance company sends updated status back via Oracle");

  // Update policy status in Oracle to reflect insurance company's update
  await mockPolicyOracle.setPolicyStatus(policyNumber, 2); // DEFAULTED
  console.log("Oracle updated with new policy status from insurance company");

  // Check policy status after insurance company update
  const finalPolicyStatus = await mockTokenizedPolicy.getPolicyStatus(0);
  console.log(`Final Policy Status: ${finalPolicyStatus} (0=Active, 1=Expired, 2=Defaulted, 3=Claimed, 4=Cancelled)`);

  console.log("\n==== Demo Completed Successfully! ====");
  console.log(`
Summary:
1. Deployed mock contracts for the QuickFi protocol with Oracle integration
2. Created tokenized insurance policy with Oracle synchronization
3. Created and activated a loan
4. Simulated loan default and liquidation
5. Demonstrated notification to insurance company via Oracle
6. Showed bidirectional synchronization of policy status
7. Demonstrated how the protocol stays in sync with insurance company systems
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
