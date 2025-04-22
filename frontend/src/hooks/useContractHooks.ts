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
export function usePolicyTokenDetails(tokenId: string | number | undefined) {
  const { addresses } = useContractAddresses();

  // Convert to BigInt if it's defined
  const tokenIdBigInt = tokenId !== undefined ? BigInt(tokenId) : undefined;

  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'getPolicyDetails',
    args: tokenIdBigInt ? [tokenIdBigInt] : undefined,
    query: {
      enabled: !!tokenId && !!addresses.TokenizedPolicy,
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

export function useTokenURI(tokenId: string | number | undefined) {
  const { addresses } = useContractAddresses();

  // Convert to BigInt if it's defined
  const tokenIdBigInt = tokenId !== undefined ? BigInt(tokenId) : undefined;

  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'tokenURI',
    args: tokenIdBigInt ? [tokenIdBigInt] : undefined,
    query: {
      enabled: !!tokenId && !!addresses.TokenizedPolicy,
    },
  });
}

export function useTokenOwner(tokenId: string | number | undefined) {
  const { addresses } = useContractAddresses();

  // Convert to BigInt if it's defined
  const tokenIdBigInt = tokenId !== undefined ? BigInt(tokenId) : undefined;

  return useReadContract({
    address: addresses.TokenizedPolicy as `0x${string}`,
    abi: TokenizedPolicyABI,
    functionName: 'ownerOf',
    args: tokenIdBigInt ? [tokenIdBigInt] : undefined,
    query: {
      enabled: !!tokenId && !!addresses.TokenizedPolicy,
    },
  });
}

export function useMintPolicyToken(chainId?: number) {
  const { addresses } = useContractAddresses(chainId);
  const { writeContract, isPending, data: hash } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Extract token ID from transaction logs
  let tokenId: number | undefined = undefined;

  if (txData && txData.logs && txData.logs.length > 0) {
    console.log('Transaction logs count:', txData.logs.length);

    // Detailed logging of all transaction logs for debugging
    txData.logs.forEach((log, index) => {
      console.log(`Log #${index}:`, {
        address: log.address,
        topics: log.topics,
        data: log.data
      });
    });

    // First try: Look for the ERC721 Transfer event (most reliable for NFTs)
    // The Transfer event has signature: Transfer(address,address,uint256)
    // keccak256("Transfer(address,address,uint256)")
    const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    const transferLog = txData.logs.find(log =>
      log.topics && log.topics[0] === transferEventSignature
    );

    if (transferLog && transferLog.topics && transferLog.topics.length > 2) {
      // In Transfer event, the token ID is in the last topic
      // For ERC721, it's typically in topics[3]
      const tokenIdTopic = transferLog.topics[transferLog.topics.length - 1];
      if (tokenIdTopic) {
        tokenId = Number(BigInt(tokenIdTopic));
        console.log('Token ID from Transfer event:', tokenId);
      }
    }

    // Second try: Look for the PolicyMinted event
    if (tokenId === undefined) {
      const policyMintedLog = txData.logs.find(log =>
        log.topics && log.topics[0] === '0xc57b2430c63aaf86ae1865b1b458464011beb3bf14a66914f2911d07161c1c2a'
      );

      if (policyMintedLog && policyMintedLog.topics && policyMintedLog.topics.length > 1 && policyMintedLog.topics[1]) {
        // Extract token ID from the PolicyMinted event
        tokenId = Number(BigInt(policyMintedLog.topics[1]));
        console.log('Token ID from PolicyMinted event:', tokenId);
      }
    }

    // If we still don't have a token ID, try to extract from the return value
    if (tokenId === undefined && txData.logs.length > 0) {
      try {
        // The mintPolicy function returns the token ID, which might be in the data field
        // of one of the logs or in the transaction receipt's return value
        if (txData.logs[0].data && txData.logs[0].data !== '0x') {
          // Try to extract from data field if it's not empty
          tokenId = Number(BigInt(txData.logs[0].data));
          console.log('Token ID from log data:', tokenId);
        }
      } catch (error) {
        console.error('Error extracting token ID from log data:', error);
      }
    }
  }

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
    tokenId,
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

  const createLoan = async (args: [`0x${string}`, bigint, bigint, bigint, `0x${string}`]) => {
    if (!addresses.LoanOrigination) {
      throw new Error('LoanOrigination address not available');
    }
    return writeContract({
      address: addresses.LoanOrigination as `0x${string}`,
      abi: LoanOriginationABI,
      functionName: 'requestLoan',
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
