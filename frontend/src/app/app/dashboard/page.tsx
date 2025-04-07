'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [policies, setPolicies] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      // In a real app, you would fetch policies and loans from an API
      setIsLoading(false);
      setPolicies([]);
      setLoans([]);
    };

    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
          <p className="mb-4">You need to connect your wallet to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Wallet</h2>
          <div className="text-sm mb-2 overflow-hidden text-ellipsis">
            {address}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div>
              <div className="text-sm text-neutral-content">Policies</div>
              <div className="text-xl font-medium">{policies.length}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-content">Loans</div>
              <div className="text-xl font-medium">{loans.length}</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Tokenize Policy</h2>
          <p className="text-sm text-neutral-content mb-4">
            Convert your insurance policy into a digital asset on the blockchain.
          </p>
          <Link href="/app/tokenize" className="btn btn-primary w-full">
            Tokenize a Policy
          </Link>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Get a Loan</h2>
          <p className="text-sm text-neutral-content mb-4">
            Use your tokenized policy as collateral for a USDC loan.
          </p>
          <Link href="/app/loan" className="btn btn-primary w-full">
            Apply for a Loan
          </Link>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Policies</h2>
          {isLoading ? (
            <div className="py-10 text-center">Loading policies...</div>
          ) : policies.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-4">You don&apos;t have any tokenized policies yet.</p>
              <Link href="/app/tokenize" className="btn btn-outline btn-sm">
                Tokenize a Policy
              </Link>
            </div>
          ) : (
            <div>
              {/* Policy list would go here */}
              <div className="py-10 text-center">
                <p className="mb-4">No policies found.</p>
                <Link href="/app/tokenize" className="btn btn-outline btn-sm">
                  Tokenize a Policy
                </Link>
              </div>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Loans</h2>
          {isLoading ? (
            <div className="py-10 text-center">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-4">You don&apos;t have any active loans.</p>
              <Link href="/app/loan" className="btn btn-outline btn-sm">
                Apply for a Loan
              </Link>
            </div>
          ) : (
            <div>
              {/* Loan list would go here */}
              <div className="py-10 text-center">
                <p className="mb-4">No loans found.</p>
                <Link href="/app/loan" className="btn btn-outline btn-sm">
                  Apply for a Loan
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 