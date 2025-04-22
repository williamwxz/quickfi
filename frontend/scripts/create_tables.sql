-- QuickFi Database Setup Script
-- This script creates the necessary tables for the QuickFi application

-- Create contract_addresses table
CREATE TABLE IF NOT EXISTS contract_addresses (
  id SERIAL PRIMARY KEY,
  contract_name VARCHAR(255) NOT NULL,
  address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chain_id, contract_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_addresses_chain_id ON contract_addresses(chain_id);
CREATE INDEX IF NOT EXISTS idx_contract_addresses_is_current ON contract_addresses(is_current);

-- Create policies table with chain_id
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  address VARCHAR(42) NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  token_id INTEGER NOT NULL, -- Added token_id field
  policy_number VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  policy_type VARCHAR(100) NOT NULL,
  face_value NUMERIC(20, 6) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  tokenized_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  document_hash VARCHAR(255),
  jurisdiction VARCHAR(255), -- Added jurisdiction field
  tx_hash VARCHAR(66), -- Transaction hash for the minting transaction
  status VARCHAR(50) CHECK (status IN ('pending', 'active', 'used_as_collateral', 'expired', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chain_id, address),
  UNIQUE(chain_id, token_id)
);

CREATE INDEX IF NOT EXISTS idx_policies_owner_address ON policies(owner_address);
CREATE INDEX IF NOT EXISTS idx_policies_chain_address ON policies(chain_id, address);
CREATE INDEX IF NOT EXISTS idx_policies_token_id ON policies(token_id);

-- Create loans table with chain_id
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  address VARCHAR(42) NOT NULL, -- On-chain loan address
  loan_id INTEGER NOT NULL, -- Added loan_id field
  borrower_address VARCHAR(42) NOT NULL,
  collateral_address VARCHAR(42) NOT NULL, -- Policy token address used as collateral
  collateral_token_id INTEGER, -- Added collateral_token_id field for reference
  loan_amount NUMERIC(20, 6) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  term_days INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pending', 'active', 'repaid', 'defaulted', 'cancelled')) DEFAULT 'pending',
  stablecoin VARCHAR(10) NOT NULL DEFAULT 'USDC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chain_id, address),
  UNIQUE(chain_id, loan_id),
  FOREIGN KEY (chain_id, collateral_address) REFERENCES policies(chain_id, address),
  FOREIGN KEY (chain_id, collateral_token_id) REFERENCES policies(chain_id, token_id)
);

CREATE INDEX IF NOT EXISTS idx_loans_borrower_address ON loans(borrower_address);
CREATE INDEX IF NOT EXISTS idx_loans_chain_collateral ON loans(chain_id, collateral_address);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_loan_id ON loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_loans_collateral_token_id ON loans(collateral_token_id);

-- Add sample contract addresses for localhost network
INSERT INTO contract_addresses (contract_name, address, chain_id, is_current)
VALUES
  ('TokenizedPolicy', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', 1337, TRUE),
  ('RiskEngine', '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', 1337, TRUE),
  ('LoanOrigination', '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 1337, TRUE),
  ('MorphoAdapter', '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', 1337, TRUE),
  ('Stablecoin', '0x5FbDB2315678afecb367f032d93F642f64180aa3', 1337, TRUE);

-- Add sample data for policies (using chain_id 1337 for localhost)
-- INSERT INTO policies (chain_id, address, owner_address, token_id, policy_number, issuer, policy_type, face_value, expiry_date, document_hash, status)
-- VALUES
--   (1337, '0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 1, 'POL-123456', 'MetLife', 'Life', 100000, '2026-05-20 00:00:00+00', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'active'),
--   (1337, '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 2, 'POL-789012', 'Prudential', 'Health', 50000, '2025-12-10 00:00:00+00', '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'used_as_collateral'),
--   (1337, '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 3, 'POL-345678', 'New York Life', 'Property', 75000, '2027-03-15 00:00:00+00', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 'active');

-- -- Add sample loan (using chain_id 1337 for localhost)
-- INSERT INTO loans (chain_id, address, loan_id, borrower_address, collateral_address, collateral_token_id, loan_amount, interest_rate, term_days, start_date, end_date, status)
-- VALUES
--   (1337, '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 1, '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', 2, 25000, 7.5, 90, '2025-02-15 00:00:00+00', '2025-05-15 00:00:00+00', 'active');
