/**
 * Loan parameters configuration
 * These values should match the values in the smart contracts
 */

// Loan-to-Value (LTV) parameters
export const LTV_PARAMS = {
  // Maximum LTV ratio (80%)
  MAX_LTV: 80,
  
  // Default LTV ratio (50%)
  DEFAULT_LTV: 50,
  
  // Liquidation threshold (90%)
  LIQUIDATION_THRESHOLD: 90,
  
  // Warning threshold (75%)
  WARNING_THRESHOLD: 75
};

// Interest rate parameters
export const INTEREST_PARAMS = {
  // Base annual interest rate (5%)
  BASE_INTEREST_RATE: 5,
  
  // Minimum interest rate (3%)
  MIN_INTEREST_RATE: 3,
  
  // Maximum interest rate (15%)
  MAX_INTEREST_RATE: 15
};

// Loan duration parameters
export const DURATION_PARAMS = {
  // Minimum loan duration in days
  MIN_DURATION_DAYS: 30,
  
  // Maximum loan duration in days
  MAX_DURATION_DAYS: 365,
  
  // Default loan duration in months
  DEFAULT_DURATION_MONTHS: 12
};

// Supported stablecoins
export const SUPPORTED_STABLECOINS = ['USDC', 'USDT'];

// Default stablecoin
export const DEFAULT_STABLECOIN = 'USDC';
