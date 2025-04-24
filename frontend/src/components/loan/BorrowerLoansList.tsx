'use client';

import { useAccount } from 'wagmi';
import { useGetBorrowerLoans, useLoanDetails, useActivateLoan, useRepayLoan, useUSDCAllowance, useApproveUSDC, useGetTotalRepaymentAmount, LoanStatus } from '@/hooks/useContractHooks';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { formatAddress } from '@/utils/explorer';
import { useChainId } from 'wagmi';

// Component to display a single loan
function LoanItem({ loanId, onLoanUpdated }: { loanId: bigint, onLoanUpdated: () => Promise<void> }) {
  const { data: loan, isLoading } = useLoanDetails(loanId);
  const { activateLoan, isLoading: isActivating, isSuccess: isActivateSuccess } = useActivateLoan();
  const { repayLoan, isLoading: isRepaying } = useRepayLoan();
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  // Default to true until we confirm approval is not needed
  const [needsApproval, setNeedsApproval] = useState<boolean>(true);
  const [approvalLoading, setApprovalLoading] = useState<boolean>(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const { address: userAddress } = useAccount();
  const { addresses } = useContractAddresses();

  // Get the current allowance - we need to use the stablecoin from the loan
  // This will be undefined initially and updated when loan data is available
  const [stablecoinAddress, setStablecoinAddress] = useState<string | null>(null);

  // Update stablecoin address when loan data is available
  useEffect(() => {
    if (loan && loan.stablecoin) {
      console.log(`Setting stablecoin address to ${loan.stablecoin} for loan #${loanId.toString()}`);
      setStablecoinAddress(loan.stablecoin);

      // Force an immediate check for approval needs when loan data becomes available
      if (loan.status === LoanStatus.ACTIVE) {
        console.log(`Loan #${loanId.toString()} is active, checking approval needs immediately`);
        // We'll check approval in the next useEffect when stablecoinAddress is set
      }
    }
  }, [loan, loanId]);

  // Get the current allowance using the correct stablecoin address
  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(
    userAddress as `0x${string}`,
    stablecoinAddress as `0x${string}`
  );

  // Get the approve function
  const { approve, isLoading: isApproving, isSuccess: isApproveSuccess } = useApproveUSDC();

  // Get the total repayment amount
  const { data: totalRepaymentAmount, isLoading: isLoadingRepayment, isSuccess: isGetRepaymentSuccess } = useGetTotalRepaymentAmount(loanId);

  // Check if approval is needed when loan data changes
  useEffect(() => {
    const checkApprovalNeeded = async () => {
      // If we don't have loan data yet, we can't check approval
      if (!loan) {
        console.log(`No loan data available for loan #${loanId.toString()}`);
        return;
      }

      // If the loan is not active, we don't need approval
      if (loan.status !== LoanStatus.ACTIVE) {
        console.log(`Loan #${loanId.toString()} is not active (status: ${loan.status}), no approval needed`);
        setNeedsApproval(false);
        return;
      }

      // If we don't have stablecoin address, we can't check approval
      if (!stablecoinAddress) {
        console.log(`No stablecoin address available for loan #${loanId.toString()}`);
        return;
      }

      // If we don't have LoanOrigination address, we can't check approval
      if (!addresses.LoanOrigination) {
        console.log(`No LoanOrigination address available for loan #${loanId.toString()}`);
        return;
      }

      // If allowance is undefined, we're still loading it
      if (allowance === undefined) {
        console.log(`Allowance data still loading for loan #${loanId.toString()}`);
        return;
      }

      // If repayment amount is still loading or not available, wait for it
      if (isLoadingRepayment || !totalRepaymentAmount || totalRepaymentAmount === undefined) {
        console.log(`Repayment is loading: ${isLoadingRepayment}. Total repayment is ${totalRepaymentAmount} for loan #${loanId.toString()}, get repayment: ${isGetRepaymentSuccess},waiting for data`);
        // We'll check again when totalRepaymentAmount is available and loading is complete
        return;
      }

      // Check if allowance is less than the total repayment amount
      try {
        const allowanceBigInt = BigInt(allowance?.toString() || '0');
        const repaymentBigInt = BigInt(totalRepaymentAmount.toString());

        console.log(`Checking approval for loan #${loanId.toString()}: Allowance=${allowanceBigInt.toString()}, Total Repayment=${repaymentBigInt.toString()}`);
        console.log(`Stablecoin address: ${stablecoinAddress}, LoanOrigination: ${addresses.LoanOrigination}`);

        if (allowanceBigInt < repaymentBigInt) {
          console.log(`Approval needed for repaying loan #${loanId.toString()}, because ${allowanceBigInt} < ${repaymentBigInt}`);
          setNeedsApproval(true);
        } else {
          console.log(`No approval needed for repaying loan #${loanId.toString()}`);
          setNeedsApproval(false);
        }
      } catch (error) {
        console.error(`Error checking approval for loan #${loanId.toString()}:`, error);
        setApprovalError('Error checking approval status');
      }
    };

    // Run the check immediately when the component mounts or data changes
    checkApprovalNeeded();

    // Also set up a timer to check periodically
    const timer = setInterval(checkApprovalNeeded, 2000); // Check every 2 seconds

    return () => clearInterval(timer); // Clean up on unmount
  }, [loan, allowance, addresses.LoanOrigination, totalRepaymentAmount, stablecoinAddress, loanId, isLoadingRepayment, isGetRepaymentSuccess]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      console.log('Unlimited approval transaction successful!');

      // Since we're using MAX_UINT256 for approval, we know it's sufficient
      // No need to check the exact amount
      setNeedsApproval(false);
      setApprovalLoading(false);

      // Show success message
      toast.success('Unlimited approval successful! You can now repay any loan without further approvals.');

      // Refetch allowance in the background to update the UI
      refetchAllowance().then(result => {
        console.log('Refetched allowance after approval:', result.data);
      }).catch(error => {
        console.error('Error refetching allowance:', error);
      });
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Debug log to check if needsApproval is true
  useEffect(() => {
    console.log(`Rendering loan #${loanId.toString()}, needsApproval: ${needsApproval}`);
  }, [loanId, needsApproval]);

  useEffect(() => {
    if (isActivateSuccess) {
      // Update toast to show success
      toast.update(`activate-${loanId}`, {
        render: `Loan #${loanId.toString()} activated successfully!`,
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      // Refresh the loan data
      onLoanUpdated();
    }
  }, [isActivateSuccess, loanId, onLoanUpdated]);

  // Show loading state while loan details or repayment amount are loading
  if (isLoading || isLoadingRepayment) {
    return (
      <Card className="p-4 mb-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (!loan) {
    return (
      <Card className="p-4 mb-2">
        <p className="text-red-500">Error loading loan details</p>
      </Card>
    );
  }

  // Map loan status to display text and color
  const getStatusDisplay = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.PENDING:
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case LoanStatus.ACTIVE:
        return { text: 'Active', color: 'bg-green-100 text-green-800' };
      case LoanStatus.REPAID:
        return { text: 'Repaid', color: 'bg-blue-100 text-blue-800' };
      case LoanStatus.DEFAULTED:
        return { text: 'Defaulted', color: 'bg-red-100 text-red-800' };
      case LoanStatus.LIQUIDATED:
        return { text: 'Liquidated', color: 'bg-purple-100 text-purple-800' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Cast loan to any to avoid TypeScript errors with the loan object structure
  const statusDisplay = getStatusDisplay(loan.status as LoanStatus);
  const principal = Number(loan.principal) / 1e6; // Assuming 6 decimals for stablecoin

  // Debug log moved to the top with other useEffects

  return (
    <Card className="p-4 mb-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Loan #{loanId.toString()}</h3>
          <p className="text-sm text-gray-600">
            Collateral: {formatAddress(loan.collateralToken)} (ID: {loan.collateralTokenId.toString()})
          </p>
          <p className="text-sm text-gray-600">Principal: ${principal.toLocaleString()}</p>
          <p className="text-sm text-gray-600">
            Duration: {Number(loan.duration) / 86400} days
          </p>
        </div>
        <div className="flex flex-col items-end">
          <Badge className={statusDisplay.color}>{statusDisplay.text}</Badge>
          {loan.status === LoanStatus.ACTIVE && (
            <div className="flex flex-col items-end gap-2">
              {/* Debug message removed to avoid React hook order issues */}

              {/* Stablecoin Approval Button - Appears when there's insufficient allowance */}
              {needsApproval && (
                <div className="w-full mb-2 p-2 bg-amber-50 border-2 border-amber-300 rounded-md">
                  <Button
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-3 rounded-md shadow-md flex items-center justify-center"
                    onClick={async () => {
                    try {
                      setApprovalLoading(true);
                      toast.loading(`Approving unlimited stablecoin access...`, { toastId: `approve-${loanId}` });

                      // Make sure we have the stablecoin address
                      if (!stablecoinAddress) {
                        throw new Error('Stablecoin address not available');
                      }

                      // Check if repayment amount is still loading
                      if (isLoadingRepayment) {
                        toast.update(`approve-${loanId}`, {
                          render: `Still calculating repayment amount. Please try again in a moment.`,
                          type: 'info',
                          isLoading: false,
                          autoClose: 3000
                        });
                        setApprovalLoading(false);
                        return;
                      }

                      // For testing purposes, approve a very large amount
                      // This is a common pattern in DeFi to avoid multiple approvals
                      // 2^256 - 1 is the maximum uint256 value (effectively infinite approval)
                      const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

                      // Log the approval amount
                      console.log(`Approving MAX_UINT256 amount for stablecoin: ${MAX_UINT256.toString()}`);
                      const totalApprovalAmount = MAX_UINT256;

                      console.log(`Approving unlimited tokens of ${stablecoinAddress} for ${addresses.LoanOrigination} contract`);


                      await approve(addresses.LoanOrigination as `0x${string}`, totalApprovalAmount, stablecoinAddress as `0x${string}`);

                      // Update toast to show success
                      toast.update(`approve-${loanId}`, {
                        render: `Unlimited approval transaction submitted. Waiting for confirmation...`,
                        type: 'info',
                        isLoading: true,
                        autoClose: false
                      });

                      // We'll let the useEffect handle the success state when isApproveSuccess becomes true
                      // No need to manually update UI here

                    } catch (error: Error | unknown) {
                      console.error('Error approving stablecoin:', error);
                      toast.update(`approve-${loanId}`, {
                        render: `Error approving stablecoin: ${error || 'Unknown error'}`,
                        type: 'error',
                        isLoading: false,
                        autoClose: 5000
                      });
                      setApprovalLoading(false);
                    }
                  }}
                  disabled={isApproving || approvalLoading}
                >
                  {isApproving || approvalLoading ? 'Approving...' : '1. Approve Stablecoin (Unlimited)'}
                </Button>
                </div>
              )}

              {/* Repay Loan Button - Always visible */}
              <Button
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  // Check if repayment amount is still loading
                  if (isLoadingRepayment) {
                    toast.warning(`Still calculating repayment amount. Please try again in a moment.`);
                    return;
                  }

                  // Double-check if approval is needed
                  if (allowance && totalRepaymentAmount) {
                    const allowanceBigInt = BigInt(allowance.toString());
                    const repaymentBigInt = BigInt(totalRepaymentAmount.toString());

                    if (allowanceBigInt < repaymentBigInt) {
                      console.log(`Approval needed detected when clicking Repay for loan #${loanId.toString()}`);
                      setNeedsApproval(true);
                      toast.warning(`Please approve stablecoin first before repaying loan #${loanId.toString()}`);
                      return;
                    }
                  }

                  // Also check the state variable
                  if (needsApproval) {
                    toast.warning(`Please approve stablecoin first before repaying loan #${loanId.toString()}`);
                    return;
                  }

                  try {
                    setProcessingLoanId(loanId.toString());
                    toast.loading(`Repaying loan #${loanId.toString()}...`, { toastId: `repay-${loanId}` });

                    // Log the loan ID and principal amount
                    console.log(`Repaying loan ID: ${loanId.toString()}, Principal: ${loan.principal.toString()}`);
                    console.log(`Loan status: ${loan.status}, Stablecoin: ${loan.stablecoin}`);

                    try {
                      // Calculate total repayment (principal + interest)
                      const timeElapsed = Math.floor(Date.now() / 1000) - Number(loan.startTime);
                      const duration = Number(loan.duration);
                      const actualTime = timeElapsed > duration ? duration : timeElapsed;

                      // Calculate interest (APR * principal * timeElapsed / 1 year)
                      const interest = (BigInt(loan.interestRate) * BigInt(loan.principal) * BigInt(actualTime)) / BigInt(10000 * 365 * 24 * 60 * 60);
                      const totalRepayment = BigInt(loan.principal) + interest;

                      console.log(`Calculated repayment:
                        Principal: ${loan.principal.toString()}
                        Interest: ${interest.toString()}
                        Total: ${totalRepayment.toString()}
                      `);

                      // Check one more time if repayment amount is still loading
                      if (isLoadingRepayment) {
                        toast.update(`repay-${loanId}`, {
                          render: `Still calculating repayment amount. Please try again in a moment.`,
                          type: 'warning',
                          isLoading: false,
                          autoClose: 3000
                        });
                        setProcessingLoanId(null);
                        return;
                      }

                      // Force refresh the allowance one more time before proceeding
                      console.log(`Final allowance check before repaying loan #${loanId.toString()}`);
                      const finalCheck = await refetchAllowance();

                      if (finalCheck.data && totalRepayment) {
                        const currentAllowance = BigInt(finalCheck.data.toString());
                        console.log(`Final allowance check: ${currentAllowance.toString()}, Required: ${totalRepayment.toString()}`);

                        if (currentAllowance < totalRepayment) {
                          toast.update(`repay-${loanId}`, {
                            render: `Insufficient allowance. Please approve stablecoin first.`,
                            type: 'error',
                            isLoading: false,
                            autoClose: 5000
                          });
                          setNeedsApproval(true); // Set needs approval flag
                          setProcessingLoanId(null);
                          return;
                        } else {
                          console.log(`Final allowance check passed, proceeding with repayment`);
                        }
                      }

                      // The repayLoan function requires both loanId and amount
                      console.log(`Calling repayLoan with loanId: ${loanId.toString()}, amount: ${totalRepayment.toString()}`);
                      await repayLoan(loanId, totalRepayment);

                      toast.update(`repay-${loanId}`, {
                        render: `Repayment transaction submitted for loan #${loanId.toString()}. Waiting for confirmation...`,
                        type: 'info',
                        isLoading: true,
                        autoClose: false
                      });

                      // Wait for the transaction to be mined
                      await onLoanUpdated();

                      // Update toast to show success
                      toast.update(`repay-${loanId}`, {
                        render: `Loan #${loanId.toString()} repaid successfully!`,
                        type: 'success',
                        isLoading: false,
                        autoClose: 5000
                      });
                    } catch (error: Error |unknown) {
                      console.error('Error repaying loan:', error);

                      toast.update(`repay-${loanId}`, {
                        render: `Error repaying loan: ${error}`,
                        type: 'error',
                        isLoading: false,
                        autoClose: 5000
                      });
                    }
                  } catch (error) {
                    console.error('Unexpected error:', error);
                    toast.update(`repay-${loanId}`, {
                      render: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      type: 'error',
                      isLoading: false,
                      autoClose: 5000
                    });
                  } finally {
                    setProcessingLoanId(null);
                  }
                }}
                disabled={isRepaying || processingLoanId === loanId.toString()}
              >
                {isRepaying && processingLoanId === loanId.toString() ? 'Repaying...' : needsApproval ? '2. Repay Loan (Approval Required)' : 'Repay Loan'}
              </Button>

              {approvalError && (
                <div className="text-xs text-red-500 mt-1">
                  {approvalError}
                </div>
              )}

              {needsApproval && (
                <div className="text-sm font-medium text-amber-600 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  ⚠️ Stablecoin approval required before repaying
                </div>
              )}
            </div>
          )}
          {loan.status === LoanStatus.PENDING && (
            <Button
              className="mt-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                try {
                  setProcessingLoanId(loanId.toString());
                  toast.loading(`Activating loan #${loanId.toString()}...`, { toastId: `activate-${loanId}` });

                  await activateLoan(loanId);

                  // Show pending state while waiting for confirmation
                  toast.update(`activate-${loanId}`, {
                    render: `Activation transaction submitted for loan #${loanId.toString()}. Waiting for confirmation...`,
                    type: 'info',
                    isLoading: true,
                    autoClose: false
                  });

                } catch (error) {
                  console.error('Error activating loan:', error);

                  // Format user-friendly error message
                  let errorMsg = 'Unknown error';
                  if (error instanceof Error) {
                    if (error.message.includes('Failed to fetch') || error.message.includes('HTTP request failed')) {
                      errorMsg = 'Blockchain node is not responding. Please check your connection.';
                    } else if (error.message.includes('execution reverted')) {
                      errorMsg = 'Transaction reverted: Loan may not be in pending status.';
                    } else if (error.message.includes('user rejected')) {
                      errorMsg = 'Transaction was rejected by the user.';
                    } else {
                      errorMsg = error.message;
                    }
                  }

                  toast.update(`activate-${loanId}`, {
                    render: `Error activating loan: ${errorMsg}`,
                    type: 'error',
                    isLoading: false,
                    autoClose: 5000
                  });
                } finally {
                  setProcessingLoanId(null);
                }
              }}
              disabled={isActivating || processingLoanId === loanId.toString()}
            >
              {isActivating && processingLoanId === loanId.toString() ? 'Activating...' : 'Activate Loan'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Main component to display all borrower loans
export function BorrowerLoansList() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: loanIds = [], isLoading, isError, refetch: refetchLoans } = useGetBorrowerLoans(address as `0x${string}`, chainId);

  const handleLoanUpdated = async () => {
    await refetchLoans();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Your Loans</h2>
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="p-4 mb-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Loans</h2>
        <Card className="p-4 bg-red-50">
          <p className="text-red-500">Error loading loans. Please try again later.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(loanIds as bigint[]).map((loanId) => (
        <LoanItem key={loanId.toString()} loanId={loanId} onLoanUpdated={handleLoanUpdated} />
      ))}
    </div>
  );
}
