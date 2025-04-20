'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  TokenizedPolicyABI,
  LoanOriginationABI,
  MockUSDCABI,
  RiskEngineABI,
  TokenRegistryABI,
} from '@/config/abi';
import { useContractAddresses } from './useContractAddresses';

// Insurance Policy Token Hooks
export function usePolicyTokenDetails(policyAddress: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'getPolicyTokenDetails',
    args: policyAddress ? [policyAddress] : undefined,
    query: {
      enabled: !!policyAddress && !!addresses.TokenizedPolicy,
    },
  });
}

export function usePolicyMetadata(policyAddress: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'getPolicyMetadata',
    args: policyAddress ? [policyAddress] : undefined,
    query: {
      enabled: !!policyAddress && !!addresses.TokenizedPolicy,
    },
  });
}

export function useTokenURI(policyAddress: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'tokenURI',
    args: policyAddress ? [policyAddress] : undefined,
    query: {
      enabled: !!policyAddress && !!addresses.TokenizedPolicy,
    },
  });
}

export function useTokenOwner(policyAddress: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'ownerOf',
    args: policyAddress ? [policyAddress] : undefined,
    query: {
      enabled: !!policyAddress && !!addresses.TokenizedPolicy,
    },
  });
}

export function useMintPolicyToken(chainId?: number) {
  const { addresses } = useContractAddresses(chainId);
  const { writeContract, isPending, data: hash } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintPolicyToken = async (args: [`0x${string}`, string, `0x${string}`, bigint, bigint, `0x${string}`]) => {
    if (!addresses?.TokenizedPolicy) {
      throw new Error('TokenizedPolicy address not available');
    }

    try {
      return writeContract({
        address: addresses.TokenizedPolicy as `0x${string}`,
        abi: TokenizedPolicyABI,
        functionName: 'mintPolicy',
        args,
      });
    } catch (error) {
      console.error('Error minting policy token:', error);
      throw error;
    }
  };

  return {
    mintPolicyToken,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    hash,
    txData,
  };
}

export function useIsApprovedForAll(owner: string | undefined, operator: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'isApprovedForAll',
    args: owner && operator ? [owner as `0x${string}`, operator as `0x${string}`] : undefined,
    query: {
      enabled: !!owner && !!operator && !!addresses.TokenizedPolicy,
    },
  });
}

export function useSetApprovalForAll() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract, error } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const setApprovalForAll = async (operator: string, approved: boolean) => {
    if (!addresses.TokenizedPolicy) {
      throw new Error('TokenizedPolicy address not available');
    }
    return writeContract({
      address: addresses.TokenizedPolicy as `0x${string}`,
      abi: TokenizedPolicyABI,
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
    error,
  };
}

// Loan Origination Hooks
export function useCreateLoan() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract, error } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const createLoan = async (args: [`0x${string}`, `0x${string}`, bigint, bigint]) => {
    if (!addresses.LoanOrigination) {
      throw new Error('LoanOrigination address not available');
    }
    return writeContract({
      address: addresses.LoanOrigination as `0x${string}`,
      abi: LoanOriginationABI,
      functionName: 'createLoan',
      args,
    });
  };

  return {
    createLoan,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

export function useActivateLoan() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract, error } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const activateLoan = async (loanId: bigint) => {
    if (!addresses.LoanOrigination) {
      throw new Error('LoanOrigination address not available');
    }
    return writeContract({
      address: addresses.LoanOrigination as `0x${string}`,
      abi: LoanOriginationABI,
      functionName: 'activateLoan',
      args: [loanId],
    });
  };

  return {
    activateLoan,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

// Mock USDC Hooks
export function useUSDCBalance(account: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.Stablecoin as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!account && !!addresses.Stablecoin,
    },
  });
}

export function useUSDCAllowance(owner: string | undefined, spender: string | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.Stablecoin as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'allowance',
    args: owner && spender ? [owner as `0x${string}`, spender as `0x${string}`] : undefined,
    query: {
      enabled: !!owner && !!spender && !!addresses.Stablecoin,
    },
  });
}

export function useApproveUSDC() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract, error } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const approve = async (spender: string, amount: bigint) => {
    if (!addresses.Stablecoin) {
      throw new Error('Stablecoin address not available');
    }
    return writeContract({
      address: addresses.Stablecoin as `0x${string}`,
      abi: MockUSDCABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, amount],
    });
  };

  return {
    approve,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

// Risk Engine Hooks
export function useAssessRisk(
  borrower: string | undefined,
  collateralToken: string | undefined,
  collateralTokenId: bigint | undefined,
  requestedAmount: bigint | undefined,
  duration: bigint | undefined
) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.RiskEngine as `0x${string}`,
    abi: RiskEngineABI,
    functionName: 'assessRisk',
    args: borrower && collateralToken && collateralTokenId !== undefined && requestedAmount !== undefined && duration !== undefined
      ? [borrower as `0x${string}`, collateralToken as `0x${string}`, collateralTokenId, requestedAmount, duration]
      : undefined,
    query: {
      enabled: !!borrower && !!collateralToken && collateralTokenId !== undefined &&
             requestedAmount !== undefined && duration !== undefined && !!addresses.RiskEngine,
    },
  });
}

// Token Registry Hooks
export function useGetSupportedTokens() {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenRegistry as `0x${string}`,
    abi: TokenRegistryABI,
    functionName: 'getSupportedTokens',
    query: {
      enabled: !!addresses.TokenRegistry,
    },
  });
}

// Tokenized Policy Hooks
export function useGetPolicyDetails(policyId: bigint | undefined) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'getPolicyDetails',
    args: policyId !== undefined ? [policyId] : undefined,
    query: {
      enabled: policyId !== undefined && !!addresses.TokenizedPolicy,
    },
  });
}

export function useUpdatePolicyValuation() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract, error } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const updateValuation = async (policyId: bigint, newValuation: bigint) => {
    if (!addresses.TokenizedPolicy) {
      throw new Error('TokenizedPolicy address not available');
    }
    return writeContract({
      address: addresses.TokenizedPolicy as `0x${string}`,
      abi: TokenizedPolicyABI,
      functionName: 'updatePolicyValuation',
      args: [policyId, newValuation],
    });
  };

  return {
    updateValuation,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}
