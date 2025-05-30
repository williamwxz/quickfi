'use client';

import { useAccount } from 'wagmi';
import { useGetBorrowerLoans, useLoanDetails, useActivateLoan, useRepayLoan, useUSDCAllowance, useApproveUSDC, LoanStatus, LoanDetails } from '@/hooks/useContractHooks';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { formatAddress } from '@/utils/explorer';
import { useChainId } from 'wagmi';

// Helper function to get status display information
function getStatusDisplay(status: LoanStatus) {
  switch (status) {
    case LoanStatus.PENDING:
      return { text: "Pending", color: "bg-yellow-500" };
    case LoanStatus.ACTIVE:
      return { text: "Active", color: "bg-green-500" };
    case LoanStatus.REPAID:
      return { text: "Repaid", color: "bg-blue-500" };
    case LoanStatus.DEFAULTED:
      return { text: "Defaulted", color: "bg-red-500" };
    case LoanStatus.LIQUIDATED:
      return { text: "Liquidated", color: "bg-red-700" };
    default:
      return { text: "Unknown", color: "bg-gray-500" };
  }
}

// Component to display a single loan
function LoanItem({ loanId, onLoanUpdated }: { loanId: bigint, onLoanUpdated: () => Promise<void> }) {
  const { data: loan, isLoading, refetch } = useLoanDetails(loanId);
  const { activateLoan, isLoading: isActivating, isSuccess: isActivateSuccess } = useActivateLoan();
  const { repayLoan, isLoading: isRepaying } = useRepayLoan();
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  // Default to true until we confirm approval is not needed
  const [needsApproval, setNeedsApproval] = useState<boolean>(true);
  const [approvalLoading, setApprovalLoading] = useState<boolean>(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const { address: userAddress } = useAccount();

  // Refresh loan data when component mounts
  // useEffect(() => {
  //   const refreshData = async () => {
  //     await refetch();
  //   };
  //   refreshData();
  // }, [refetch]);

  // Handle loan status changes
  useEffect(() => {
    if (loan) {
      // If loan is repaid, make sure we don't show approval or repay buttons
      if (loan.status === LoanStatus.REPAID) {
        setNeedsApproval(false);
      }
    }
  }, [loan]);

  const { addresses } = useContractAddresses();
  const [stablecoinAddress, setStablecoinAddress] = useState<string | null>(null);

  // Update stablecoin address when loan data is available
  useEffect(() => {
    if (loan && loan.stablecoin) {
      setStablecoinAddress(loan.stablecoin);
    }
  }, [loan]);

  // Get allowance for the stablecoin
  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(
    userAddress as `0x${string}`,
    stablecoinAddress as `0x${string}`
  );

  // Approve stablecoin for repayment
  const { approve, isLoading: isApproving, isSuccess: isApproveSuccess } = useApproveUSDC();

  // Calculate total repayment amount from loan details
  // This matches the _calculateRepaymentAmount function in LoanOrigination.sol
  const calculateTotalRepayment = () => {
    if (!loan) return BigInt(0);

    // Calculate elapsed days, but cap it at loan duration in days
    const now = Math.floor(Date.now() / 1000);
    let elapsedDays: number;

    if (now <= Number(loan.startTime)) {
      // Loan hasn't started yet
      elapsedDays = 0;
    } else if (now >= Number(loan.endTime)) {
      // Loan has ended, use full duration in days
      elapsedDays = Number(loan.duration) / (24 * 60 * 60); // Convert seconds to days (1 days = 86400 seconds)
    } else {
      // Loan is active and not ended - calculate days elapsed
      const secondsElapsed = now - Number(loan.startTime);
      elapsedDays = Math.floor(secondsElapsed / (24 * 60 * 60)); // Convert seconds to days and floor the result
    }

    // Calculate interest (APR * principal * elapsedDays / 365 days)
    // This exactly matches the contract calculation
    const interest = (loan.interestRate * loan.principal * BigInt(elapsedDays)) / BigInt(10000 * 365);

    return loan.principal + interest;
  };

  // Get total repayment amount
  const totalRepaymentAmount = loan ? calculateTotalRepayment() : BigInt(0);

  // Check if approval is needed when loan data changes
  useEffect(() => {
    // Check if we have the necessary data to determine approval status
    if (!loan || !stablecoinAddress || !addresses.LoanOrigination || allowance === undefined) {
      return;
    }

    // Always check allowance regardless of loan status
    try {
      const allowanceBigInt = BigInt(allowance?.toString() || '0');

      // Make sure totalRepaymentAmount is defined and convert to BigInt
      if (totalRepaymentAmount) {
        const repaymentBigInt = BigInt(totalRepaymentAmount.toString());

        // Set approval status based on comparison
        setNeedsApproval(allowanceBigInt < repaymentBigInt);
      } else {
        // If we don't have the repayment amount yet, default to needing approval
        setNeedsApproval(true);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalError('Error checking approval status');
    }
  }, [loan, allowance, addresses.LoanOrigination, totalRepaymentAmount, stablecoinAddress]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      // Update state to reflect approval
      setNeedsApproval(false);
      setApprovalLoading(false);

      // Show success message
      toast.success('Approval successful! You can now repay this loan.');

      // Refresh allowance data
      refetchAllowance().then(result => {
        console.log('Refetched allowance after approval:', result.data);
      }).catch(error => {
        console.error('Error refetching allowance:', error);
      });
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle activate loan success
  useEffect(() => {
    if (isActivateSuccess) {
      // Show success message
      toast.success(`Loan #${loanId.toString()} activated successfully!`);

      // Refresh loan data
      onLoanUpdated();
    }
  }, [isActivateSuccess, loanId, onLoanUpdated]);

  // Show loading state while loan details are loading
  if (isLoading) {
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

  const statusDisplay = getStatusDisplay(loan.status as LoanStatus);
  const principal = Number(loan.principal) / 1e6; // Assuming 6 decimals for stablecoin

  // Debug log moved to the top with other useEffects

  // Format dates
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  // Calculate remaining time for active loans
  const calculateRemainingTime = () => {
    if (loan.status !== LoanStatus.ACTIVE) return null;

    const endTime = Number(loan.endTime);
    const now = Math.floor(Date.now() / 1000);

    if (now >= endTime) return "Expired";

    const remainingSeconds = endTime - now;
    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);

    return `${days}d ${hours}h remaining`;
  };

  // Calculate current interest
  const calculateCurrentInterest = () => {
    const timeElapsed = Math.floor(Date.now() / 1000) - Number(loan.startTime);
    const duration = Number(loan.duration);
    const actualTime = timeElapsed > duration ? duration : timeElapsed;

    // Calculate interest (APR * principal * timeElapsed / 1 year)
    const interest = (Number(loan.interestRate) * Number(loan.principal) * actualTime) / (10000 * 365 * 24 * 60 * 60);
    return (interest / 1e6).toFixed(2); // Assuming 6 decimals for stablecoin
  };

  const remainingTime = calculateRemainingTime();
  const currentInterest = calculateCurrentInterest();

  return (
    <Card className="p-4 mb-2">
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Loan #{loanId.toString()}</h3>
            <p className="text-sm text-gray-600">ID: {loan.id.toString()}</p>
          </div>
          <Badge className={statusDisplay.color}>{statusDisplay.text}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-700">Loan Details</h4>
            <p className="text-sm text-gray-600">
              Principal: ${principal.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Interest Rate: {Number(loan.interestRate) / 100}%
            </p>
            <p className="text-sm text-gray-600">
              Current Interest: ${currentInterest}
            </p>
            {totalRepaymentAmount !== undefined && (
              <p className="text-sm text-gray-600">
                <strong>Total Repayment: ${(Number(totalRepaymentAmount) / 1e6).toFixed(6)}</strong>
              </p>
            )}
            {loan.repaidAmount > BigInt(0) && (
              <p className="text-sm text-gray-600">
                Repaid Amount: ${(Number(loan.repaidAmount) / 1e6).toFixed(6)}
              </p>
            )}
            {totalRepaymentAmount !== undefined && loan.repaidAmount > BigInt(0) && (
              <p className="text-sm text-gray-600">
                Remaining: ${((Number(totalRepaymentAmount) - Number(loan.repaidAmount)) / 1e6).toFixed(6)}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Duration: {Number(loan.duration) / 86400} days
            </p>
            {remainingTime && (
              <p className="text-sm text-gray-600">
                {remainingTime}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Stablecoin: {formatAddress(loan.stablecoin)}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-700">Collateral</h4>
            <p className="text-sm text-gray-600">
              Collateral: {formatAddress(loan.collateralToken)}
            </p>
            <p className="text-sm text-gray-600">
              Token ID: {loan.collateralTokenId.toString()}
            </p>
            <p className="text-sm text-gray-600">
              Borrower: {formatAddress(loan.borrower)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-700">Timestamps</h4>
            <p className="text-sm text-gray-600">
              Start Time: {formatDate(loan.startTime)}
            </p>
            <p className="text-sm text-gray-600">
              End Time: {formatDate(loan.endTime)}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <div className="flex flex-col items-end gap-2">
            {/* Stablecoin Approval Button - Always show when there's insufficient allowance */}
            {needsApproval && (
              <div className="flex flex-col items-end">
              <Button
                className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={async () => {
                  try {
                    setApprovalLoading(true);

                    // Make sure we have the stablecoin address
                    if (!stablecoinAddress) {
                      throw new Error('Stablecoin address not available');
                    }

                    // Make sure we have the total repayment amount
                    if (!totalRepaymentAmount) {
                      throw new Error('Total repayment amount not available');
                    }

                    // Use the exact repayment amount needed
                    const repaymentAmount = totalRepaymentAmount as bigint;

                    // Add a small buffer (5%) to account for any potential changes in interest
                    const buffer = (repaymentAmount * BigInt(5)) / BigInt(100);
                    const approvalAmount = repaymentAmount + buffer;

                    // Format the amount for display
                    const formattedAmount = (Number(approvalAmount) / 1e6).toFixed(2);

                    toast.loading(`Approving ${formattedAmount} stablecoin for repayment...`, { toastId: `approve-${loanId}` });

                    // Approve the LoanOrigination contract to spend tokens
                    await approve(addresses.LoanOrigination as `0x${string}`, approvalAmount, stablecoinAddress as `0x${string}`);

                    // Update toast to show transaction submitted
                    toast.update(`approve-${loanId}`, {
                      render: `Approval transaction submitted for ${formattedAmount} tokens. Waiting for confirmation...`,
                      type: 'info',
                      isLoading: true,
                      autoClose: false
                    });

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
                {isApproving || approvalLoading ? 'Approving...' : 'Approve Stablecoin for Repayment'}
              </Button>
              </div>
            )}

            {/* Repay Loan Button - Only visible for active loans */}
            {loan.status === LoanStatus.ACTIVE && (
              <Button
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  // Check if loan is already repaid
                  if (loan.status !== LoanStatus.ACTIVE) {
                    toast.info(`This loan cannot be repaid in its current state.`);
                    return;
                  }
                  // Check if approval is needed
                  if (needsApproval) {
                    toast.warning(`Please approve stablecoin first before repaying loan #${loanId.toString()}`);
                    return;
                  }

                  try {
                    setProcessingLoanId(loanId.toString());
                    toast.loading(`Repaying loan #${loanId.toString()}...`, { toastId: `repay-${loanId}` });

                    // Make sure we have the total repayment amount
                    if (!totalRepaymentAmount) {
                      throw new Error('Total repayment amount not available');
                    }

                    const repaymentAmount = totalRepaymentAmount as bigint;
                    console.log(`Using total repayment amount: ${repaymentAmount.toString()}`);

                    // Call the repayLoan function
                    await repayLoan(loanId, repaymentAmount);

                    toast.update(`repay-${loanId}`, {
                      render: `Repayment transaction submitted. Waiting for confirmation...`,
                      type: 'info',
                      isLoading: true,
                      autoClose: false
                    });

                    // Wait for the blockchain to update (important!)
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    // Force refresh the loan data
                    await refetch();

                    // Refresh all loans data
                    await onLoanUpdated();

                    // Check if the loan status has been updated
                    const updatedLoan = await refetch();
                    const loanData = updatedLoan.data as LoanDetails;

                    if (loanData && loanData.status === LoanStatus.REPAID) {
                      // Loan has been successfully repaid
                      toast.update(`repay-${loanId}`, {
                        render: `Loan #${loanId.toString()} repaid successfully!`,
                        type: 'success',
                        isLoading: false,
                        autoClose: 5000
                      });
                    } else {
                      // Loan status hasn't been updated yet, try one more time
                      await new Promise(resolve => setTimeout(resolve, 5000));
                      await refetch();

                      toast.update(`repay-${loanId}`, {
                        render: `Loan #${loanId.toString()} repayment processed. Please refresh to see updated status.`,
                        type: 'success',
                        isLoading: false,
                        autoClose: 5000
                      });
                    }
                  } catch (error: Error | unknown) {
                    console.error('Error repaying loan:', error);
                    toast.update(`repay-${loanId}`, {
                      render: `Error repaying loan: ${error || 'Unknown error'}`,
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
                {isRepaying && processingLoanId === loanId.toString() ? 'Repaying...' : needsApproval ? '2. Repay Loan (Approval Required)' : 'Repay Loan (Approved)'}
              </Button>
            )}

            {loan.status === LoanStatus.PENDING && (
              <Button
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={async () => {
                  try {
                    setProcessingLoanId(loanId.toString());
                    toast.loading(`Activating loan #${loanId.toString()}...`, { toastId: `activate-${loanId}` });

                    await activateLoan(loanId);

                    // Show pending state while waiting for confirmation
                    toast.update(`activate-${loanId}`, {
                      render: `Activation transaction submitted. Waiting for confirmation...`,
                      type: 'info',
                      isLoading: true,
                      autoClose: false
                    });

                  } catch (error: Error | unknown) {
                    console.error('Error activating loan:', error);
                    toast.update(`activate-${loanId}`, {
                      render: `Error activating loan: ${error || 'Unknown error'}`,
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

            {approvalError && (
              <div className="text-xs text-red-500 mt-1">
                {approvalError}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function BorrowerLoansList() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: loanIds = [], isLoading, isError, refetch: refetchLoans } = useGetBorrowerLoans(address as `0x${string}`, chainId);

  const handleLoanUpdated = async () => {
    // Force a refresh of all loans data
    try {
      // Wait a moment for the blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh the loans list
      await refetchLoans();

      // Force a refresh of the current page
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing loans data:", error);
    }
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
