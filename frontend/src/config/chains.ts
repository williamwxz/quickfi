import { Chain } from 'viem';

// Define local hardhat network
export const hardhatLocal = {
  id: 1337,
  name: 'Hardhat Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: '#' },
  },
} as const satisfies Chain;

export const pharosDevnet = {
  id: 50002,
  name: 'Pharos Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Pharos Test Token',
    symbol: 'PTT',
  },
  rpcUrls: {
    public: { http: ['https://devnet.dplabs-internal.com'] },
    default: { http: ['https://devnet.dplabs-internal.com'] },
  },
  blockExplorers: {
    default: { name: 'Pharos Explorer', url: 'https://pharosscan.xyz/' },
  },
} as const satisfies Chain;
