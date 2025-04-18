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



// Configure Wagmi
export const config = createConfig({
  chains: [hardhatLocal, sepolia, mainnet, pharosDevnet],
  transports: {
    [hardhatLocal.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    // add pharos devnet here
    [pharosDevnet.id]: http(),
  },
});