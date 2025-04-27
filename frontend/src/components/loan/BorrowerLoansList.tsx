'use client';

import { useAccount } from 'wagmi';
import { useGetBorrowerLoans, useLoanDetails, useActivateLoan, useRepayLoan, useUSDCAllowance, useApproveUSDC, useGetTotalRepaymentAmount, LoanStatus, LoanDetails } from '@/hooks/useContractHooks';
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
  // Get allowance for the stablecoin
  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(
    userAddress as `0x${string}`,
    stablecoinAddress as `0x${string}`
  );
  // Get total repayment amount
  const { data: totalRepaymentAmount, isLoading: isLoadingRepayment } = useGetTotalRepaymentAmount(loanId);

  // Approve stablecoin for repayment
  const { approve, isLoading: isApproving, isSuccess: isApproveSuccess } = useApproveUSDC();

  // Check if approval is needed when loan data changes
  useEffect(() => {
    // Only check approval for active loans with all required data
    if (!loan || loan.status !== LoanStatus.ACTIVE || !stablecoinAddress ||
        !addresses.LoanOrigination || allowance === undefined ||
        !totalRepaymentAmount) {
      // For non-active loans, no approval needed
      if (loan && loan.status !== LoanStatus.ACTIVE) {
        setNeedsApproval(false);
      }
      return;
    }

    // Simple check if allowance is less than the total repayment amount
    try {
      const allowanceBigInt = BigInt(allowance?.toString() || '0');
      const repaymentBigInt = BigInt(totalRepaymentAmount.toString());

      // Set approval status based on comparison
      setNeedsApproval(allowanceBigInt < repaymentBigInt);
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalError('Error checking approval status');
    }
  }, [loan, allowance, addresses.LoanOrigination, totalRepaymentAmount, stablecoinAddress]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      // Since we're using MAX_UINT256 for approval, we know it's sufficient
      setNeedsApproval(false);
      setApprovalLoading(false);

      // Show success message
      toast.success('Unlimited approval successful! You can now repay any loan without further approvals.');

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
          {loan.status === LoanStatus.ACTIVE && (
            <div className="flex flex-col items-end gap-2">
              {/* Debug message removed to avoid React hook order issues */}

              {/* Stablecoin Approval Button - Appears when there's insufficient allowance */}
              {needsApproval && (
                <div className="flex flex-col items-end">
                <Button
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      setApprovalLoading(true);
                      toast.loading(`Approving unlimited stablecoin access...`, { toastId: `approve-${loanId}` });

                      // Make sure we have the stablecoin address
                      if (!stablecoinAddress) {
                        throw new Error('Stablecoin address not available');
                      }

                      // Use MAX_UINT256 for unlimited approval
                      const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

                      // Approve the LoanOrigination contract to spend tokens
                      await approve(addresses.LoanOrigination as `0x${string}`, MAX_UINT256, stablecoinAddress as `0x${string}`);

                      // Update toast to show transaction submitted
                      toast.update(`approve-${loanId}`, {
                        render: `Unlimited approval transaction submitted. Waiting for confirmation...`,
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
                  {isApproving || approvalLoading ? 'Approving...' : '1. Approve Stablecoin (Unlimited)'}
                </Button>
                </div>
              )}

              {/* Repay Loan Button - Only visible for active loans */}
              {loan.status === LoanStatus.ACTIVE && (              <Button
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  // Check if loan is already repaid
                  // Check if loan is already repaid (this should never happen due to the parent condition)
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

                    // Get the total repayment amount from the contract
                    // This is more accurate than calculating it on the frontend
                    // The contract will handle capping the amount if it exceeds the total repayment
                    if (!totalRepaymentAmount) {
                      throw new Error('Total repayment amount not available');
                    }

                    const repaymentAmount = totalRepaymentAmount as bigint;
                    console.log(`Using total repayment amount from contract: ${repaymentAmount.toString()}`);

                    // For display purposes, calculate what we expect to pay
                    const timeElapsed = Math.floor(Date.now() / 1000) - Number(loan.startTime);
                    const duration = Number(loan.duration);
                    const actualTime = timeElapsed > duration ? duration : timeElapsed;
                    const interest = (BigInt(loan.interestRate) * BigInt(loan.principal) * BigInt(actualTime)) / BigInt(10000 * 365 * 24 * 60 * 60);
                    const calculatedAmount = BigInt(loan.principal) + interest;

                    console.log(`Calculated amount: ${calculatedAmount.toString()}, Contract amount: ${repaymentAmount.toString()}`);

                    // Use the contract's repayment amount
                    const totalRepayment = repaymentAmount;

                    // Call the repayLoan function
                    await repayLoan(loanId, totalRepayment);

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
                {isRepaying && processingLoanId === loanId.toString() ? 'Repaying...' : needsApproval ? '2. Repay Loan (Approval Required)' : 'Repay Loan'}
              </Button>
              )}

              {approvalError && (
                <div className="text-xs text-red-500 mt-1">
                  {approvalError}
                </div>
              )}
            </div>
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
