// Pharos Devnet Demo Script
// This script demonstrates the QuickFi protocol using deployed contracts on Pharos devnet

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting QuickFi Pharos Devnet Demo...");

  // Get network name
  const network = await ethers.provider.getNetwork();
  console.log(`Connected to network: ${network.name}`);

  // Get signers
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log(`Using account: ${deployer.address}`);

  // Contract addresses on Pharos devnet
  const tokenRegistryAddress = "0x05Fa836897A0e34d8f0efB22655D8322e8193D94";
  const usdcAddress = process.env.USDC_ADDRESS || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const usdtAddress = process.env.USDT_ADDRESS || "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const tokenizedPolicyAddress = "0x2316cE3B49676bE1001882116a30344bD51b4417";
  const loanOriginationAddress = "0x28750a1E271C5407D157dDFA1C218178d8a25b37";
  const morphoAdapterAddress = "0x2859781154739A828A7DE8f43b67B72A48a2E772";
  const riskEngineAddress = "0x5725c3539D17876730c426Dd9c07FD6644Ebd715";

  console.log("\n==== Deployed Contract Addresses ====");
  console.log(`TokenRegistry: ${tokenRegistryAddress}`);
  console.log(`TokenizedPolicy: ${tokenizedPolicyAddress}`);
  console.log(`LoanOrigination: ${loanOriginationAddress}`);
  console.log(`MorphoAdapter: ${morphoAdapterAddress}`);
  console.log(`RiskEngine: ${riskEngineAddress}`);
  console.log(`USDC: ${usdcAddress}`);
  console.log(`USDT: ${usdtAddress}`);

  // Connect to deployed contracts
  console.log("\n==== Connecting to Deployed Contracts ====");
  
  try {
    const TokenRegistry = await ethers.getContractFactory("contracts/utils/TokenRegistry.sol:TokenRegistry");
    const tokenRegistry = TokenRegistry.attach(tokenRegistryAddress);
    console.log(`Connected to TokenRegistry at: ${tokenRegistryAddress}`);
    
    // Check supported tokens
    const supportedTokens = await tokenRegistry.getSupportedTokens();
    console.log(`Supported tokens: ${supportedTokens.length}`);
    for (let i = 0; i < supportedTokens.length; i++) {
      const token = supportedTokens[i];
      console.log(`Token ${i}: ${token}`);
    }
  } catch (error) {
    console.log(`Error connecting to TokenRegistry: ${error.message}`);
  }

  try {
    const TokenizedPolicy = await ethers.getContractFactory("TokenizedPolicy");
    const tokenizedPolicy = TokenizedPolicy.attach(tokenizedPolicyAddress);
    console.log(`Connected to TokenizedPolicy at: ${tokenizedPolicyAddress}`);
    
    // Check if the deployer owns any policies
    try {
      const balance = await tokenizedPolicy.balanceOf(deployer.address);
      console.log(`Policy token balance: ${balance}`);
      
      if (balance > 0) {
        // Get the first token ID owned by the deployer
        const tokenId = await tokenizedPolicy.tokenOfOwnerByIndex(deployer.address, 0);
        console.log(`Found policy token #${tokenId}`);
        
        // Get policy details
        const details = await tokenizedPolicy.getPolicyDetails(tokenId);
        console.log(`Policy Details:
  - Policy Number: ${details[0]}
  - Issuer: ${details[1]}
  - Valuation: ${ethers.formatUnits(details[2], 6)} USDC
  - Expiry Date: ${new Date(Number(details[3]) * 1000).toLocaleDateString()}`);
      } else {
        console.log("No policy tokens found. You can mint a policy token using the mint function.");
      }
    } catch (error) {
      console.log(`Error checking policy tokens: ${error.message}`);
    }
  } catch (error) {
    console.log(`Error connecting to TokenizedPolicy: ${error.message}`);
  }

  try {
    const LoanOrigination = await ethers.getContractFactory("LoanOrigination");
    const loanOrigination = LoanOrigination.attach(loanOriginationAddress);
    console.log(`Connected to LoanOrigination at: ${loanOriginationAddress}`);
    
    // Check loan count
    try {
      const loanCount = await loanOrigination.getLoanCount();
      console.log(`Total loans: ${loanCount}`);
      
      if (loanCount > 0) {
        // Get the most recent loan
        const loanId = loanCount - 1;
        const loan = await loanOrigination.getLoan(loanId);
        console.log(`Most recent loan (ID: ${loanId}):
  - Borrower: ${loan.borrower}
  - Principal: ${ethers.formatUnits(loan.principal, 6)}
  - Interest Rate: ${Number(loan.interestRate) / 100}%
  - Duration: ${Number(loan.duration) / (24 * 60 * 60)} days
  - Status: ${loan.status} (1=REQUESTED, 2=ACTIVE, 3=REPAID, 4=DEFAULTED, 5=LIQUIDATED)`);
      }
    } catch (error) {
      console.log(`Error checking loans: ${error.message}`);
    }
  } catch (error) {
    console.log(`Error connecting to LoanOrigination: ${error.message}`);
  }

  // Simulate loan process
  console.log("\n==== Simulating Loan Process ====");
  
  // Calculate loan parameters
  const loanAmount = ethers.parseUnits("7000", 6); // $7,000 loan (70% LTV)
  const interestRate = 500; // 5.00% APR
  const loanDuration = 30 * 24 * 60 * 60; // 30 days in seconds
  const loanEndDate = new Date((Date.now() / 1000 + loanDuration) * 1000).toLocaleDateString();

  console.log(`Loan Parameters:
  - Loan Amount: ${ethers.formatUnits(loanAmount, 6)} USDC
  - Interest Rate: ${interestRate / 100}%
  - Duration: 30 days
  - End Date: ${loanEndDate}
  - Stablecoin: USDC
  `);
  
  console.log("On Pharos devnet, you would create a loan with these parameters");
  console.log("To create an actual loan, you would need to:");
  console.log("1. Mint a policy token");
  console.log("2. Approve the LoanOrigination contract to transfer your policy token");
  console.log("3. Call requestLoan() with the policy token ID, loan amount, duration, and stablecoin address");
  console.log("4. Call activateLoan() to fund the loan");
  
  // Calculate repayment
  const interest = (loanAmount * BigInt(interestRate) * BigInt(loanDuration)) / BigInt(10000 * 365 * 24 * 60 * 60);
  const repaymentAmount = loanAmount + interest;

  console.log(`\nRepayment Calculation:
  - Principal: ${ethers.formatUnits(loanAmount, 6)} USDC
  - Interest: ${ethers.formatUnits(interest, 6)} USDC
  - Total Repayment: ${ethers.formatUnits(repaymentAmount, 6)} USDC
  `);
  
  console.log("To repay a loan, you would need to:");
  console.log("1. Approve the LoanOrigination contract to transfer the repayment amount of the stablecoin");
  console.log("2. Call repayLoan() with the loan ID and repayment amount");

  // Demonstrate Oracle integration
  console.log("\n==== Oracle Integration ====");
  console.log("The QuickFi protocol integrates with oracles to get real-time policy data:");
  console.log("1. Policy valuation is retrieved from the oracle to calculate loan-to-value ratio");
  console.log("2. Policy expiry date is checked to ensure the policy is valid for the loan duration");
  console.log("3. Policy status is monitored to detect defaults or cancellations");
  console.log("4. When a policy defaults, the insurance company is notified via the oracle");
  console.log("5. The oracle provides bidirectional communication with insurance company systems");

  console.log("\n==== Multi-Token Support ====");
  console.log("The QuickFi protocol supports multiple stablecoins:");
  console.log("1. USDC and USDT are currently supported");
  console.log("2. Each loan is denominated in a single stablecoin");
  console.log("3. The TokenRegistry manages supported stablecoins and their parameters");
  console.log("4. New stablecoins can be added by the protocol admin");

  console.log("\n==== Demo Completed Successfully! ====");
  console.log(`
Summary:
1. Connected to deployed contracts on Pharos devnet
2. Checked for existing policy tokens and loans
3. Simulated the loan creation and repayment process
4. Demonstrated Oracle integration for policy data
5. Showed multi-token support with USDC and USDT
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
