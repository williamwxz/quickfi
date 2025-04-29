import { ethers } from "hardhat";
import { BaseContract } from "ethers";
import * as fs from "fs";
import * as path from "path";

interface TokenRegistry extends BaseContract {
  addToken(token: string, decimals: number, minLoanAmount: bigint, maxLoanAmount: bigint): Promise<any>;
}

interface MockStablecoin extends BaseContract {
  mint(to: string, amount: bigint): Promise<any>;
}

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Adding tokens to registry on", network.name);

  // Read existing addresses
  const addressesFilePath = path.join(__dirname, '../deployed-addresses.json');
  const fileContent = fs.readFileSync(addressesFilePath, 'utf8');
  const deployedAddresses = JSON.parse(fileContent);

  if (!deployedAddresses[network.name]) {
    throw new Error(`No addresses found for network ${network.name}`);
  }

  const networkAddresses = deployedAddresses[network.name];
  const { USDC: usdcAddress, USDT: usdtAddress, TokenRegistry: tokenRegistryAddress } = networkAddresses;

  if (!usdcAddress || !usdtAddress || !tokenRegistryAddress) {
    throw new Error("Missing required addresses in deployed-addresses.json");
  }

  console.log("Using addresses:");
  console.log("USDC:", usdcAddress);
  console.log("USDT:", usdtAddress);
  console.log("TokenRegistry:", tokenRegistryAddress);

  // Get TokenRegistry contract
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = TokenRegistry.attach(tokenRegistryAddress) as unknown as TokenRegistry;

  // Add USDC to registry
  console.log("\nAdding USDC to TokenRegistry...");
  const usdcTx = await tokenRegistry.addToken(
    usdcAddress,
    6,
    ethers.parseUnits("100", 6), // Min loan amount: 100 USDC
    ethers.parseUnits("100000", 6) // Max loan amount: 100,000 USDC
  );
  await usdcTx.wait();
  console.log("Added USDC to TokenRegistry");

  // Add USDT to registry
  console.log("\nAdding USDT to TokenRegistry...");
  const usdtTx = await tokenRegistry.addToken(
    usdtAddress,
    6,
    ethers.parseUnits("100", 6), // Min loan amount: 100 USDT
    ethers.parseUnits("100000", 6) // Max loan amount: 100,000 USDT
  );
  await usdtTx.wait();
  console.log("Added USDT to TokenRegistry");

  // For testnet, mint tokens to MorphoAdapter
  if (network.name === "hardhat" || network.name === "localhost" || network.name === "pharosDevnet" || network.name === "sepolia") {
    const { MorphoAdapter: morphoAdapterAddress } = networkAddresses;
    if (!morphoAdapterAddress) {
      throw new Error("Missing MorphoAdapter address in deployed-addresses.json");
    }

    // Get MockUSDC contract
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = MockUSDC.attach(usdcAddress) as unknown as MockStablecoin;

    // Get MockUSDT contract
    const MockUSDT = await ethers.getContractFactory("MockUSDC"); // Reuse MockUSDC contract
    const mockUSDT = MockUSDT.attach(usdtAddress) as unknown as MockStablecoin;

    // Mint USDC to MorphoAdapter
    console.log("\nMinting USDC to MorphoAdapter...");
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    const usdcMintTx = await mockUSDC.mint(morphoAdapterAddress, usdcAmount);
    await usdcMintTx.wait();
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to MorphoAdapter");

    // Mint USDT to MorphoAdapter
    console.log("\nMinting USDT to MorphoAdapter...");
    const usdtAmount = ethers.parseUnits("1000000", 6); // 1M USDT
    const usdtMintTx = await mockUSDT.mint(morphoAdapterAddress, usdtAmount);
    await usdtMintTx.wait();
    console.log("Minted", ethers.formatUnits(usdtAmount, 6), "USDT to MorphoAdapter");
  }

  console.log("\nToken registry and minting completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 