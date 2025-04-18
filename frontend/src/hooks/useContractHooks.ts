'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { InsurancePolicyTokenABI } from '@/config/abi';

// Get contract address from environment variable
const contractAddress = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b"; // Fallback to example address

/**
 * Hook to read policy token details
 * @param tokenId The token ID to query
 * @returns Policy token details including loading and error states
 */
export function usePolicyTokenDetails(tokenId: string | undefined) {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InsurancePolicyTokenABI,
    functionName: 'getPolicyTokenDetails',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });
}

/**
 * Hook to read policy metadata
 * @param tokenId The token ID to query
 * @returns Policy metadata including loading and error states
 */
export function usePolicyMetadata(tokenId: string | undefined) {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InsurancePolicyTokenABI,
    functionName: 'getPolicyMetadata',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });
}

/**
 * Hook to read token URI
 * @param tokenId The token ID to query
 * @returns Token URI including loading and error states
 */
export function useTokenURI(tokenId: string | undefined) {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InsurancePolicyTokenABI,
    functionName: 'tokenURI',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });
}

/**
 * Hook to read token owner
 * @param tokenId The token ID to query
 * @returns Token owner address including loading and error states
 */
export function useTokenOwner(tokenId: string | undefined) {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InsurancePolicyTokenABI,
    functionName: 'ownerOf',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });
}

/**
 * Hook to mint a new policy token with Oracle
 * @returns Contract write function, data, and states
 */
export function useMintPolicyToken() {
  const { data, isPending, writeContract } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const mintPolicyToken = async (args: any[]) => {
    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'mintPolicy',
      args,
    });
  };

  return {
    mintPolicyToken,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
  };
}

/**
 * Hook to check if a user is approved for all tokens
 * @param owner The owner address
 * @param operator The operator address
 * @returns Approval status including loading and error states
 */
export function useIsApprovedForAll(owner: string | undefined, operator: string | undefined) {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InsurancePolicyTokenABI,
    functionName: 'isApprovedForAll',
    args: owner && operator ? [owner as `0x${string}`, operator as `0x${string}`] : undefined,
    query: {
      enabled: !!owner && !!operator,
    },
  });
}

/**
 * Hook to set approval for all tokens
 * @returns Contract write function, data, and states
 */
export function useSetApprovalForAll() {
  const { data, isPending, writeContract } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const setApprovalForAll = async (operator: string, approved: boolean) => {
    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'setApprovalForAll',
      args: [operator as `0x${string}`, approved],
    });
  };

  return {
    setApprovalForAll,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
  };
}
