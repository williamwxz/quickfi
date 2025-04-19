'use client';

import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Wallet } from 'lucide-react';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

interface WalletAuthCheckProps {
  children: React.ReactNode;
}

export function WalletAuthCheck({ children }: WalletAuthCheckProps) {
  const { isConnected } = useAccount();

  // No redirection needed, we just show the connect wallet UI when not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Wallet Connection Required</h1>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to access this page. Your wallet is used to verify your identity and interact with the blockchain.
          </p>
          <div className="w-full flex justify-center">
            <ConnectWalletButton 
              label="Connect Wallet"
              size="default"
            />
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
