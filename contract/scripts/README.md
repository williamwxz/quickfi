# QuickFi Demo Scripts for Pharos Hackathon

This directory contains demo scripts for the QuickFi protocol, designed for the Pharos Hackathon.

## Available Scripts

### 1. Simple Demo (`demo_simple.js`)

This script demonstrates the core functionality of the QuickFi protocol using simplified mock components. It simulates:

- Creating tokenized insurance policies with Oracle integration
- Multi-token support with USDC and USDT
- Loan origination and funding
- Loan repayment with interest calculation
- Loan default and liquidation
- Oracle updates for policy valuation and expiry date

**What happens in the script:**

1. Deploys mock contracts (TokenRegistry, MockUSDC, MockUSDT, MockTokenizedPolicy, MockPolicyOracle)
2. Distributes stablecoins to participants
3. Creates tokenized insurance policies with Oracle integration
4. Simulates a USDC loan process (funding and repayment)
5. Simulates a USDT loan process (funding and repayment)
6. Simulates a loan default scenario with collateral liquidation
7. Demonstrates Oracle updates for policy valuation

**To run:**

```bash
npx hardhat run scripts/demo_simple.js --network localhost
```

### 2. Comprehensive Demo (`demo_comprehensive.js`)

This script demonstrates the full contract interactions of the QuickFi protocol using mock components. It includes proper error handling, Oracle integration for policy valuation and expiry date, and workarounds for complex contract dependencies.

**What happens in the script:**

1. Deploys all mock contracts including:
   - TokenRegistry for multi-token support
   - MockUSDC and MockUSDT for stablecoin functionality
   - MockTokenizedPolicy for insurance policy tokenization
   - MockPolicyOracle for Oracle integration
   - MockRiskEngine and MockRiskController for risk assessment
   - LoanOrigination for loan management
   - MockMorphoAdapter for liquidity protocol integration
2. Sets up proper contract relationships and permissions
3. Distributes stablecoins to all participants
4. Creates tokenized insurance policies with Oracle integration
5. Creates, funds, and repays a USDC loan successfully
6. Creates a second loan with USDT that defaults
7. Demonstrates the liquidation process
8. Shows bidirectional communication with insurance companies
9. Demonstrates how Oracle updates affect loan parameters

**To run:**

```bash
npx hardhat run scripts/demo_comprehensive.js --network localhost
```

## Workflow

The QuickFi protocol workflow demonstrated in these scripts includes:

1. **Tokenization**:
   - Insurance policies are tokenized as ERC721 tokens
   - Each token contains valuation data for LTV calculations
   - Policy valuation and expiry date are obtained via Oracle
   - Policies maintain a link to the real-world insurance policy

2. **Loan Request**:
   - Borrowers use their tokenized policy as collateral
   - Risk engine evaluates the application based on policy value
   - Borrowers can select their preferred stablecoin (USDC, USDT, etc.)
   - If approved, a loan is created with the selected stablecoin

3. **Loan Funding**:
   - Lenders provide stablecoins to fund the loan
   - Funds are transferred to the borrower
   - Collateral is locked in the protocol
   - The loan is recorded with its specific stablecoin type

4. **Loan Repayment**:
   - Borrower repays principal plus interest in the same stablecoin
   - Interest is calculated based on the loan duration and rate
   - Collateral is returned to the borrower upon full repayment

5. **Loan Default**:
   - If a loan is not repaid by the due date, it can be liquidated
   - The collateral is transferred to the lender
   - Insurance company is notified about the policy default via Oracle
   - Policy status is updated in both blockchain and insurance systems

## Mock Components

The demo uses several mock components to simulate external services:

1. **TokenRegistry**: Manages supported stablecoins and their parameters
2. **MockUSDC/MockUSDT**: ERC20 tokens that simulate stablecoins for liquidity
3. **MockTokenizedPolicy**: Simplified tokenized insurance policy implementation with Oracle integration
4. **MockPolicyOracle**: Simulates Chainlink Oracle for policy valuation, expiry date, and status updates
5. **MockRiskEngine/MockRiskController**: Simulates risk assessment for loan approval
6. **MockMorphoAdapter**: Simulates interactions with Morpho Blue protocol for liquidity
7. **LoanOrigination**: Manages the loan lifecycle including multi-token support

## Multi-Token Support

The protocol now includes support for multiple stablecoins:

1. **Token Registry**:
   - Centralized registry for supported stablecoins
   - Stores token addresses, decimals, and loan parameters
   - Allows easy addition of new stablecoins

2. **Loan Denomination**:
   - Each loan is denominated in a specific stablecoin
   - Borrowers can choose their preferred stablecoin
   - Repayment must be in the same stablecoin as the loan

3. **Flexible Parameters**:
   - Different stablecoins can have different loan parameters
   - Min/max loan amounts can be configured per token
   - Interest rates can vary based on the stablecoin used

## Oracle Integration

The protocol includes comprehensive Oracle integration:

1. **Policy Valuation**:
   - Policy valuation is obtained from the Oracle in real-time
   - The Oracle fetches data from insurance providers' APIs
   - Loan amounts are based on current, accurate policy valuations
   - Valuation updates can trigger loan parameter adjustments

2. **Expiry Date**:
   - Policy expiry dates are obtained from the Oracle
   - Prevents loans from being issued against expired policies
   - Loan terms are adjusted based on policy expiration dates

3. **Bidirectional Communication**:
   - When a loan defaults, the insurance company is notified via the Oracle
   - The insurance company updates the policy status in their systems
   - The updated status is synchronized back to the blockchain
   - This ensures the tokenized policy accurately reflects its real-world status

4. **Dynamic Updates**:
   - As policy valuations change, loan parameters are automatically adjusted
   - This provides real-time risk assessment based on current policy values
   - Demonstrated in both demo scripts with policy valuation updates

## Testing the Demos

To test the demos, follow these steps:

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. In a new terminal, run one of the demo scripts:
   ```bash
   npx hardhat run scripts/demo_simple.js --network localhost
   # or
   npx hardhat run scripts/demo_comprehensive.js --network localhost
   ```

3. Watch the output to see the full loan lifecycle in action

## Notes

- These scripts are for demonstration purposes only
- In a production environment, you would integrate with actual Chainlink Oracles
- The simple demo is more reliable for quick testing, while the comprehensive demo shows more realistic contract interactions
- The comprehensive demo includes Oracle synchronization for bidirectional communication with insurance companies
