'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Card from '@/components/ui/Card';

export default function AppHome() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      router.push('/app/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to QuickFi App</h1>
        
        <div className="mb-8">
          <Card className="p-8 mb-6">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-neutral-content">
                Please connect your wallet using the button in the header to access QuickFi&apos;s features.
                You&apos;ll be able to tokenize insurance policies and apply for loans once connected.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Tokenize Insurance Policies</h3>
                <p className="text-sm text-neutral-content">
                  Convert your insurance policies into NFTs on the Pharos Network blockchain.
                </p>
              </div>
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Get USDC Loans</h3>
                <p className="text-sm text-neutral-content">
                  Use your tokenized policies as collateral for fast, secure USDC loans.
                </p>
              </div>
            </div>
          </Card>

          {!isConnected && (
            <div className="text-neutral-content text-sm">
              <p>
                First time here? Check out our{' '}
                <a href="/help" className="text-primary hover:underline">
                  FAQ page
                </a>{' '}
                to learn more about how QuickFi works.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 