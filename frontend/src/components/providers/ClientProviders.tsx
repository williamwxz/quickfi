'use client';

import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config, queryClient } from '@/config/web3';
import { QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="compact"
            theme={lightTheme({
              accentColor: '#1D4ED8', // Match the blue accent color used in the app
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small'
            })}
            coolMode
          >
            {children}
            <ToastContainer position="top-right" autoClose={5000} />
          </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}