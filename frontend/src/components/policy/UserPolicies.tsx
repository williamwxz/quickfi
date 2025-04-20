'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PolicyDetails from './PolicyDetails';

// Using a simple div as skeleton for now
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
);

export default function UserPolicies() {
  const { address, isConnected } = useAccount();
  const [policies, setPolicies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch policies owned by the user
  useEffect(() => {
    if (!address) return;

    const fetchPolicies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call our API endpoint to get policies owned by the user
        const response = await fetch(`/api/policy/owner/${address}`);

        if (!response.ok) {
          throw new Error('Failed to fetch policies');
        }

        const data = await response.json();

        if (data.success) {
          // Extract token IDs from the response
          const tokenIds = data.policies.map((policy: { tokenId: string }) => policy.tokenId);
          setPolicies(tokenIds);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching policies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch policies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [address]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Please connect your wallet to view your policies.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Policies</h2>
        <Button>Tokenize New Policy</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : policies.length > 0 ? (
        <div className="space-y-4">
          {policies.map((tokenId) => (
            <PolicyDetails key={tokenId} policyAddress={tokenId} />
          ))}
        </div>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Policies Found</CardTitle>
            <CardDescription>
              You don&apos;t have any tokenized insurance policies yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Tokenize Your First Policy</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
