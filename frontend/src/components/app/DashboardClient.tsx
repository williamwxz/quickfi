'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardClient() {
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
          <p className="text-gray-600 mb-4">You need to connect your wallet to view your dashboard.</p>
          <Button>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm mb-2 overflow-hidden text-ellipsis">
              {address}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div>
                <div className="text-sm text-gray-500">Policies</div>
                <div className="text-xl font-medium">{policies.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Loans</div>
                <div className="text-xl font-medium">{loans.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tokenize Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Convert your insurance policy into a digital asset on the blockchain.
            </p>
            <Button className="w-full" asChild>
              <Link href="/app/tokenize">Tokenize a Policy</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Get a Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Use your tokenized policy as collateral for a USDC loan.
            </p>
            <Button className="w-full" asChild>
              <Link href="/app/loan">Apply for a Loan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>My Policies</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : policies.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-gray-500 mb-4">You don&apos;t have any tokenized policies yet.</p>
                <Button variant="outline" asChild>
                  <Link href="/app/tokenize">Tokenize a Policy</Link>
                </Button>
              </div>
            ) : (
              <div>
                {/* Policy list would go here */}
                <div className="py-10 text-center">
                  <p className="text-gray-500 mb-4">No policies found.</p>
                  <Button variant="outline" asChild>
                    <Link href="/app/tokenize">Tokenize a Policy</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>My Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : loans.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-gray-500 mb-4">You don&apos;t have any active loans.</p>
                <Button variant="outline" asChild>
                  <Link href="/app/loan">Apply for a Loan</Link>
                </Button>
              </div>
            ) : (
              <div>
                {/* Loan list would go here */}
                <div className="py-10 text-center">
                  <p className="text-gray-500 mb-4">No loans found.</p>
                  <Button variant="outline" asChild>
                    <Link href="/app/loan">Apply for a Loan</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 