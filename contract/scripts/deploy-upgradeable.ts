import { ethers } from "hardhat";

async function main() {
  console.log("Deploying QuickFi upgradeable contracts to", (await ethers.provider.getNetwork()).name);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy implementation contracts first
  console.log("\nDeploying implementation contracts...");
  
  // TokenizedPolicy implementation
  console.log("Deploying TokenizedPolicyUpgradeable implementation...");
  const TokenizedPolicyUpgradeable = await ethers.getContractFactory("TokenizedPolicyUpgradeable");
  const tokenizedPolicyImpl = await TokenizedPolicyUpgradeable.deploy();
  await tokenizedPolicyImpl.waitForDeployment();
  console.log("TokenizedPolicyUpgradeable implementation deployed to:", await tokenizedPolicyImpl.getAddress());
  
  // RiskEngine implementation
  console.log("Deploying RiskEngineUpgradeable implementation...");
  const RiskEngineUpgradeable = await ethers.getContractFactory("RiskEngineUpgradeable");
  const riskEngineImpl = await RiskEngineUpgradeable.deploy();
  await riskEngineImpl.waitForDeployment();
  console.log("RiskEngineUpgradeable implementation deployed to:", await riskEngineImpl.getAddress());
  
  // Deploy QuickFiDeployer with ServiceConfiguration
  console.log("\nDeploying QuickFiDeployer...");
  const QuickFiDeployer = await ethers.getContractFactory("QuickFiDeployer");
  const quickFiDeployer = await QuickFiDeployer.deploy();
  await quickFiDeployer.waitForDeployment();
  console.log("QuickFiDeployer deployed to:", await quickFiDeployer.getAddress());
  
  // Get ServiceConfiguration address
  const serviceConfigAddress = await quickFiDeployer.serviceConfiguration();
  console.log("ServiceConfiguration deployed to:", serviceConfigAddress);
  
  // Deploy Mock USDC
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());
  
  // Setup protocol with implementations
  console.log("\nSetting up protocol in QuickFiDeployer...");
  const tx1 = await quickFiDeployer.setupProtocol(
    await tokenizedPolicyImpl.getAddress(),
    await riskEngineImpl.getAddress()
  );
  await tx1.wait();
  console.log("Protocol setup successfully");
  
  // Deploy the QuickFi protocol components
  console.log("\nDeploying the QuickFi protocol...");
  const tx2 = await quickFiDeployer.deployQuickFi(
    await mockUSDC.getAddress(),
    "QuickFi Insurance Policy Token",
    "QIPT"
  );
  await tx2.wait();
  console.log("QuickFi protocol deployed successfully");
  
  // Print deployed addresses
  console.log("\nDeployed Contract Addresses:");
  console.log("QuickFiDeployer:", await quickFiDeployer.getAddress());
  console.log("ServiceConfiguration:", serviceConfigAddress);
  console.log("TokenizedPolicyFactory:", await quickFiDeployer.tokenizedPolicyFactory());
  console.log("RiskEngine:", await quickFiDeployer.riskEngine());
  console.log("TokenizedPolicy:", await quickFiDeployer.tokenizedPolicy());
  console.log("RiskController:", await quickFiDeployer.riskController());
  console.log("USDC:", await quickFiDeployer.usdcToken());
  
  console.log("\nImplementation Addresses:");
  console.log("TokenizedPolicyUpgradeable:", await tokenizedPolicyImpl.getAddress());
  console.log("RiskEngineUpgradeable:", await riskEngineImpl.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 