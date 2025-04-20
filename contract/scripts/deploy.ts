import { ethers } from "hardhat";
import { BaseContract } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { createClient } from '@supabase/supabase-js';

interface MockStablecoin extends BaseContract {
  mint(to: string, amount: bigint): Promise<any>;
}

interface TokenRegistry extends BaseContract {
  addToken(token: string, decimals: number, minLoanAmount: bigint, maxLoanAmount: bigint): Promise<any>;
}

interface LoanOrigination extends BaseContract {
  updateMorphoAdapter(adapter: string): Promise<any>;
}

async function main() {
  // Validate Supabase credentials before starting deployment
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required");
    console.error("Please add them to your .env file:");
    console.error("SUPABASE_URL=your_supabase_url");
    console.error("SUPABASE_ANON_KEY=your_supabase_anon_key");
    process.exit(1);
  }

  const network = await ethers.provider.getNetwork();
  console.log("Deploying QuickFi contracts to", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy TokenRegistry
  console.log("Deploying TokenRegistry...");
  const TokenRegistryFactory = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistryFactory.deploy() as unknown as TokenRegistry;
  await tokenRegistry.waitForDeployment();
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
    const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    mockUSDCInstance = mockUSDC as unknown as MockStablecoin;
    console.log("MockUSDC deployed to:", usdcAddress);

    // Mint some test USDC
    const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await mockUSDCInstance.mint(deployer.address, usdcAmount);
    console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to deployer");

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDC"); // Reuse MockUSDC contract
    const mockUSDT = await MockUSDT.deploy("Tether USD", "USDT", 6);
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();
    mockUSDTInstance = mockUSDT as unknown as MockStablecoin;
    console.log("MockUSDT deployed to:", usdtAddress);

    // Mint some test USDT
    const usdtAmount = ethers.parseUnits("1000000", 6); // 1M USDT
    await mockUSDTInstance.mint(deployer.address, usdtAmount);
    console.log("Minted", ethers.formatUnits(usdtAmount, 6), "USDT to deployer");

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
  const LoanOriginationFactory = await ethers.getContractFactory("LoanOrigination");
  const loanOrigination = await LoanOriginationFactory.deploy(
    await riskEngine.getAddress(),
    deployer.address, // Temporary placeholder for MorphoAdapter
    tokenRegistryAddress
  ) as unknown as LoanOrigination;
  await loanOrigination.waitForDeployment();
  console.log("LoanOrigination deployed to:", await loanOrigination.getAddress());

  // Deploy MorphoAdapter with Proxy Pattern
  console.log("Deploying MorphoAdapter with Proxy Pattern...");

  // Import required contracts for proxy deployment
  const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
  const TransparentUpgradeableProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");

  // 1. Deploy the implementation contract
  console.log("Deploying MorphoAdapter implementation...");
  const morphoAdapterImplementation = await MorphoAdapter.deploy();
  await morphoAdapterImplementation.waitForDeployment();
  const implementationAddress = await morphoAdapterImplementation.getAddress();
  console.log("MorphoAdapter implementation deployed to:", implementationAddress);

  // 2. Deploy the ProxyAdmin (owner of the proxy)
  console.log("Deploying ProxyAdmin...");
  const proxyAdmin = await ProxyAdmin.deploy();
  await proxyAdmin.waitForDeployment();
  const proxyAdminAddress = await proxyAdmin.getAddress();
  console.log("ProxyAdmin deployed to:", proxyAdminAddress);

  // 3. Prepare initialization data
  const initData = MorphoAdapter.interface.encodeFunctionData(
    "initialize",
    [await loanOrigination.getAddress(), tokenRegistryAddress]
  );

  // 4. Deploy the TransparentUpgradeableProxy
  console.log("Deploying TransparentUpgradeableProxy...");
  const proxy = await TransparentUpgradeableProxy.deploy(
    implementationAddress,
    proxyAdminAddress,
    initData
  );
  await proxy.waitForDeployment();
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
    const loanOriginationAddress = await morphoAdapter.loanOrigination();
    console.log("MorphoAdapter successfully initialized with LoanOrigination:", loanOriginationAddress);
  } catch (error) {
    console.error("Error verifying MorphoAdapter initialization:", error);
    console.log("Continuing with deployment...");
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

  // For local or testnet, mint some stablecoins to MorphoAdapter
  if ((network.name === "hardhat" || network.name === "localhost" || network.name === "pharosDevnet" || network.name === "sepolia")) {
    if (mockUSDCInstance) {
      console.log("Minting USDC to MorphoAdapter for testing...");
      const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC
      await mockUSDCInstance.mint(await morphoAdapter.getAddress(), usdcAmount);
      console.log("Minted", ethers.formatUnits(usdcAmount, 6), "USDC to MorphoAdapter");
    }

    if (mockUSDTInstance) {
      console.log("Minting USDT to MorphoAdapter for testing...");
      const usdtAmount = ethers.parseUnits("1000000", 6); // 1M USDT
      await mockUSDTInstance.mint(await morphoAdapter.getAddress(), usdtAmount);
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
    'MorphoAdapter': 'NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS',
    'USDC': 'NEXT_PUBLIC_USDC_ADDRESS',
    'USDT': 'NEXT_PUBLIC_USDT_ADDRESS'
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});