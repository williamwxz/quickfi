'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect } from 'react';
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
    args: tokenIdBigInt !== undefined ? [tokenIdBigInt] : undefined,
    query: {
      enabled: tokenId !== undefined && !!addresses.TokenizedPolicy,
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
    args: tokenIdBigInt !== undefined ? [tokenIdBigInt] : undefined,
    query: {
      enabled: tokenId !== undefined && !!addresses.TokenizedPolicy,
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
    args: tokenIdBigInt !== undefined ? [tokenIdBigInt] : undefined,
    query: {
      enabled: tokenId !== undefined && !!addresses.TokenizedPolicy,
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

    if (tokenId === undefined) {
      console.error('Failed to extract token ID from transaction logs');
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
  const { data, isPending, writeContract } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess, error: txError, status: txStatus } = useWaitForTransactionReceipt({
    hash: data,
  });

  const createLoan = async (args: [`0x${string}`, bigint, bigint, bigint, `0x${string}`]) => {
    if (!addresses.LoanOrigination) {
      throw new Error('LoanOrigination address not available');
    }

    try {
      // Prepare the transaction request
      const request = {
        address: addresses.LoanOrigination as `0x${string}`,
        abi: LoanOriginationABI,
        functionName: 'requestLoan',
        args,
        // Base gas configuration
        gas: BigInt(1000000), // 1 million gas
        maxFeePerGas: BigInt(20000000000), // 20 gwei
        maxPriorityFeePerGas: BigInt(20000000000), // 20 gwei
      };

      console.log('Sending transaction with config:', {
        gas: request.gas?.toString(),
        maxFeePerGas: request.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: request.maxPriorityFeePerGas?.toString(),
      });

      return writeContract(request);
    } catch (error) {
      console.error('Error in createLoan:', error);
      throw error;
    }
  };

  return {
    createLoan,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    txError,
    txStatus
  };
}

// Define the loan status enum to match the contract
export enum LoanStatus {
  NONE = 0,
  PENDING = 1,
  ACTIVE = 2,
  REPAID = 3,
  DEFAULTED = 4,
  LIQUIDATED = 5
}

// Define the loan structure to match the contract
export interface LoanDetails {
  id: bigint;
  borrower: `0x${string}`;
  collateralTokenId: bigint;
  collateralToken: `0x${string}`;
  principal: bigint;
  interestRate: bigint;
  startTime: bigint;
  duration: bigint;
  endTime: bigint;
  status: LoanStatus;
  stablecoin: `0x${string}`;
  repaidAmount: bigint;
}

// Hook to get loan details from the blockchain
export function useLoanDetails(loanId: bigint) {
  const { addresses } = useContractAddresses();
  const result = useReadContract({
    address: addresses.LoanOrigination as `0x${string}`,
    abi: LoanOriginationABI,
    functionName: 'getLoan',
    args: loanId !== undefined ? [loanId] : undefined,
    query: {
      enabled: loanId !== undefined && !!addresses.LoanOrigination,
      // Aggressive caching settings to ensure we get fresh data
      staleTime: 0, // Always consider data stale
      refetchInterval: 3000, // Refetch every 3 seconds
      refetchOnMount: true, // Refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window gets focus
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  });

  // Log when loan details are fetched
  useEffect(() => {
    if (result.data) {
      const loanData = result.data as LoanDetails;
      if (loanData && loanData.status !== undefined) {
        console.log(`Loan #${loanId.toString()} status: ${loanData.status} (${LoanStatus[loanData.status]}`);
      }
    }
  }, [result.data, loanId]);

  // Custom refetch function with forced refresh
  const forceRefetch = async () => {
    try {
      // Force cache invalidation and refetch
      const refetchResult = await result.refetch({ throwOnError: true });
      console.log(`Force refetch for loan #${loanId.toString()} completed:`,
                  refetchResult.data ? `Status: ${LoanStatus[(refetchResult.data as LoanDetails).status]}` : 'No data');
      return refetchResult;
    } catch (error) {
      console.error(`Error refetching loan #${loanId.toString()} details:`, error);
      throw error;
    }
  };

  return {
    ...result,
    data: result.data as LoanDetails,
    refetch: forceRefetch
  };
}

export function useActivateLoan() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: data,
  });

  const activateLoan = async (loanId: bigint) => {
    if (!addresses.LoanOrigination) {
      throw new Error('LoanOrigination address not available');
    }
    console.log('Activating loan with ID:', loanId.toString());

    try {
      // Prepare the transaction request with gas configuration
      const request = {
        address: addresses.LoanOrigination as `0x${string}`,
        abi: LoanOriginationABI,
        functionName: 'activateLoan',
        args: [loanId],
        // Base gas configuration
        gas: BigInt(1000000), // 1 million gas
        maxFeePerGas: BigInt(20000000000), // 20 gwei
        maxPriorityFeePerGas: BigInt(20000000000), // 20 gwei
      };

      console.log('Sending activate loan transaction with config:', {
        loanId: loanId.toString(),
        gas: request.gas?.toString(),
        maxFeePerGas: request.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: request.maxPriorityFeePerGas?.toString(),
      });

      return writeContract(request);
    } catch (error) {
      console.error('Error in activateLoan:', error);
      throw error;
    }
  };

  return {
    activateLoan,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    txError,
  };
}

// Hook to get all loans for a borrower
export function useGetBorrowerLoans(borrowerAddress: string, chainId: number) {
  const { addresses } = useContractAddresses(chainId);
  return useReadContract({
    address: addresses.LoanOrigination as `0x${string}`,
    abi: LoanOriginationABI,
    functionName: 'getBorrowerLoans',
    args: borrowerAddress ? [borrowerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!borrowerAddress && !!addresses.LoanOrigination,
    },
  });
}

export function useRepayLoan() {
  const { addresses } = useContractAddresses();
  const { data, isPending, writeContract, error: writeError } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess, error: txError, status: txStatus } = useWaitForTransactionReceipt({
    hash: data,
  });

  // Log transaction errors for debugging
  useEffect(() => {
    if (txError) {
      console.error('Transaction error in useRepayLoan:', txError);
    }
    if (writeError) {
      console.error('Write contract error in useRepayLoan:', writeError);
    }
  }, [txError, writeError]);

  // Log transaction data for debugging
  useEffect(() => {
    if (txData) {
      console.log('Transaction receipt in useRepayLoan:', txData);

      // Log transaction logs if available
      if (txData.logs && txData.logs.length > 0) {
        console.log('Transaction logs:');
        txData.logs.forEach((log, index) => {
          console.log(`Log #${index}:`, {
            address: log.address,
            topics: log.topics,
            data: log.data
          });
        });
      }
    }
  }, [txData]);

  const repayLoan = async (loanId: bigint, amount: bigint) => {
    if (!addresses.LoanOrigination) {
      throw new Error('Required contract addresses not available');
    }

    // Verify loan exists and is in active status
    try {
      console.log(`Preparing to repay loan #${loanId.toString()} with amount ${amount.toString()}`);
      console.log(`Using LoanOrigination contract at ${addresses.LoanOrigination}`);

      // Prepare the transaction request with detailed gas configuration
      const request = {
        address: addresses.LoanOrigination as `0x${string}`,
        abi: LoanOriginationABI,
        functionName: 'repayLoan',
        args: [loanId, amount],
        // Increased gas configuration for better chances of success
        gas: BigInt(2000000), // 2 million gas
        maxFeePerGas: BigInt(30000000000), // 30 gwei
        maxPriorityFeePerGas: BigInt(30000000000), // 30 gwei
      };

      console.log('Sending repay loan transaction with config:', {
        loanId: loanId.toString(),
        amount: amount.toString(),
        gas: request.gas?.toString(),
        maxFeePerGas: request.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: request.maxPriorityFeePerGas?.toString(),
      });

      // Add a trace to capture the raw transaction data
      console.log('Raw transaction data:', {
        to: addresses.LoanOrigination,
        functionName: 'repayLoan',
        args: [loanId.toString(), amount.toString()],
      });

      // Execute the transaction
      const txHash = writeContract(request);
      console.log(`Repay loan transaction submitted`);
      return txHash;
    } catch (error) {
      console.error('Error in repayLoan:', error);

      // Try to extract more detailed error information
      if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes('execution reverted')) {
          const revertMatch = error.message.match(/execution reverted: ([^"]*)/i);
          if (revertMatch && revertMatch[1]) {
            console.error(`Contract reverted with reason: ${revertMatch[1]}`);
          }
        }
      }

      throw error;
    }
  };

  return {
    repayLoan,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    txError,
    writeError,
    txStatus
  };
}

// Add this hook after useRepayLoan
export function useGetTotalRepaymentAmount(loanId: bigint) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.LoanOrigination as `0x${string}`,
    abi: LoanOriginationABI,
    functionName: 'getTotalRepaymentAmount',
    args: [loanId],
    query: {
      enabled: loanId !== undefined && !!addresses.LoanOrigination,
    },
  });
}

// Hook to get remaining repayment amount
export function useGetRemainingRepayment(loanId: bigint) {
  const { addresses } = useContractAddresses();
  return useReadContract({
    address: addresses.LoanOrigination as `0x${string}`,
    abi: LoanOriginationABI,
    functionName: 'getRemainingRepayment',
    args: [loanId],
    query: {
      enabled: loanId !== undefined && !!addresses.LoanOrigination,
      // Refresh more frequently to get up-to-date values
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
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

export function useUSDCAllowance(owner: string, stable_coin_address: string | null) {
  const {addresses} = useContractAddresses();

  const result = useReadContract({
    address: stable_coin_address as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'allowance',
    args: [owner as `0x${string}`, addresses.LoanOrigination as `0x${string}`],
    query: {
      enabled: !!owner && !!stable_coin_address && !!addresses.LoanOrigination,
    },
  });

  // Log errors for debugging
  useEffect(() => {
    if (result.error) {
      console.error('Error in useUSDCAllowance:', result.error);
      console.log('Allowance query params:', {
        owner,
        spender: addresses.LoanOrigination,
        stablecoin: stable_coin_address
      });
    }
  }, [result.error, owner, addresses.LoanOrigination, stable_coin_address]);

  // Log successful data fetching
  useEffect(() => {
    if (result.data !== undefined && result.data !== null) {
      console.log(`Allowance for ${owner} to spend on behalf of ${addresses.LoanOrigination}: ${result.data.toString()}`);
    }
  }, [result.data, owner, addresses.LoanOrigination]);

  return result;
}

export function useApproveUSDC() {
  const { data, isPending, writeContract, error: writeError } = useWriteContract();

  const { data: txData, isLoading: isTxLoading, isSuccess: isTxSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: data,
  });

  // Log transaction errors for debugging
  useEffect(() => {
    if (txError) {
      console.error('Transaction error in useApproveUSDC:', txError);
    }
    if (writeError) {
      console.error('Write contract error in useApproveUSDC:', writeError);
    }
  }, [txError, writeError]);

  const approve = async (spender: `0x${string}`, amount: bigint, stablecoinAddress: `0x${string}`) => {
    // Use override address if provided, otherwise use default

    console.log(`Approving ${amount.toString()} tokens for spender ${spender}`);
    console.log(`Using stablecoin contract at ${stablecoinAddress}`);

    try {
      // Prepare the transaction request with optimized gas configuration for faster processing
      const request = {
        address: stablecoinAddress as `0x${string}`,
        abi: MockUSDCABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
        // Optimized gas configuration for faster processing
        gas: BigInt(500000), // 500k gas (approval doesn't need 1M gas)
        maxFeePerGas: BigInt(50000000000), // 50 gwei - higher to prioritize
        maxPriorityFeePerGas: BigInt(50000000000), // 50 gwei - higher to prioritize
      };

      console.log('Sending approval transaction with config:', {
        spender,
        amount: amount.toString(),
        gas: request.gas?.toString(),
        maxFeePerGas: request.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: request.maxPriorityFeePerGas?.toString(),
      });

      const txHash = writeContract(request);
      console.log(`Approval transaction submitted`);
      return txHash;
    } catch (error) {
      console.error('Error in approve:', error);

      // Try to extract more detailed error information
      if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes('execution reverted')) {
          const revertMatch = error.message.match(/execution reverted: ([^"]*)/i);
          if (revertMatch && revertMatch[1]) {
            console.error(`Contract reverted with reason: ${revertMatch[1]}`);
          }
        }
      }

      throw error;
    }
  };

  return {
    approve,
    data,
    txData,
    isLoading: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error: writeError || txError,
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
