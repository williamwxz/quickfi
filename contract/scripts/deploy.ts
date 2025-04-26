import { ethers } from "hardhat";
import { BaseContract } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface MockStablecoin extends BaseContract {
  mint(to: string, amount: bigint): Promise<any>;
}

interface TokenRegistry extends BaseContract {
  addToken(token: string, decimals: number, minLoanAmount: bigint, maxLoanAmount: bigint): Promise<any>;
}

interface LoanOrigination extends BaseContract {
  updateMorphoAdapter(adapter: string): Promise<any>;
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

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        console.error(`Failed ${name} after ${maxRetries} retries`);
        throw error;
      }

      console.log(`Attempt ${retries} for ${name} failed. Retrying in ${delay / 1000} seconds...`);
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);

      // Wait for the delay period
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff with jitter
      delay = Math.min(delay * 2, maxDelay) * (0.8 + Math.random() * 0.4);
    }
  }
}

async function main() {
  // Validate Supabase credentials before starting deployment
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn("Warning: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are not set.");
    console.warn("Contract addresses will not be automatically uploaded to Supabase.");
    return;
  }

  const network = await ethers.provider.getNetwork();
  console.log("Deploying QuickFi contracts to", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get the current nonce
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Starting deployment with nonce:", currentNonce);

  // Deploy TokenRegistry
  console.log("Deploying TokenRegistry...");
  const TokenRegistryFactory = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await retry(
    () => TokenRegistryFactory.deploy({
      gasLimit: 5000000
    }),
    5, 1000, 30000, "TokenRegistry deployment"
  ) as unknown as TokenRegistry;

  await retry(
    () => tokenRegistry.waitForDeployment(),
    5, 1000, 30000, "TokenRegistry deployment confirmation"
  );

  const tokenRegistryAddress = await tokenRegistry.getAddress();
  console.log("TokenRegistry deployed to:", tokenRegistryAddress);

  // Handle stablecoin setup based on network
  let usdcAddress: string;
  let usdtAddress: string;
  let mockUSDCInstance: MockStablecoin | undefined;
  let mockUSDTInstance: MockStablecoin | undefined;

  if (network.name === "hardhat" || network.name === "localhost" || network.name === "pharosDevnet" || network.name === "sepolia") {
    // Local or testnet - deploy MockUSDC
    console.log(`${network.name} network detected - Deploying Mock Stablecoins...`);

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await retry(
      () => MockUSDC.deploy("USD Coin", "USDC", 6, {
        gasLimit: 5000000
      }),
      5, 1000, 30000, "MockUSDC deployment"
    );

    await retry(
      () => mockUSDC.waitForDeployment(),
      5, 1000, 30000, "MockUSDC deployment confirmation"
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
      5, 1000, 30000, "USDC minting"
    );
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to deployer");

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDC"); // Reuse MockUSDC contract
    const mockUSDT = await retry(
      () => MockUSDT.deploy("Tether USD", "USDT", 6, {
        gasLimit: 5000000
      }),
      5, 1000, 30000, "MockUSDT deployment"
    );

    await retry(
      () => mockUSDT.waitForDeployment(),
      5, 1000, 30000, "MockUSDT deployment confirmation"
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
      5, 1000, 30000, "USDT minting"
    );
    console.log("Minted", ethers.formatUnits(usdtAmount, 6), "USDT to deployer");

    // Add tokens to registry
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
      5, 1000, 30000, "Adding USDC to TokenRegistry"
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
      5, 1000, 30000, "Adding USDT to TokenRegistry"
    );
    console.log("Added USDT to TokenRegistry");
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

    // Add tokens to registry
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
      5, 1000, 30000, "Adding USDC to TokenRegistry"
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
      5, 1000, 30000, "Adding USDT to TokenRegistry"
    );
    console.log("Added USDT to TokenRegistry");
  }

  // Deploy TokenizedPolicy (non-proxy version for simplicity)
  console.log("Deploying TokenizedPolicy...");
  const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
  const tokenizedPolicyInstance = await retry(
    () => TokenizedPolicy.deploy("Insurance Policy Token", "IPT", {
      gasLimit: 5000000
    }),
    5, 1000, 30000, "TokenizedPolicy deployment"
  );

  await retry(
    () => tokenizedPolicyInstance.waitForDeployment(),
    5, 1000, 30000, "TokenizedPolicy deployment confirmation"
  );

  const tokenizedPolicyAddress = await tokenizedPolicyInstance.getAddress();
  console.log("TokenizedPolicy deployed to:", tokenizedPolicyAddress);

  // Deploy RiskEngine
  console.log("Deploying RiskEngine...");
  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  const riskEngine = await retry(
    () => RiskEngine.deploy({
      gasLimit: 5000000
    }),
    5, 1000, 30000, "RiskEngine deployment"
  );

  await retry(
    () => riskEngine.waitForDeployment(),
    5, 1000, 30000, "RiskEngine deployment confirmation"
  );

  const riskEngineAddress = await riskEngine.getAddress();
  console.log("RiskEngine deployed to:", riskEngineAddress);

  // Deploy contracts with circular dependencies using placeholder addresses first
  console.log("Deploying LoanOrigination with placeholder addresses...");
  const LoanOriginationFactory = await ethers.getContractFactory("LoanOrigination");

  const loanOrigination = await retry(async () => {
    return LoanOriginationFactory.deploy(
      riskEngineAddress,
      deployer.address, // Temporary placeholder for MorphoAdapter
      tokenRegistryAddress,
      {
        gasLimit: 5000000
      }
    );
  }, 5, 1000, 30000, "LoanOrigination deployment") as unknown as LoanOrigination;

  await retry(
    () => loanOrigination.waitForDeployment(),
    5, 1000, 30000, "LoanOrigination deployment confirmation"
  );

  const loanOriginationAddress = await loanOrigination.getAddress();
  console.log("LoanOrigination deployed to:", loanOriginationAddress);

  // Deploy MorphoAdapter with Proxy Pattern
  console.log("Deploying MorphoAdapter with Proxy Pattern...");

  // Import required contracts for proxy deployment
  const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
  const TransparentUpgradeableProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");

  // 1. Deploy the implementation contract
  console.log("Deploying MorphoAdapter implementation...");
  const morphoAdapterImplementation = await retry(
    () => MorphoAdapter.deploy({
      gasLimit: 5000000
    }),
    5, 1000, 30000, "MorphoAdapter implementation deployment"
  );

  await retry(
    () => morphoAdapterImplementation.waitForDeployment(),
    5, 1000, 30000, "MorphoAdapter implementation deployment confirmation"
  );

  const implementationAddress = await morphoAdapterImplementation.getAddress();
  console.log("MorphoAdapter implementation deployed to:", implementationAddress);

  // 2. Deploy the ProxyAdmin (owner of the proxy)
  console.log("Deploying ProxyAdmin...");
  const proxyAdmin = await retry(
    () => ProxyAdmin.deploy({
      gasLimit: 5000000
    }),
    5, 1000, 30000, "ProxyAdmin deployment"
  );

  await retry(
    () => proxyAdmin.waitForDeployment(),
    5, 1000, 30000, "ProxyAdmin deployment confirmation"
  );

  const proxyAdminAddress = await proxyAdmin.getAddress();
  console.log("ProxyAdmin deployed to:", proxyAdminAddress);

  // 3. Prepare initialization data
  const initData = MorphoAdapter.interface.encodeFunctionData(
    "initialize",
    [loanOriginationAddress, tokenRegistryAddress]
  );

  // 4. Deploy the TransparentUpgradeableProxy
  console.log("Deploying TransparentUpgradeableProxy...");
  const proxy = await retry(
    () => TransparentUpgradeableProxy.deploy(
      implementationAddress,
      proxyAdminAddress,
      initData,
      {
        gasLimit: 5000000
      }
    ),
    5, 1000, 30000, "TransparentUpgradeableProxy deployment"
  );

  await retry(
    () => proxy.waitForDeployment(),
    5, 1000, 30000, "TransparentUpgradeableProxy deployment confirmation"
  );

  const proxyAddress = await proxy.getAddress();
  console.log("TransparentUpgradeableProxy deployed to:", proxyAddress);

  // 5. Create a contract instance that points to the proxy
  const morphoAdapter = MorphoAdapter.attach(proxyAddress) as unknown as {
    loanOrigination: () => Promise<string>;
    getAddress: () => Promise<string>;
  };
  console.log("MorphoAdapter (proxy) ready at:", proxyAddress);

  // Verify initialization was successful
  try {
    const loanOriginationAddress = await retry(
      () => morphoAdapter.loanOrigination(),
      5, 1000, 30000, "MorphoAdapter initialization verification"
    );
    console.log("MorphoAdapter successfully initialized with LoanOrigination:", loanOriginationAddress);
  } catch (error) {
    console.error("Error verifying MorphoAdapter initialization:", error);
    console.log("Continuing with deployment...");
  }

  // Update LoanOrigination with the correct MorphoAdapter address
  console.log("Updating LoanOrigination with correct MorphoAdapter address...");
  await retry(async () => {
    const morphoAdapterAddress = await morphoAdapter.getAddress();
    const tx = await loanOrigination.updateMorphoAdapter(morphoAdapterAddress);
    await tx.wait();
    return tx;
  }, 5, 1000, 30000, "Updating LoanOrigination with MorphoAdapter address");
  console.log("LoanOrigination updated");

  // Set risk parameters for the tokenized policy in the risk engine
  console.log("Setting risk parameters for TokenizedPolicy...");
  await retry(async () => {
    const tx = await riskEngine.updateRiskParameters(
      tokenizedPolicyAddress,
      7000, // 70% max LTV
      8500, // 85% liquidation threshold
      500   // 5% base interest rate
    );
    await tx.wait();
    return tx;
  }, 5, 1000, 30000, "Setting risk parameters");
  console.log("Risk parameters set");

  // For local or testnet, mint some stablecoins to MorphoAdapter
  if ((network.name === "hardhat" || network.name === "localhost" || network.name === "pharosDevnet" || network.name === "sepolia")) {
    if (mockUSDCInstance) {
      console.log("Minting USDC to MorphoAdapter for testing...");
      const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
      await retry(async () => {
        const morphoAdapterAddress = await morphoAdapter.getAddress();
        const tx = await mockUSDCInstance!.mint(morphoAdapterAddress, usdcAmount);
        await tx.wait();
        return tx;
      }, 5, 1000, 30000, "Minting USDC to MorphoAdapter");
      console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to MorphoAdapter");
    }

    if (mockUSDTInstance) {
      console.log("Minting USDT to MorphoAdapter for testing...");
      const usdtAmount = ethers.parseUnits("1000000", 6); // 1M USDT
      await retry(async () => {
        const morphoAdapterAddress = await morphoAdapter.getAddress();
        const tx = await mockUSDTInstance!.mint(morphoAdapterAddress, usdtAmount);
        await tx.wait();
        return tx;
      }, 5, 1000, 30000, "Minting USDT to MorphoAdapter");
      console.log("Minted", ethers.formatUnits(usdtAmount, 6), "USDT to MorphoAdapter");
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
  const addressesPath = path.join(__dirname, '../deployed-addresses.json');
  let existingAddresses: Record<string, Record<string, string>> = {};

  try {
    if (fs.existsSync(addressesPath)) {
      const fileContent = fs.readFileSync(addressesPath, 'utf8');
      existingAddresses = JSON.parse(fileContent);
    }
  } catch (error) {
    console.warn('Could not read existing addresses file:', error);
  }

  // Update with new addresses
  existingAddresses[network.name] = deployedAddresses;

  // Write updated addresses back to file
  fs.writeFileSync(
    addressesPath,
    JSON.stringify(existingAddresses, null, 2),
    'utf8'
  );

  // Also update the frontend's deployed-addresses.json file
  const frontendAddressesPath = path.join(__dirname, '../../frontend/src/config/deployed-addresses.json');
  try {
    // Ensure the frontend directory exists
    const frontendDir = path.dirname(frontendAddressesPath);
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
      console.log(`Created directory: ${frontendDir}`);
    }

    // Check if the frontend addresses file exists
    let frontendAddresses: Record<string, Record<string, string>> = {};
    if (fs.existsSync(frontendAddressesPath)) {
      const fileContent = fs.readFileSync(frontendAddressesPath, 'utf8');
      frontendAddresses = JSON.parse(fileContent);
    }

    // Update with new addresses
    frontendAddresses[network.name] = deployedAddresses;

    // Write updated addresses to frontend file
    fs.writeFileSync(
      frontendAddressesPath,
      JSON.stringify(frontendAddresses, null, 2),
      'utf8'
    );

    console.log(`Frontend addresses updated at ${frontendAddressesPath}`);
  } catch (error) {
    console.error('Error updating frontend addresses:', error);
  }

  console.log("\nQuickFi contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log("TokenRegistry:", tokenRegistryAddress);
  console.log("TokenizedPolicy:", await tokenizedPolicyInstance.getAddress());
  console.log("RiskEngine:", await riskEngine.getAddress());
  console.log("LoanOrigination:", await loanOrigination.getAddress());
  console.log("MorphoAdapter:", await morphoAdapter.getAddress());
  console.log("USDC:", usdcAddress);
  console.log("USDT:", usdtAddress);
  console.log("\nAddresses saved to", addressesPath);

  // Automatically upload addresses to Supabase if credentials are available
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
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