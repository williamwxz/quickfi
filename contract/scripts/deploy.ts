import { ethers } from "hardhat";
import { BaseContract } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simplified deployment configuration
const CONFIG = {
  // Gas configuration for transactions
  GAS_LIMIT: 5000000,
  GAS_PRICE: ethers.parseUnits("60", "gwei"),

  // Retry configuration
  MAX_RETRIES: 2,
  INITIAL_DELAY: 500,
  MAX_DELAY: 5000,

  // Set to true to skip Supabase upload (faster deployment)
  SKIP_SUPABASE: process.env.SKIP_SUPABASE === 'true',

  // Always deploy new stablecoins for consistency
  FORCE_DEPLOY_STABLECOINS: true,

  // Don't reuse existing tokens to avoid inconsistencies
  REUSE_TOKENS: false
};

interface MockStablecoin extends BaseContract {
  mint(to: string, amount: bigint): Promise<any>;
  balanceOf(account: string): Promise<bigint>;
  decimals(): Promise<number>;
}

interface TokenRegistry extends BaseContract {
  addToken(token: string, decimals: number, minLoanAmount: bigint, maxLoanAmount: bigint): Promise<any>;
}

interface LoanOrigination extends BaseContract {
  updateMorphoAdapter(adapter: string): Promise<any>;
  morphoAdapter(): Promise<string>;
}

/**
 * Retry function with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000,
  maxDelay: number = 30000,
  name: string = "operation"
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  let dots = 0;
  let intervalId: NodeJS.Timeout;

  // Start progress indicator
  intervalId = setInterval(() => {
    process.stdout.write(`\r${name} in progress${'.'.repeat(dots)}   `);
    dots = (dots + 1) % 4;
  }, 1000);

  try {
    while (true) {
      try {
        const result = await fn();
        clearInterval(intervalId);
        console.log(`\r${name} completed successfully!            `); // Extra spaces to clear the line
        return result;
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          clearInterval(intervalId);
          console.error(`\r${name} failed after ${maxRetries} retries`);
          throw error;
        }

        console.log(`\r${name} attempt ${retries} failed. Retrying in ${delay / 1000} seconds...`);
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);

        // Wait for the delay period
        await new Promise(resolve => setTimeout(resolve, delay));

        // Exponential backoff with jitter
        delay = Math.min(delay * 2, maxDelay) * (0.8 + Math.random() * 0.4);
      }
    }
  } finally {
    clearInterval(intervalId);
  }
}

async function getNextNonce(deployer: any): Promise<number> {
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address);
  return currentNonce;
}

async function main() {
  // Check if we should skip Supabase
  if (CONFIG.SKIP_SUPABASE) {
    console.log("Skipping Supabase upload as SKIP_SUPABASE is set to true");
  } else if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn("Warning: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are not set.");
    console.warn("Contract addresses will not be automatically uploaded to Supabase.");
  }

  const network = await ethers.provider.getNetwork();
  console.log("Deploying QuickFi contracts to", network.name);

  // Check for existing deployed addresses to reuse stablecoins
  let existingStablecoins = {
    USDC: "",
    USDT: ""
  };

  // Try to read existing addresses from deployed-addresses.json
  try {
    const addressesFilePath = path.join(__dirname, '../deployed-addresses.json');
    if (fs.existsSync(addressesFilePath)) {
      const fileContent = fs.readFileSync(addressesFilePath, 'utf8');
      const deployedAddresses = JSON.parse(fileContent);

      // Check if we have addresses for the current network
      if (deployedAddresses[network.name]) {
        const networkAddresses = deployedAddresses[network.name];
        if (networkAddresses.USDC && networkAddresses.USDT) {
          existingStablecoins.USDC = networkAddresses.USDC;
          existingStablecoins.USDT = networkAddresses.USDT;
          console.log("Found existing stablecoin addresses in deployed-addresses.json:");
          console.log("- USDC:", existingStablecoins.USDC);
          console.log("- USDT:", existingStablecoins.USDT);
        }
      }
    }
  } catch (error) {
    console.warn('Could not read existing addresses file:', error);
  }

  // If we couldn't find addresses in deployed-addresses.json, try frontend/src/config/deployed-addresses.json
  if (!existingStablecoins.USDC || !existingStablecoins.USDT) {
    try {
      const frontendAddressesFilePath = path.join(__dirname, '../../frontend/src/config/deployed-addresses.json');
      if (fs.existsSync(frontendAddressesFilePath)) {
        const fileContent = fs.readFileSync(frontendAddressesFilePath, 'utf8');
        const frontendAddresses = JSON.parse(fileContent);

        // Check if we have addresses for the current network
        if (frontendAddresses[network.name]) {
          const networkAddresses = frontendAddresses[network.name];
          if (networkAddresses.USDC && networkAddresses.USDT) {
            existingStablecoins.USDC = networkAddresses.USDC;
            existingStablecoins.USDT = networkAddresses.USDT;
            console.log("Found existing stablecoin addresses in frontend config:");
            console.log("- USDC:", existingStablecoins.USDC);
            console.log("- USDT:", existingStablecoins.USDT);
          }
        }
      }
    } catch (error) {
      console.warn('Could not read frontend addresses file:', error);
    }
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // print rpc url from ethers provider
  console.log("RPC URL:", (await ethers.provider.getNetwork()).toJSON());

  // Get the current nonce
  let currentNonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Starting deployment with nonce:", currentNonce);

  // Before getting contract factory
  console.log("Connecting to TokenRegistry contract factory...");
  const TokenRegistryFactory = await ethers.getContractFactory("TokenRegistry");
  console.log("TokenRegistry contract factory connected.");

  // Deploy TokenRegistry
  console.log("Deploying TokenRegistry...");
  const tokenRegistryNonce = await getNextNonce(deployer);
  const tokenRegistry = await retry(
    () => TokenRegistryFactory.deploy({
      gasLimit: CONFIG.GAS_LIMIT,
      gasPrice: CONFIG.GAS_PRICE,
      nonce: tokenRegistryNonce
    }),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "TokenRegistry deployment"
  ) as unknown as TokenRegistry;

  await retry(
    () => tokenRegistry.waitForDeployment(),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "TokenRegistry deployment confirmation"
  );

  const tokenRegistryAddress = await tokenRegistry.getAddress();
  console.log("TokenRegistry deployed to:", tokenRegistryAddress);

  // Initialize stablecoin variables - we'll deploy them at the end
  let usdcAddress: string = "";
  let usdtAddress: string = "";
  let mockUSDCInstance: MockStablecoin | undefined;
  let mockUSDTInstance: MockStablecoin | undefined;

  // Before getting contract factory
  console.log("Connecting to TokenizedPolicy contract factory...");
  const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
  console.log("TokenizedPolicy contract factory connected.");

  // Deploy TokenizedPolicy (non-proxy version for simplicity)
  console.log("Deploying TokenizedPolicy...");
  const tokenizedPolicyNonce = await getNextNonce(deployer);
  const tokenizedPolicyInstance = await retry(
    () => TokenizedPolicy.deploy("Insurance Policy Token", "IPT", {
      gasLimit: CONFIG.GAS_LIMIT,
      gasPrice: CONFIG.GAS_PRICE,
      nonce: tokenizedPolicyNonce
    }),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "TokenizedPolicy deployment"
  );

  await retry(
    () => tokenizedPolicyInstance.waitForDeployment(),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "TokenizedPolicy deployment confirmation"
  );

  const tokenizedPolicyAddress = await tokenizedPolicyInstance.getAddress();
  console.log("TokenizedPolicy deployed to:", tokenizedPolicyAddress);

  // Before getting contract factory
  console.log("Connecting to RiskEngine contract factory...");
  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  console.log("RiskEngine contract factory connected.");

  // Deploy RiskEngine
  console.log("Deploying RiskEngine...");
  const riskEngineNonce = await getNextNonce(deployer);
  const riskEngine = await retry(
    () => RiskEngine.deploy({
      gasLimit: CONFIG.GAS_LIMIT,
      gasPrice: CONFIG.GAS_PRICE,
      nonce: riskEngineNonce
    }),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "RiskEngine deployment"
  );

  await retry(
    () => riskEngine.waitForDeployment(),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "RiskEngine deployment confirmation"
  );

  const riskEngineAddress = await riskEngine.getAddress();
  console.log("RiskEngine deployed to:", riskEngineAddress);

  // Deploy contracts with circular dependencies using placeholder addresses first
  console.log("Deploying LoanOrigination with placeholder addresses...");
  const LoanOriginationFactory = await ethers.getContractFactory("LoanOrigination");
  console.log("LoanOrigination contract factory connected.");

  const loanOrigination = await retry(async () => {
    return LoanOriginationFactory.deploy(
      riskEngineAddress,
      deployer.address, // Temporary placeholder for MorphoAdapter
      tokenRegistryAddress,
      {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: CONFIG.GAS_PRICE,
        nonce: await getNextNonce(deployer)
      }
    );
  }, CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "LoanOrigination deployment") as unknown as LoanOrigination;

  await retry(
    () => loanOrigination.waitForDeployment(),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "LoanOrigination deployment confirmation"
  );

  const loanOriginationAddress = await loanOrigination.getAddress();
  console.log("LoanOrigination deployed to:", loanOriginationAddress);

  // Deploy MockMorphoAdapter (simpler than using proxy pattern)
  console.log("Deploying MockMorphoAdapter...");

  // Import required contract for deployment
  console.log("Connecting to MockMorphoAdapter contract factory...");
  const MockMorphoAdapter = await ethers.getContractFactory("MockMorphoAdapter");
  console.log("MockMorphoAdapter contract factory connected.");

  // Deploy MockMorphoAdapter
  const morphoAdapterNonce = await getNextNonce(deployer);
  const morphoAdapter = await retry(
    () => MockMorphoAdapter.deploy(
      loanOriginationAddress,
      tokenRegistryAddress,
      {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: CONFIG.GAS_PRICE,
        nonce: morphoAdapterNonce
      }
    ),
    CONFIG.MAX_RETRIES,
    CONFIG.INITIAL_DELAY,
    CONFIG.MAX_DELAY,
    "MockMorphoAdapter deployment"
  );

  await retry(
    () => morphoAdapter.waitForDeployment(),
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "MockMorphoAdapter deployment confirmation"
  );

  const morphoAdapterAddress = await morphoAdapter.getAddress();
  console.log("MockMorphoAdapter deployed to:", morphoAdapterAddress);

  // Verify deployment was successful
  try {
    // Check if LoanOrigination has the LOAN_ORIGINATOR_ROLE
    const LOAN_ORIGINATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LOAN_ORIGINATOR_ROLE"));
    const hasRole = await morphoAdapter.hasRole(LOAN_ORIGINATOR_ROLE, loanOriginationAddress);
    console.log("LoanOrigination has LOAN_ORIGINATOR_ROLE:", hasRole);

    if (!hasRole) {
      console.error("WARNING: LoanOrigination does not have LOAN_ORIGINATOR_ROLE");
      console.log("Attempting to grant LOAN_ORIGINATOR_ROLE to LoanOrigination...");

      const grantRoleTx = await morphoAdapter.grantRole(LOAN_ORIGINATOR_ROLE, loanOriginationAddress);
      await grantRoleTx.wait();

      const hasRoleNow = await morphoAdapter.hasRole(LOAN_ORIGINATOR_ROLE, loanOriginationAddress);
      console.log("LoanOrigination now has LOAN_ORIGINATOR_ROLE:", hasRoleNow);
    }
  } catch (error) {
    console.error("Error verifying MockMorphoAdapter deployment:", error);
    console.log("Continuing with deployment...");
  }

  // Update LoanOrigination with the correct MorphoAdapter address
  console.log("Updating LoanOrigination with correct MorphoAdapter address...");
  await retry(async () => {
    const morphoAdapterAddress = await morphoAdapter.getAddress();
    // Pass transaction options as overrides parameter
    const tx = await loanOrigination.updateMorphoAdapter(morphoAdapterAddress);
    await tx.wait();
    return tx;
  }, CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "Updating LoanOrigination with MorphoAdapter address");
  console.log("LoanOrigination updated");

  // Set risk parameters for the tokenized policy in the risk engine
  console.log("Setting risk parameters for TokenizedPolicy...");
  await retry(async () => {
    const tx = await riskEngine.updateRiskParameters(
      tokenizedPolicyAddress,
      7000,
      8500,
      500,
      {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: CONFIG.GAS_PRICE,
      }
    );
    await tx.wait();
    return tx;
  }, CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "Setting risk parameters");
  console.log("Risk parameters set");

  // Now deploy stablecoins (moved to the end as it's the slowest part)
  console.log("\n--- Deploying Stablecoins (Final Step) ---");

  // Check if we should force deploy new stablecoins
  if (CONFIG.FORCE_DEPLOY_STABLECOINS) {
    console.log("FORCE_DEPLOY_STABLECOINS is enabled - Deploying new stablecoins regardless of existing ones");
  }
  // First check if we found existing stablecoin addresses in deployed files and we're not forcing new deployments
  else if (existingStablecoins.USDC && existingStablecoins.USDT) {
    console.log("Using existing stablecoin addresses from deployed files");
    usdcAddress = existingStablecoins.USDC;
    usdtAddress = existingStablecoins.USDT;
    console.log("Using existing stablecoins:");
    console.log("- USDC:", usdcAddress);
    console.log("- USDT:", usdtAddress);
  }
  // Then check if we should reuse addresses from environment variables
  else if (CONFIG.REUSE_TOKENS && process.env.USDC_ADDRESS && process.env.USDT_ADDRESS) {
    console.log("REUSE_TOKENS is enabled - Using existing stablecoin addresses from .env");
    usdcAddress = process.env.USDC_ADDRESS;
    usdtAddress = process.env.USDT_ADDRESS;
    console.log("Using existing stablecoins:");
    console.log("- USDC:", usdcAddress);
    console.log("- USDT:", usdtAddress);
  }

  // Deploy new stablecoins if we don't have addresses yet or if we're forcing new deployments
  if (CONFIG.FORCE_DEPLOY_STABLECOINS || (!usdcAddress && !usdtAddress && (network.name === "hardhat" || network.name === "localhost" || network.name === "pharosDevnet" || network.name === "sepolia"))) {
    // Local or testnet - deploy MockUSDC
    console.log(`${network.name} network detected - Deploying Mock Stablecoins...`);

    // Deploy MockUSDC
    console.log("Connecting to MockUSDC contract factory...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    console.log("MockUSDC contract factory connected.");

    // For MockUSDC
    const mockUSDCNonce = await getNextNonce(deployer);
    const mockUSDC = await retry(
      () => MockUSDC.deploy("USD Coin", "USDC", 6, {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: CONFIG.GAS_PRICE,
        nonce: mockUSDCNonce
      }),
      CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "MockUSDC deployment"
    );

    await retry(
      () => mockUSDC.waitForDeployment(),
      CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "MockUSDC deployment confirmation"
    );

    usdcAddress = await mockUSDC.getAddress();
    mockUSDCInstance = mockUSDC as unknown as MockStablecoin;
    console.log("MockUSDC deployed to:", usdcAddress);

    // Mint some test USDC
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await retry(
      async () => {
        const tx = await mockUSDCInstance!.mint(deployer.address, usdcAmount);
        await tx.wait();
        return tx;
      },
      CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "USDC minting"
    );
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to deployer");

    // Deploy MockUSDT
    console.log("Connecting to MockUSDT contract factory...");
    const MockUSDT = await ethers.getContractFactory("MockUSDC"); // Reuse MockUSDC contract
    console.log("MockUSDT contract factory connected.");

    // For MockUSDT
    const mockUSDTNonce = await getNextNonce(deployer);
    const mockUSDT = await retry(
      () => MockUSDT.deploy("Tether USD", "USDT", 6, {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: CONFIG.GAS_PRICE,
        nonce: mockUSDTNonce
      }),
      CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "MockUSDT deployment"
    );

    await retry(
      () => mockUSDT.waitForDeployment(),
      CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "MockUSDT deployment confirmation"
    );

    usdtAddress = await mockUSDT.getAddress();
    mockUSDTInstance = mockUSDT as unknown as MockStablecoin;
    console.log("MockUSDT deployed to:", usdtAddress);

    // Mint some test USDT
    const usdtAmount = ethers.parseUnits("1000000", 6); // 1M USDT
    await retry(
      async () => {
        const tx = await mockUSDTInstance!.mint(deployer.address, usdtAmount);
        await tx.wait();
        return tx;
      },
      CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "USDT minting"
    );
    console.log("Minted", ethers.formatUnits(usdtAmount, 6), "USDT to deployer");
  } else {
    // Production - use provided stablecoin addresses
    const usdcEnvAddress = process.env.USDC_ADDRESS;
    const usdtEnvAddress = process.env.USDT_ADDRESS;

    if (!usdcEnvAddress || !usdtEnvAddress) {
      throw new Error("USDC_ADDRESS and USDT_ADDRESS environment variables are required for production deployment");
    }

    usdcAddress = usdcEnvAddress;
    usdtAddress = usdtEnvAddress;
    console.log("Using existing stablecoins:");
    console.log("- USDC:", usdcAddress);
    console.log("- USDT:", usdtAddress);
  }

  // Add tokens to registry
  console.log("Adding stablecoins to TokenRegistry...");
  await retry(
    async () => {
      const tx = await tokenRegistry.addToken(
        usdcAddress,
        6,
        ethers.parseUnits("100", 6), // Min loan amount: 100 USDC
        ethers.parseUnits("100000", 6) // Max loan amount: 100,000 USDC
      );
      await tx.wait();
      return tx;
    },
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "Adding USDC to TokenRegistry"
  );
  console.log("Added USDC to TokenRegistry");

  await retry(
    async () => {
      const tx = await tokenRegistry.addToken(
        usdtAddress,
        6,
        ethers.parseUnits("100", 6), // Min loan amount: 100 USDT
        ethers.parseUnits("100000", 6) // Max loan amount: 100,000 USDT
      );
      await tx.wait();
      return tx;
    },
    CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "Adding USDT to TokenRegistry"
  );
  console.log("Added USDT to TokenRegistry");

  // Always mint stablecoins to MorphoAdapter for testing
  console.log("\n--- Minting stablecoins to MorphoAdapter ---");

  if (mockUSDCInstance) {
    console.log("Minting USDC to MorphoAdapter...");
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await retry(async () => {
      const tx = await mockUSDCInstance!.mint(morphoAdapterAddress, usdcAmount);
      await tx.wait();
      return tx;
    }, CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "Minting USDC to MorphoAdapter");
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to MorphoAdapter");

    // Verify MorphoAdapter has sufficient USDC balance
    const usdcBalance = await mockUSDCInstance.balanceOf(morphoAdapterAddress);
    console.log("MorphoAdapter USDC balance:", ethers.formatUnits(usdcBalance, 6));

    if (usdcBalance < ethers.parseUnits("1000", 6)) {
      console.error("WARNING: MorphoAdapter USDC balance is less than expected");
    } else {
      console.log("✅ MorphoAdapter has sufficient USDC balance");
    }
  }

  if (mockUSDTInstance) {
    console.log("Minting USDT to MorphoAdapter...");
    const usdtAmount = ethers.parseUnits("1000000", 6); // 1M USDT
    await retry(async () => {
      const tx = await mockUSDTInstance!.mint(morphoAdapterAddress, usdtAmount);
      await tx.wait();
      return tx;
    }, CONFIG.MAX_RETRIES, CONFIG.INITIAL_DELAY, CONFIG.MAX_DELAY, "Minting USDT to MorphoAdapter");
    console.log("Minted", ethers.formatUnits(usdtAmount, 6), "USDT to MorphoAdapter");

    // Verify MorphoAdapter has sufficient USDT balance
    const usdtBalance = await mockUSDTInstance.balanceOf(morphoAdapterAddress);
    console.log("MorphoAdapter USDT balance:", ethers.formatUnits(usdtBalance, 6));

    if (usdtBalance < ethers.parseUnits("1000", 6)) {
      console.error("WARNING: MorphoAdapter USDT balance is less than expected");
    } else {
      console.log("✅ MorphoAdapter has sufficient USDT balance");
    }
  }

  // Save deployed addresses to JSON file
  const deployedAddresses = {
    TokenRegistry: tokenRegistryAddress,
    TokenizedPolicy: await tokenizedPolicyInstance.getAddress(),
    RiskEngine: await riskEngine.getAddress(),
    LoanOrigination: await loanOrigination.getAddress(),
    MorphoAdapter: await morphoAdapter.getAddress(),
    USDC: usdcAddress,
    USDT: usdtAddress
  };

  // Read existing addresses file if it exists
  const addressesFilePath = path.join(__dirname, '../deployed-addresses.json');
  let existingAddresses: Record<string, Record<string, string>> = {};

  try {
    if (fs.existsSync(addressesFilePath)) {
      const fileContent = fs.readFileSync(addressesFilePath, 'utf8');
      existingAddresses = JSON.parse(fileContent);
    }
  } catch (error) {
    console.warn('Could not read existing addresses file:', error);
  }

  // Update with new addresses
  existingAddresses[network.name] = deployedAddresses;

  // Write updated addresses back to file
  fs.writeFileSync(
    addressesFilePath,
    JSON.stringify(existingAddresses, null, 2),
    'utf8'
  );

  // Also update the frontend's deployed-addresses.json file
  const frontendAddressesFilePath = path.join(__dirname, '../../frontend/src/config/deployed-addresses.json');
  try {
    // Ensure the frontend directory exists
    const frontendDir = path.dirname(frontendAddressesFilePath);
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
      console.log(`Created directory: ${frontendDir}`);
    }

    // Check if the frontend addresses file exists
    let frontendAddresses: Record<string, Record<string, string>> = {};
    if (fs.existsSync(frontendAddressesFilePath)) {
      const fileContent = fs.readFileSync(frontendAddressesFilePath, 'utf8');
      frontendAddresses = JSON.parse(fileContent);
    }

    // Update with new addresses
    frontendAddresses[network.name] = deployedAddresses;

    // Write updated addresses to frontend file
    fs.writeFileSync(
      frontendAddressesFilePath,
      JSON.stringify(frontendAddresses, null, 2),
      'utf8'
    );

    console.log(`Frontend addresses updated at ${frontendAddressesFilePath}`);
  } catch (error) {
    console.error('Error updating frontend addresses:', error);
  }

  // Final verification step
  console.log("\n--- Final Deployment Verification ---");

  // 1. Verify LoanOrigination has the correct MorphoAdapter address
  const finalMorphoAdapter = await loanOrigination.morphoAdapter();
  console.log("MorphoAdapter in LoanOrigination:", finalMorphoAdapter);
  console.log("Expected MorphoAdapter:", morphoAdapterAddress);

  if (finalMorphoAdapter.toLowerCase() !== morphoAdapterAddress.toLowerCase()) {
    console.error("❌ ERROR: MorphoAdapter address mismatch in LoanOrigination");
  } else {
    console.log("✅ MorphoAdapter address correct in LoanOrigination");
  }

  // 2. Verify MorphoAdapter has LoanOrigination as LOAN_ORIGINATOR_ROLE
  const finalLoanOriginatorRole = ethers.keccak256(ethers.toUtf8Bytes("LOAN_ORIGINATOR_ROLE"));
  const finalHasRole = await morphoAdapter.hasRole(finalLoanOriginatorRole, loanOriginationAddress);
  console.log("LoanOrigination has LOAN_ORIGINATOR_ROLE:", finalHasRole);

  if (!finalHasRole) {
    console.error("❌ ERROR: LoanOrigination does not have LOAN_ORIGINATOR_ROLE");
  } else {
    console.log("✅ LoanOrigination has LOAN_ORIGINATOR_ROLE");
  }

  // 3. Verify stablecoin balances
  if (mockUSDCInstance) {
    const usdcBalance = await mockUSDCInstance.balanceOf(morphoAdapterAddress);
    console.log("MorphoAdapter USDC balance:", ethers.formatUnits(usdcBalance, 6));

    if (usdcBalance < ethers.parseUnits("1000", 6)) {
      console.error("❌ ERROR: MorphoAdapter USDC balance is too low");
    } else {
      console.log("✅ MorphoAdapter has sufficient USDC balance");
    }
  }

  if (mockUSDTInstance) {
    const usdtBalance = await mockUSDTInstance.balanceOf(morphoAdapterAddress);
    console.log("MorphoAdapter USDT balance:", ethers.formatUnits(usdtBalance, 6));

    if (usdtBalance < ethers.parseUnits("1000", 6)) {
      console.error("❌ ERROR: MorphoAdapter USDT balance is too low");
    } else {
      console.log("✅ MorphoAdapter has sufficient USDT balance");
    }
  }

  console.log("\nQuickFi contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log("TokenRegistry:", tokenRegistryAddress);
  console.log("TokenizedPolicy:", await tokenizedPolicyInstance.getAddress());
  console.log("RiskEngine:", await riskEngine.getAddress());
  console.log("LoanOrigination:", loanOriginationAddress);
  console.log("MorphoAdapter:", morphoAdapterAddress);
  console.log("USDC:", usdcAddress);
  console.log("USDT:", usdtAddress);
  console.log("\nAddresses saved to", addressesFilePath);

  // Automatically upload addresses to Supabase if not skipped and credentials are available
  if (!CONFIG.SKIP_SUPABASE && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log("\nUploading addresses to Supabase...");
    try {
      // Initialize Supabase client
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Convert chainId from BigInt to number
      const chainId = Number(network.chainId);

      // First, mark all existing addresses for this chain_id as not current
      const { error: updateError } = await supabase
        .from('contract_addresses')
        .update({ is_current: false })
        .eq('chain_id', chainId);

      if (updateError) {
        console.error("Error updating existing addresses:", updateError);
      }

      // Upload each contract address to Supabase
      for (const [contractName, address] of Object.entries(deployedAddresses)) {
        const { error } = await supabase
          .from('contract_addresses')
          .upsert({
            contract_name: contractName,
            address: address as string,
            chain_id: chainId,
            is_current: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'chain_id,contract_name',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error uploading ${contractName} address:`, error);
        } else {
          console.log(`Successfully uploaded ${contractName} address to Supabase`);
        }
      }

      console.log("All addresses successfully uploaded to Supabase");

      // Update frontend .env.local file
      await updateFrontendEnv(network.name, deployedAddresses);
    } catch (error) {
      console.error("Failed to upload addresses to Supabase:", error);
      console.log("You can manually upload addresses later with: npm run upload-addresses");
    }
  } else {
    console.log("\nTo upload addresses to Supabase, run: npm run upload-addresses");
  }
}

/**
 * Updates the frontend .env.local file with contract addresses
 */
async function updateFrontendEnv(network: string, addresses: Record<string, string>) {
  // Only update frontend for specific networks
  const allowedNetworks = ['localhost', 'pharosDevnet', 'sepolia'];
  if (!allowedNetworks.includes(network)) {
    console.log(`Skipping frontend .env update for network: ${network}`);
    return;
  }

  // Path to frontend .env.local file
  const envPath = path.join(__dirname, '../../frontend/.env.local');
  let envContent = '';

  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
  } catch (error) {
    console.warn('Could not read .env.local file:', error);
  }

  // Map contract names to environment variable names
  const contractToEnvMap: Record<string, string> = {
    'TokenizedPolicy': 'NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS',
    'RiskEngine': 'NEXT_PUBLIC_RISK_ENGINE_ADDRESS',
    'LoanOrigination': 'NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS',
    'MorphoAdapter': 'NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS'
    // Removed USDC and USDT as we now use deployed-addresses.json instead of environment variables
  };

  // Update environment variables
  let newEnvContent = envContent;

  for (const [contractName, address] of Object.entries(addresses)) {
    const envName = contractToEnvMap[contractName];
    if (envName) {
      // Check if the variable already exists in the file
      const regex = new RegExp(`^${envName}=.*$`, 'm');

      if (regex.test(newEnvContent)) {
        // Replace existing variable
        newEnvContent = newEnvContent.replace(regex, `${envName}=${address}`);
      } else {
        // Add new variable
        newEnvContent += `\n${envName}=${address}`;
      }
    }
  }

  // Write updated .env.local file
  fs.writeFileSync(envPath, newEnvContent, 'utf8');
  console.log(`Frontend environment variables updated in ${envPath}`);
}

// Run the main deployment function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});