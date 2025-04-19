// Define token type
type TokenConfig = {
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
  logoUrl: string;
};

// Define token information for the application
export const tokens: Record<string, TokenConfig> = {
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon: '/tokens/usd-coin-usdc-logo.svg',
    logoUrl: '/tokens/usd-coin-usdc-logo.svg',
  },
  USDT: {
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    icon: '/tokens/tether-usdt-logo.svg',
    logoUrl: '/tokens/tether-usdt-logo.svg',
  },
  ETH: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    icon: '/tokens/ethereum-eth-logo.svg',
    logoUrl: '/tokens/ethereum-eth-logo.svg',
  },
  PTT: {
    name: 'Pharos Test Token',
    symbol: 'PTT',
    decimals: 18,
    icon: '/tokens/ptt.svg',
    logoUrl: '/tokens/ptt.svg',
  },
};

// Function to get token configurations synchronously
export function getTokenConfigsSync(): Record<string, TokenConfig> {
  return tokens;
}

// Function to get token configuration with fallback
export function getTokenConfig(symbol: string): TokenConfig {
  // Return the token config if it exists, otherwise return a default config
  return tokens[symbol] || {
    name: symbol,
    symbol: symbol,
    decimals: 6,
    icon: '/tokens/ethereum-eth-logo.svg',
    logoUrl: '/tokens/ethereum-eth-logo.svg',
  };
}

export default tokens;
