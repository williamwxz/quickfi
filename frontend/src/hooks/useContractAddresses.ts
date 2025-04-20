'use client';

import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { getContractAddresses } from '@/lib/supabaseClient';

export function useContractAddresses(chainId?: number) {
  const currentChainId = useChainId();
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAddresses() {
      try {
        setIsLoading(true);
        // Use provided chainId or fallback to current chainId
        const contractAddresses = await getContractAddresses(chainId ?? currentChainId);
        setAddresses(contractAddresses);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch contract addresses'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAddresses();
  }, [chainId, currentChainId]);

  return { addresses, isLoading, error };
} 