import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Interacting with QuickFi contracts on", network.name);

  // Load deployed contract addresses
  const addressesPath = path.join(__dirname, "../deployed-addresses-pharos-devnet.json");
  const addressesJson = fs.readFileSync(addressesPath, "utf8");
  const addresses = JSON.parse(addressesJson);
  
  const networkAddresses = addresses["pharosDevnet"];
  if (!networkAddresses) {
    throw new Error(`No addresses found for network: ${network.name}`);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Interacting with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Connect to deployed contracts
  const tokenizedPolicy = await ethers.getContractAt("TokenizedPolicy", networkAddresses.TokenizedPolicy);
  const riskEngine = await ethers.getContractAt("RiskEngine", networkAddresses.RiskEngine);
  const loanOrigination = await ethers.getContractAt("LoanOrigination", networkAddresses.LoanOrigination);
  const morphoAdapter = await ethers.getContractAt("MorphoAdapter", networkAddresses.MorphoAdapter);
  
  console.log("Connected to deployed contracts");

  // Get contract information
  const tokenName = await tokenizedPolicy.name();
  const tokenSymbol = await tokenizedPolicy.symbol();
  console.log(`TokenizedPolicy: ${tokenName} (${tokenSymbol})`);

  // Get risk parameters for TokenizedPolicy
  try {
    const riskParams = await riskEngine.getRiskParameters(networkAddresses.TokenizedPolicy);
    console.log("Risk Parameters for TokenizedPolicy:");
    console.log("- Max LTV:", riskParams.maxLTV / 100, "%");
    console.log("- Liquidation Threshold:", riskParams.liquidationThreshold / 100, "%");
    console.log("- Base Interest Rate:", riskParams.baseInterestRate / 100, "%");
  } catch (error) {
    console.log("Could not get risk parameters:", error.message);
  }

  // Check if MorphoAdapter is properly linked to LoanOrigination
  try {
    const morphoAdapterAddress = await loanOrigination.morphoAdapter();
    console.log("MorphoAdapter address in LoanOrigination:", morphoAdapterAddress);
    console.log("Expected MorphoAdapter address:", networkAddresses.MorphoAdapter);
    console.log("MorphoAdapter properly linked:", morphoAdapterAddress === networkAddresses.MorphoAdapter);
  } catch (error) {
    console.log("Could not check MorphoAdapter link:", error.message);
  }

  console.log("\nInteraction completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
