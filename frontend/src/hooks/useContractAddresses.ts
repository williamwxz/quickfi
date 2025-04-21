'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { getContractAddresses } from '@/lib/supabaseClient';

export function useContractAddresses(chainId?: number) {
  const currentChainId = useChainId();
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use provided chainId or fallback to current chainId
      const chainIdToUse = chainId ?? currentChainId;
      console.log(`Fetching contract addresses for chain ID: ${chainIdToUse}, retry: ${retryCount}`);

      const contractAddresses = await getContractAddresses(chainIdToUse);
      console.log('Raw contract addresses:', contractAddresses);

      // Add USDC and USDT addresses from environment variables
      const enhancedAddresses = {
        ...contractAddresses,
        USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
        USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '',
      };

      console.log('Enhanced contract addresses:', enhancedAddresses);
      setAddresses(enhancedAddresses);

      // Check if we have the required addresses
      if (!enhancedAddresses.LoanOrigination && retryCount < 3) {
        console.log(`Missing LoanOrigination address, will retry (${retryCount + 1}/3)`);
        // Schedule a retry after a delay
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      }
    } catch (err) {
      console.error('Error fetching contract addresses:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch contract addresses'));

      // Retry on error
      if (retryCount < 3) {
        console.log(`Error fetching addresses, will retry (${retryCount + 1}/3)`);
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
    console.log('Manually refetching contract addresses...');
    setRetryCount(prev => prev + 1);
  }, []);

  return { addresses, isLoading, error, refetch };
}