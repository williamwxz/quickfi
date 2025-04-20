'use client';

import { useParams, useRouter } from 'next/navigation';
import PolicyDetails from '@/components/policy/PolicyDetails';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
// We don't need useTokenOwner anymore
import { getExplorerUrl } from '@/utils/explorer';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function PolicyPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.tokenId as string;

  // We don't need to get the owner here since we're using the contract address from env

  // Function to handle "Use as Collateral" button click
  const handleUseAsCollateral = () => {
    router.push(`/app/loan?tokenId=${tokenId}`);
  };

  // Function to view token on explorer
  const handleViewOnExplorer = () => {
    // Use the contract address from the environment variable
    const contractAddress = process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS;
    if (contractAddress) {
      const url = `${getExplorerUrl(contractAddress, 50002, true)}/token/${tokenId}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/app/dashboard">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Policy Details</h1>

      <PolicyDetails
        tokenId={Number(tokenId)}
      />

      <div className="mt-8 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={handleViewOnExplorer}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View on Explorer
        </Button>
        <Button
          onClick={handleUseAsCollateral}
          className="bg-[#1D4ED8] hover:bg-blue-700 text-white"
        >
          Use as Collateral
        </Button>
      </div>
    </div>
  );
}
