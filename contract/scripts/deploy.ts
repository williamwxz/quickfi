import { ethers } from "hardhat";
import { BaseContract } from "ethers";

interface MockUSDC extends BaseContract {
  mint(to: string, amount: bigint): Promise<any>;
}

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Deploying QuickFi contracts to", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Handle stablecoin setup based on network
  let stablecoinAddress: string;
  let mockUSDCInstance: MockUSDC | undefined;

  if (network.name === "hardhat" || network.name === "localhost") {
    // Local testing - deploy MockUSDC
    console.log("Local network detected - Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
    stablecoinAddress = await mockUSDC.getAddress();
    mockUSDCInstance = mockUSDC as unknown as MockUSDC;
    console.log("MockUSDC deployed to:", stablecoinAddress);

    // Mint some test USDC
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await mockUSDCInstance.mint(deployer.address, usdcAmount);
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to deployer");
  } else {
    // Production - use provided stablecoin address
    const envAddress = process.env.STABLECOIN_ADDRESS;
    if (!envAddress) {
      throw new Error("STABLECOIN_ADDRESS environment variable is required for production deployment");
    }
    stablecoinAddress = envAddress;
    console.log("Using existing stablecoin at:", stablecoinAddress);
  }

  // Deploy TokenizedPolicy (non-proxy version for simplicity)
  console.log("Deploying TokenizedPolicy...");
  const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
  const tokenizedPolicyInstance = await TokenizedPolicy.deploy("Insurance Policy Token", "IPT");
  await tokenizedPolicyInstance.waitForDeployment();
  const tokenizedPolicyAddress = await tokenizedPolicyInstance.getAddress();
  console.log("TokenizedPolicy deployed to:", tokenizedPolicyAddress);

  // Deploy RiskEngine
  console.log("Deploying RiskEngine...");
  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  const riskEngine = await RiskEngine.deploy();
  await riskEngine.waitForDeployment();
  console.log("RiskEngine deployed to:", await riskEngine.getAddress());

  // Deploy contracts with circular dependencies using placeholder addresses first
  console.log("Deploying LoanOrigination with placeholder addresses...");
  const LoanOrigination = await ethers.getContractFactory("LoanOrigination");
  const loanOrigination = await LoanOrigination.deploy(
    await riskEngine.getAddress(),
    deployer.address, // Temporary placeholder for MorphoAdapter
    stablecoinAddress
  );
  await loanOrigination.waitForDeployment();
  console.log("LoanOrigination deployed to:", await loanOrigination.getAddress());

  // Deploy MorphoAdapter
  console.log("Deploying MorphoAdapter...");
  const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
  const morphoAdapter = await MorphoAdapter.deploy();
  await morphoAdapter.waitForDeployment();
  console.log("MorphoAdapter deployed to:", await morphoAdapter.getAddress());

  // Initialize MorphoAdapter (wrapped in try-catch to handle already initialized case)
  console.log("Initializing MorphoAdapter...");
  try {
    await morphoAdapter.initialize(
      await loanOrigination.getAddress(),
      stablecoinAddress
    );
    console.log("MorphoAdapter initialized");
  } catch (error: any) {
    if (error.message.includes("already initialized")) {
      console.log("MorphoAdapter already initialized, skipping initialization");
    } else {
      throw error;
    }
  }

  // Update LoanOrigination with the correct MorphoAdapter address
  console.log("Updating LoanOrigination with correct MorphoAdapter address...");
  await loanOrigination.updateMorphoAdapter(await morphoAdapter.getAddress());
  console.log("LoanOrigination updated");

  // Set risk parameters for the tokenized policy in the risk engine
  console.log("Setting risk parameters for TokenizedPolicy...");
  await riskEngine.updateRiskParameters(
    await tokenizedPolicyInstance.getAddress(),
    7000, // 70% max LTV
    8500, // 85% liquidation threshold
    500   // 5% base interest rate
  );
  console.log("Risk parameters set");

  // For local testing, mint some USDC to MorphoAdapter
  if ((network.name === "hardhat" || network.name === "localhost") && mockUSDCInstance) {
    console.log("Minting USDC to MorphoAdapter for testing...");
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await mockUSDCInstance.mint(await morphoAdapter.getAddress(), usdcAmount);
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to MorphoAdapter");
  }

  console.log("\nQuickFi contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log("TokenizedPolicy:", await tokenizedPolicyInstance.getAddress());
  console.log("RiskEngine:", await riskEngine.getAddress());
  console.log("LoanOrigination:", await loanOrigination.getAddress());
  console.log("MorphoAdapter:", await morphoAdapter.getAddress());
  console.log("Stablecoin:", stablecoinAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});