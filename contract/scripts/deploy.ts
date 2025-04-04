import { ethers } from "hardhat";

async function main() {
  console.log("Deploying QuickFi contracts to", (await ethers.provider.getNetwork()).name);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy Mock USDC
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy TokenizedPolicy
  console.log("Deploying TokenizedPolicy...");
  const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
  const tokenizedPolicy = await TokenizedPolicy.deploy("Insurance Policy Token", "IPT");
  await tokenizedPolicy.waitForDeployment();
  console.log("TokenizedPolicy deployed to:", await tokenizedPolicy.getAddress());

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
    await mockUSDC.getAddress()
  );
  await loanOrigination.waitForDeployment();
  console.log("LoanOrigination deployed to:", await loanOrigination.getAddress());

  // Deploy MorphoAdapter
  console.log("Deploying MorphoAdapter...");
  const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
  const morphoAdapter = await MorphoAdapter.deploy(
    await loanOrigination.getAddress(),
    await mockUSDC.getAddress()
  );
  await morphoAdapter.waitForDeployment();
  console.log("MorphoAdapter deployed to:", await morphoAdapter.getAddress());

  // Update LoanOrigination with the correct MorphoAdapter address
  console.log("Updating LoanOrigination with correct MorphoAdapter address...");
  await loanOrigination.updateMorphoAdapter(await morphoAdapter.getAddress());
  console.log("LoanOrigination updated");

  // Set risk parameters for the tokenized policy in the risk engine
  console.log("Setting risk parameters for TokenizedPolicy...");
  await riskEngine.updateRiskParameters(
    await tokenizedPolicy.getAddress(),
    7000, // 70% max LTV
    8500, // 85% liquidation threshold
    500   // 5% base interest rate
  );
  console.log("Risk parameters set");

  // Mint some USDC to the MorphoAdapter for testing
  console.log("Minting USDC to MorphoAdapter for testing...");
  const usdcAmount = ethers.parseUnits("1000000", 6); // 1,000,000 USDC
  await mockUSDC.mint(await morphoAdapter.getAddress(), usdcAmount);
  console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to MorphoAdapter");

  console.log("\nQuickFi contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log("TokenizedPolicy:", await tokenizedPolicy.getAddress());
  console.log("RiskEngine:", await riskEngine.getAddress());
  console.log("LoanOrigination:", await loanOrigination.getAddress());
  console.log("MorphoAdapter:", await morphoAdapter.getAddress());
  console.log("MockUSDC:", await mockUSDC.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 