# QuickFi Demo Scripts for Pharos Hackathon

This directory contains demo scripts for the QuickFi protocol, designed for the Pharos Hackathon.

## Available Scripts

### 1. Simple Demo (`demo_simple.js`)

This script demonstrates the core functionality of the QuickFi protocol using simplified mock components. It simulates:

- Creating tokenized insurance policies with Oracle integration
- Loan origination and funding
- Loan repayment
- Loan default and liquidation
- Oracle updates for policy valuation and expiry date

**To run:**

```bash
npx hardhat run scripts/demo_simple.js --network localhost
```

### 2. Comprehensive Demo (`demo_comprehensive.js`)

This script demonstrates the full contract interactions of the QuickFi protocol using mock components. It includes proper error handling, Oracle integration for policy valuation and expiry date, and workarounds for complex contract dependencies.

**To run:**

```bash
npx hardhat run scripts/demo_comprehensive.js --network localhost
```

### 3. Oracle Synchronization Demo (`demo_oracle_sync.js`)

This script specifically demonstrates how the QuickFi protocol synchronizes with insurance companies via Oracle when policy defaults occur. It shows:

- Bidirectional communication between the protocol and insurance companies
- Notification of policy defaults to insurance companies
- Synchronization of policy status changes
- How the protocol stays in sync with insurance company systems

**To run:**

```bash
npx hardhat run scripts/demo_oracle_sync.js --network localhost
```

## Workflow

The QuickFi protocol workflow demonstrated in these scripts includes:

1. **Tokenization**:
   - Insurance policies are tokenized as ERC721 tokens
   - Each token contains valuation data for LTV calculations
   - Policy valuation and expiry date are obtained via Oracle

2. **Loan Request**:
   - Borrowers use their tokenized policy as collateral
   - Risk engine evaluates the application based on policy value
   - If approved, a loan is created

3. **Loan Funding**:
   - Lenders provide USDC to fund the loan
   - Funds are transferred to the borrower
   - Collateral is locked in the protocol

4. **Loan Repayment**:
   - Borrower repays principal plus interest
   - Collateral is returned to the borrower

5. **Loan Default**:
   - If a loan is not repaid by the due date, it can be liquidated
   - The collateral is transferred to the lender or auctioned

## Mock Components

The demo uses several mock components to simulate external services:

1. **MockMorphoAdapter**: Simulates interactions with Morpho Blue protocol
2. **MockTokenizedPolicy**: Simplified tokenized insurance policy implementation
3. **MockUSDC**: ERC20 token that simulates USDC for liquidity
4. **MockRiskEngine**: Simulates risk assessment without external dependencies
5. **MockPolicyOracle**: Simulates Chainlink Oracle for policy valuation and expiry date

## Oracle Integration

The protocol now includes Oracle integration for policy valuation, expiry date, and policy status synchronization:

1. **Policy Valuation**:
   - In a production environment, the policy valuation would be obtained from a Chainlink Oracle
   - The Oracle would fetch data from insurance providers' APIs
   - This ensures that loan amounts are based on current, accurate policy valuations

2. **Expiry Date**:
   - Policy expiry dates are also obtained from the Oracle
   - This prevents loans from being issued against expired policies
   - The protocol can automatically adjust loan terms based on policy expiration

3. **Dynamic Loan Parameters**:
   - As policy valuations change, loan parameters (max LTV, interest rates) can be adjusted
   - This provides real-time risk assessment based on current policy values

4. **Policy Status Synchronization**:
   - When a loan defaults and is liquidated, the insurance company is notified via the Oracle
   - The insurance company can update the policy status in their systems
   - The updated status is synchronized back to the blockchain via the Oracle
   - This ensures that the tokenized policy accurately reflects its real-world status

## Notes

- These scripts are for demonstration purposes only
- In a production environment, you would integrate with actual Chainlink Oracles
- The simple demo is more reliable, while the comprehensive demo shows more realistic contract interactions
