import { ethers } from "hardhat";

async function main() {
  // Contract addresses - replace with actual addresses from your deployment
  const QUICKFI_DEPLOYER = "0x..."; // Replace with actual QuickFiDeployer address
  
  // Implementation type to upgrade - either "TOKENIZED_POLICY" or "RISK_ENGINE"
  const IMPL_TYPE = process.env.IMPL_TYPE || "TOKENIZED_POLICY";
  
  // Get QuickFiDeployer contract
  const quickFiDeployer = await ethers.getContractAt("QuickFiDeployer", QUICKFI_DEPLOYER);
  
  // Get current implementation
  let currentImpl;
  if (IMPL_TYPE === "TOKENIZED_POLICY") {
    const factory = await ethers.getContractAt("IBeacon", await quickFiDeployer.tokenizedPolicyFactory());
    currentImpl = await factory.implementation();
  } else if (IMPL_TYPE === "RISK_ENGINE") {
    const proxyAdmin = await ethers.getContractAt("ProxyAdmin", await quickFiDeployer.proxyAdmin());
    currentImpl = await proxyAdmin.getProxyImplementation(await quickFiDeployer.riskEngine());
  } else {
    throw new Error(`Invalid implementation type: ${IMPL_TYPE}. Valid types are: TOKENIZED_POLICY, RISK_ENGINE`);
  }
  
  console.log(`Current ${IMPL_TYPE} implementation: ${currentImpl}`);
  
  // Deploy the new implementation contract
  console.log("Deploying new implementation...");
  
  let newImpl;
  
  if (IMPL_TYPE === "TOKENIZED_POLICY") {
    const TokenizedPolicyUpgradeable = await ethers.getContractFactory("TokenizedPolicyUpgradeable");
    newImpl = await TokenizedPolicyUpgradeable.deploy();
    await newImpl.waitForDeployment();
  } else if (IMPL_TYPE === "RISK_ENGINE") {
    const RiskEngineUpgradeable = await ethers.getContractFactory("RiskEngineUpgradeable");
    newImpl = await RiskEngineUpgradeable.deploy();
    await newImpl.waitForDeployment();
  }
  
  const newImplAddress = await newImpl.getAddress();
  console.log(`New implementation deployed to: ${newImplAddress}`);
  
  // Upgrade the implementation
  console.log("Upgrading implementation...");
  let tx;
  
  if (IMPL_TYPE === "TOKENIZED_POLICY") {
    const factory = await ethers.getContractAt("IBeacon", await quickFiDeployer.tokenizedPolicyFactory());
    tx = await factory.setImplementation(newImplAddress);
  } else if (IMPL_TYPE === "RISK_ENGINE") {
    const proxyAdmin = await ethers.getContractAt("ProxyAdmin", await quickFiDeployer.proxyAdmin());
    tx = await proxyAdmin.upgrade(await quickFiDeployer.riskEngine(), newImplAddress);
  }
  
  await tx.wait();
  console.log(`Successfully upgraded ${IMPL_TYPE} implementation from ${currentImpl} to ${newImplAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 