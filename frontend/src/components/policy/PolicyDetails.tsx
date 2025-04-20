'use client';

// Component for displaying policy details only
import { usePolicyTokenDetails, useTokenURI, useTokenOwner } from '@/hooks/useContractHooks';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatUnits } from 'viem';
import { formatAddress } from '@/utils/explorer';

// Create two skeleton components - one for divs and one for spans
const DivSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
);

const SpanSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={`animate-pulse bg-gray-200 rounded inline-block ${className}`} {...props} />
);

interface PolicyData {
  address: string;
  chain_id: number;
  owner_address: string;
  face_value: number;
  expiry_date: string;
  policy_number: string;
  issuer: string;
  policy_type: string;
  status: string;
}

interface PolicyDetailsProps {
  policyAddress: string;
  chainId?: string | null;
}

export default function PolicyDetails({ policyAddress, chainId }: PolicyDetailsProps) {
  // State for Supabase data
  const [policyData, setPolicyData] = useState<PolicyData | null>(null);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [isErrorSupabase, setIsErrorSupabase] = useState<boolean>(false);

  // Fetch policy data from Supabase if chainId is provided
  useEffect(() => {
    async function fetchPolicyData() {
      if (!policyAddress) return;

      setIsLoadingSupabase(true);
      try {
        let query = supabase
          .from('policies')
          .select('*')
          .eq('address', policyAddress);

        // Add chain_id filter if provided
        if (chainId) {
          query = query.eq('chain_id', chainId);
        }

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching policy from Supabase:', error);
          setIsErrorSupabase(true);
        } else if (data) {
          setPolicyData(data);
        }
      } catch (error) {
        console.error('Error fetching policy data:', error);
        setIsErrorSupabase(true);
      } finally {
        setIsLoadingSupabase(false);
      }
    }

    fetchPolicyData();
  }, [policyAddress, chainId]);

  // Use wagmi hooks as fallback for blockchain data
  const {
    data: policyDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails
  } = usePolicyTokenDetails(policyAddress);

  const {
    data: tokenURI,
    isLoading: isLoadingURI,
    isError: isErrorURI
  } = useTokenURI(policyAddress);

  const {
    data: owner,
    isLoading: isLoadingOwner,
    isError: isErrorOwner
  } = useTokenOwner(policyAddress);

  // Format the policy value (using Supabase data if available)
  const formattedValue = policyData
    ? policyData.face_value.toLocaleString()
    : policyDetails
      ? formatUnits(BigInt(0), 6) // Use a placeholder value for now
      : '0';

  // Format the expiry date (using Supabase data if available)
  const expiryDate = policyData
    ? new Date(policyData.expiry_date).toLocaleDateString()
    : policyDetails
      ? new Date().toLocaleDateString() // Use current date as placeholder
      : 'Unknown';

  // Check if any data is loading
  const isLoading = (isLoadingSupabase && !policyData) ||
    (isLoadingDetails || isLoadingURI || isLoadingOwner);

  // Check if any errors occurred
  const isError = isErrorSupabase &&
    (isErrorDetails || isErrorURI || isErrorOwner);

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
          {isLoading ? <DivSkeleton className="h-8 w-3/4" /> : `Policy ${formatAddress(policyAddress)}`}
        </CardTitle>
        <CardDescription>
          {isLoading ? <SpanSkeleton className="h-4 w-1/2" /> :
            policyData ? `${policyData.issuer} - ${policyData.policy_type}` : 'Insurance Policy Details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium">Owner:</div>
          <div className="text-sm truncate">
            {isLoading ? <DivSkeleton className="h-4 w-full" /> :
              policyData ? formatAddress(policyData.owner_address) :
              owner ? formatAddress(String(owner)) : 'Unknown'}
          </div>

          <div className="text-sm font-medium">Value:</div>
          <div className="text-sm">
            {isLoading ? <DivSkeleton className="h-4 w-1/2" /> : `$${formattedValue} USDC`}
          </div>

          <div className="text-sm font-medium">Expiry Date:</div>
          <div className="text-sm">
            {isLoading ? <DivSkeleton className="h-4 w-1/2" /> : expiryDate}
          </div>

          {policyData && (
            <>
              <div className="text-sm font-medium">Policy Number:</div>
              <div className="text-sm">
                {policyData.policy_number}
              </div>
            </>
          )}

          {!policyData && (
            <>
              <div className="text-sm font-medium">Token URI:</div>
              <div className="text-sm truncate">
                {isLoadingURI ? <DivSkeleton className="h-4 w-full" /> : tokenURI ? String(tokenURI) : 'No URI available'}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
