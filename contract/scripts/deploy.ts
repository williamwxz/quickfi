import { ethers } from "hardhat";
import { BaseContract } from "ethers";

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

  if (network.name === "hardhat" || network.name === "localhost") {
    // Local testing - deploy MockUSDC
    console.log("Local network detected - Deploying Mock Stablecoins...");

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

  // For local testing, mint some stablecoins to MorphoAdapter
  if ((network.name === "hardhat" || network.name === "localhost")) {
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

  console.log("\nQuickFi contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log("TokenRegistry:", tokenRegistryAddress);
  console.log("TokenizedPolicy:", await tokenizedPolicyInstance.getAddress());
  console.log("RiskEngine:", await riskEngine.getAddress());
  console.log("LoanOrigination:", await loanOrigination.getAddress());
  console.log("MorphoAdapter:", await morphoAdapter.getAddress());
  console.log("USDC:", usdcAddress);
  console.log("USDT:", usdtAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});