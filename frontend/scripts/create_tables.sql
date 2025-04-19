-- QuickFi Database Setup Script
-- This script creates the necessary tables for the QuickFi application

-- Create contract_addresses table
CREATE TABLE IF NOT EXISTS contract_addresses (
  id SERIAL PRIMARY KEY,
  contract_name VARCHAR(255) NOT NULL,
  address VARCHAR(42) NOT NULL,
  network VARCHAR(50) NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_addresses_network ON contract_addresses(network);
CREATE INDEX IF NOT EXISTS idx_contract_addresses_is_current ON contract_addresses(is_current);

-- Add sample data for localhost network
INSERT INTO contract_addresses (contract_name, address, network, is_current)
VALUES 
  ('InsurancePolicyToken', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', 'localhost', TRUE),
  ('RiskEngine', '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', 'localhost', TRUE),
  ('LoanOrigination', '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 'localhost', TRUE),
  ('MorphoAdapter', '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', 'localhost', TRUE),
  ('Stablecoin', '0x5FbDB2315678afecb367f032d93F642f64180aa3', 'localhost', TRUE);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL UNIQUE,
  owner_address VARCHAR(42) NOT NULL,
  policy_number VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  policy_type VARCHAR(100) NOT NULL,
  face_value NUMERIC(20, 6) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  tokenized_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  document_hash VARCHAR(255),
  -- Define policy status with more appropriate options
  status VARCHAR(50) CHECK (status IN ('pending', 'active', 'used_as_collateral', 'expired', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_owner_address ON policies(owner_address);
CREATE INDEX IF NOT EXISTS idx_policies_token_id ON policies(token_id);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  loan_id VARCHAR(255) NOT NULL UNIQUE,
  borrower_address VARCHAR(42) NOT NULL,
  collateral_token_id VARCHAR(255) NOT NULL REFERENCES policies(token_id),
  loan_amount NUMERIC(20, 6) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  term_days INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Define loan status with appropriate options
  status VARCHAR(50) CHECK (status IN ('pending', 'active', 'repaid', 'defaulted', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_borrower_address ON loans(borrower_address);
CREATE INDEX IF NOT EXISTS idx_loans_collateral_token_id ON loans(collateral_token_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- Add some sample data for policies
INSERT INTO policies (token_id, owner_address, policy_number, issuer, policy_type, face_value, expiry_date, document_hash, status)
VALUES
  ('1', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 'POL-123456', 'MetLife', 'Life', 100000, '2026-05-20 00:00:00+00', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'active'),
  ('2', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 'POL-789012', 'Prudential', 'Health', 50000, '2025-12-10 00:00:00+00', '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'used_as_collateral'),
  ('3', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 'POL-345678', 'New York Life', 'Property', 75000, '2027-03-15 00:00:00+00', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 'active');

-- Add a sample loan
INSERT INTO loans (loan_id, borrower_address, collateral_token_id, loan_amount, interest_rate, term_days, start_date, end_date, status)
VALUES
  ('LOAN-001', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', '2', 25000, 7.5, 90, '2025-02-15 00:00:00+00', '2025-05-15 00:00:00+00', 'active');



-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL UNIQUE,
  owner_address VARCHAR(42) NOT NULL,
  policy_number VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  policy_type VARCHAR(100) NOT NULL,
  face_value NUMERIC(20, 6) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  tokenized_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  document_hash VARCHAR(255),
  -- Define policy status with more appropriate options
  status VARCHAR(50) CHECK (status IN ('pending', 'active', 'used_as_collateral', 'expired', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_owner_address ON policies(owner_address);
CREATE INDEX IF NOT EXISTS idx_policies_token_id ON policies(token_id);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  loan_id VARCHAR(255) NOT NULL UNIQUE,
  borrower_address VARCHAR(42) NOT NULL,
  collateral_token_id VARCHAR(255) NOT NULL REFERENCES policies(token_id),
  loan_amount NUMERIC(20, 6) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  term_days INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Define loan status with appropriate options
  status VARCHAR(50) CHECK (status IN ('pending', 'active', 'repaid', 'defaulted', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_borrower_address ON loans(borrower_address);
CREATE INDEX IF NOT EXISTS idx_loans_collateral_token_id ON loans(collateral_token_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- Add some sample data for policies
INSERT INTO policies (token_id, owner_address, policy_number, issuer, policy_type, face_value, expiry_date, document_hash, status)
VALUES
  ('1', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 'POL-123456', 'MetLife', 'Life', 100000, '2026-05-20 00:00:00+00', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'active'),
  ('2', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 'POL-789012', 'Prudential', 'Health', 50000, '2025-12-10 00:00:00+00', '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'used_as_collateral'),
  ('3', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', 'POL-345678', 'New York Life', 'Property', 75000, '2027-03-15 00:00:00+00', '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 'active');

-- Add a sample loan
INSERT INTO loans (loan_id, borrower_address, collateral_token_id, loan_amount, interest_rate, term_days, start_date, end_date, status)
VALUES
  ('LOAN-001', '0x1ED73f28Ac77daBaC2526985062393571A1E73fB', '2', 25000, 7.5, 90, '2025-02-15 00:00:00+00', '2025-05-15 00:00:00+00', 'active');