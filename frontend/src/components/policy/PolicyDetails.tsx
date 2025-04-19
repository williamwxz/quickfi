'use client';

// No state management needed in this component
import { usePolicyTokenDetails, useTokenURI, useTokenOwner } from '@/hooks/useContractHooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatUnits } from 'viem';
import { useRouter } from 'next/navigation';

// Using a simple div as skeleton for now
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
);

interface PolicyDetailsProps {
  tokenId: string;
}

export default function PolicyDetails({ tokenId }: PolicyDetailsProps) {
  const router = useRouter();

  // Use wagmi hooks to read contract data
  const {
    data: policyDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails
  } = usePolicyTokenDetails(tokenId);

  const {
    data: tokenURI,
    isLoading: isLoadingURI,
    isError: isErrorURI
  } = useTokenURI(tokenId);

  const {
    data: owner,
    isLoading: isLoadingOwner,
    isError: isErrorOwner
  } = useTokenOwner(tokenId);

  // Function to handle "Use as Collateral" button click
  const handleUseAsCollateral = () => {
    router.push(`/app/loan?policyId=${tokenId}`);
  };

  // Format the policy value (assuming 6 decimals for USDC)
  const formattedValue = policyDetails
    ? formatUnits(BigInt(0), 6) // Use a placeholder value for now
    : '0';

  // Format the expiry date
  const expiryDate = policyDetails
    ? new Date().toLocaleDateString() // Use current date as placeholder
    : 'Unknown';

  // Check if any data is loading
  const isLoading = isLoadingDetails || isLoadingURI || isLoadingOwner;

  // Check if any errors occurred
  const isError = isErrorDetails || isErrorURI || isErrorOwner;

  if (isError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Policy</CardTitle>
          <CardDescription>
            There was an error loading the policy details. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isLoading ? <Skeleton className="h-8 w-3/4" /> : `Policy Token #${tokenId}`}
        </CardTitle>
        <CardDescription>
          {isLoading ? <Skeleton className="h-4 w-1/2" /> : 'Insurance Policy Details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium">Owner:</div>
          <div className="text-sm truncate">
            {isLoadingOwner ? <Skeleton className="h-4 w-full" /> : owner ? String(owner) : 'Unknown'}
          </div>

          <div className="text-sm font-medium">Value:</div>
          <div className="text-sm">
            {isLoadingDetails ? <Skeleton className="h-4 w-1/2" /> : `${formattedValue} USDC`}
          </div>

          <div className="text-sm font-medium">Expiry Date:</div>
          <div className="text-sm">
            {isLoadingDetails ? <Skeleton className="h-4 w-1/2" /> : expiryDate}
          </div>

          <div className="text-sm font-medium">Token URI:</div>
          <div className="text-sm truncate">
            {isLoadingURI ? <Skeleton className="h-4 w-full" /> : tokenURI ? String(tokenURI) : 'No URI available'}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" disabled={isLoading}>View on Explorer</Button>
        <Button
          disabled={isLoading}
          onClick={handleUseAsCollateral}
        >
          Use as Collateral
        </Button>
      </CardFooter>
    </Card>
  );
}
