'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { getContractAddresses } from '@/lib/supabaseClient';
import deployedAddresses from '@/config/deployed-addresses.json';
import { mainnet, sepolia } from 'viem/chains';
import { hardhatLocal, pharosDevnet } from '@/config/chains';

// Type for the deployed addresses structure
type DeployedAddresses = {
  [network: string]: Record<string, string>;
};

// Type for contract addresses
type ContractAddresses = {
  TokenizedPolicy?: string;
  RiskEngine?: string;
  LoanOrigination?: string;
  MorphoAdapter?: string;
  TokenRegistry?: string;
  USDC?: string;
  USDT?: string;
  [key: string]: string | undefined;
};

// Helper function to get network name from chain ID using the chain configurations
function getNetworkName(chainId: number): string {
  // Map chain IDs to network names used in deployed-addresses.json
  if (chainId === hardhatLocal.id) {
    return 'localhost';
  } else if (chainId === pharosDevnet.id) {
    return 'pharosDevnet';
  } else if (chainId === sepolia.id) {
    return 'sepolia';
  } else if (chainId === mainnet.id) {
    return 'mainnet';
  } else {
    // Log the chain ID and available chain IDs for debugging
    console.warn(`Unknown chain ID: ${chainId}, defaulting to localhost`);

    return 'localhost'; // Default to localhost
  }
}

// Helper function to get addresses from deployed-addresses.json
function getDeployedAddresses(chainId: number): ContractAddresses {
  try {
    // Validate that deployedAddresses is properly loaded
    if (!deployedAddresses || typeof deployedAddresses !== 'object') {
      console.error('deployed-addresses.json is not properly loaded:', deployedAddresses);
      return {};
    }

    const networkName = getNetworkName(chainId);
    const addresses = (deployedAddresses as DeployedAddresses)[networkName];

    if (!addresses) {
      console.warn(`No addresses found for network ${networkName} in deployed-addresses.json`);

      // If pharosDevnet is not found but we're looking for it, try localhost as fallback
      if (networkName === 'pharosDevnet' && (deployedAddresses as DeployedAddresses)['localhost']) {
        return (deployedAddresses as DeployedAddresses)['localhost'] as ContractAddresses;
      }

      return {};
    }

    return addresses as ContractAddresses;
  } catch (error) {
    console.error('Error getting deployed addresses:', error);
    return {};
  }
}

export function useContractAddresses(chainId?: number) {
  const currentChainId = useChainId();
  const [addresses, setAddresses] = useState<ContractAddresses>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use provided chainId or fallback to current chainId
      const chainIdToUse = chainId ?? currentChainId;

      // First get addresses from deployed-addresses.json
      const deployedContractAddresses = getDeployedAddresses(chainIdToUse);

      // Try to get addresses from Supabase as a secondary source
      try {
        const supabaseAddresses = await getContractAddresses(chainIdToUse);

        // If Supabase returned valid addresses, merge them with deployed addresses
        // But prioritize deployed-addresses.json for consistency
        if (supabaseAddresses && Object.keys(supabaseAddresses).length > 0) {
          // Merge addresses, but keep deployed-addresses.json as the primary source
          const mergedAddresses: ContractAddresses = {
            ...supabaseAddresses,  // Start with Supabase addresses
            ...deployedContractAddresses  // Override with deployed-addresses.json
          };

          setAddresses(mergedAddresses);
        } else {
          // If Supabase didn't return valid addresses, use deployed-addresses.json
          setAddresses(deployedContractAddresses);
        }
      } catch (supabaseError) {
        // If Supabase fetch fails, just use deployed-addresses.json
        console.error('Error fetching from Supabase:', supabaseError);
        setAddresses(deployedContractAddresses);
      }

      // Check if we have the required addresses
      if (!deployedContractAddresses.LoanOrigination && retryCount < 3) {
        // Schedule a retry after a delay
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      }
    } catch (err) {
      console.error('Error fetching contract addresses:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch contract addresses'));

      // Try to use deployed-addresses.json as fallback on error
      try {
        const chainIdToUse = chainId ?? currentChainId;
        const fallbackAddresses = getDeployedAddresses(chainIdToUse);
        setAddresses(fallbackAddresses);
      } catch (fallbackError) {
        console.error('Error getting fallback addresses:', fallbackError);
        // If even the fallback fails, set empty addresses
        setAddresses({});
      }

      // Retry on error
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [chainId, currentChainId, retryCount]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const refetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return { addresses, isLoading, error, refetch };
}