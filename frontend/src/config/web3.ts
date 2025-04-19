import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'viem/chains';
import { QueryClient } from '@tanstack/react-query';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { hardhatLocal, pharosDevnet } from './chains';

export const queryClient = new QueryClient();

// Configure chains for the application
const projectId = '3ee9b9d39f0198b8128f5a1d2b5fe6c5'; // Using a sample project ID for development
const appName = 'QuickFi';

// Configure RainbowKit
export const { connectors } = getDefaultWallets({
  appName,
  projectId,
});



// Determine if we're in a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure Wagmi with conditional chains based on environment
export const config = createConfig({
  chains: isDevelopment
    ? [hardhatLocal, sepolia, mainnet, pharosDevnet]
    : [sepolia, mainnet, pharosDevnet],
  transports: {
    [hardhatLocal.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [pharosDevnet.id]: http(),
  },
});