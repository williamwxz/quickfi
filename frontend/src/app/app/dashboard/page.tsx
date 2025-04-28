'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { formatAddress, getTransactionUrl } from '@/utils/explorer';
import {
  useActivateLoan,
  useGetBorrowerLoans,
  useLoanDetails,
  LoanStatus
} from '@/hooks/useContractHooks';
import { useAccount, useChainId } from 'wagmi';
import { toast } from 'react-toastify';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

// Define types for our data
type Policy = {
  id: number;
  chain_id: number;
  address: string; // On-chain policy token address
  token_id?: number; // Added token_id field
  policy_number: string;
  face_value: number;
  expiry_date: string;
  tokenized_date: string;
  owner_address: string;
  issuer: string;
  policy_type: string;
  jurisdiction?: string; // Added jurisdiction field
  status: string;
};

type Loan = {
  id: number;
  chain_id: number;
  address: string; // On-chain loan address
  loan_id?: number; // Added loan_id field
  borrower_address: string;
  collateral_address: string; // Policy token address used as collateral
  collateral_token_id?: number; // Added collateral_token_id field
  loan_amount: number;
  interest_rate: number;
  term_days: number;
  start_date: string;
  end_date: string;
  status: string;
  stablecoin?: string; // Added stablecoin field
};

function DashboardContent() {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  // We'll use the contract addresses later if needed
  const [activeTab, setActiveTab] = useState<'policies' | 'loans'>('policies');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { isSuccess: isActivationSuccess, data: activationTxHash, txError: activationError } = useActivateLoan();

  // Fetch on-chain loan IDs for the current user
  const { data: borrowerLoanIds } = useGetBorrowerLoans(address || '', chainId);
  const [metrics, setMetrics] = useState({
    totalPolicyValue: 0,
    totalPolicies: 0,
    totalLoanValue: 0,
    totalLoans: 0,
    availableBorrowingPower: 0,
    availablePercentage: 0
  });

  // Fetch policies from API and loans from blockchain
  useEffect(() => {
    async function fetchData() {
      if (!address) return;

      setLoading(true);
      try {
        // Fetch policies
        const policiesResponse = await fetch(`/api/policy/owner/${address}?chainId=${chainId}`);
        const policiesData = await policiesResponse.json();

        if (!policiesResponse.ok) {
          throw new Error(policiesData.error || 'Failed to fetch policies');
        }

        // Set policies data
        const policies = policiesData.policies || [];
        setPolicies(policies);

        // We'll fetch loans from blockchain in a separate effect
        // But still fetch from API as fallback/supplementary data
        const loansResponse = await fetch(`/api/loans/user/${address}?chainId=${chainId}`);
        const loansData = await loansResponse.json();

        if (loansResponse.ok) {
          // Store the database loans data but don't set it directly
          // We'll merge it with blockchain data later
          const dbLoans = loansData.loans || [];

          // Only use database loans as initial data
          // The blockchain data will override/update this later
          console.log('Database loans:', dbLoans);
          setLoans(dbLoans);
        }

        // Calculate metrics
        const totalPolicyValue = policies.reduce((sum: number, policy: Policy) => sum + policy.face_value, 0);
        const availablePolicies = policies.filter((p: Policy) => p.status === 'active');
        const availablePolicyValue = availablePolicies.reduce((sum: number, policy: Policy) => sum + policy.face_value, 0);
        const totalLoanValue = loans.reduce((sum: number, loan: Loan) => sum + loan.loan_amount, 0);

        // Calculate available borrowing power (70% of available policy value)
        const borrowingPower = availablePolicyValue * 0.7;
        const availablePercentage = totalPolicyValue > 0 ? (borrowingPower / totalPolicyValue) * 100 : 0;

        setMetrics({
          totalPolicyValue,
          totalPolicies: policiesData?.length || 0,
          totalLoanValue,
          totalLoans: loansData?.length || 0,
          availableBorrowingPower: borrowingPower,
          availablePercentage
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address, chainId]);

  // Function to handle "Use as Collateral" button click
  const handleUseAsCollateral = (policyAddress: string, chainId: number) => {
    router.push(`/app/loan?policyAddress=${policyAddress}&chainId=${chainId}`);
  };

  // Component to fetch loan details and update the loans state
  const LoanDetailsFetcher = ({ loanId }: { loanId: number }) => {
    // Convert loanId to BigInt for the hook
    const loanIdBigInt = BigInt(loanId);

    // Use the useLoanDetails hook to fetch loan details from the blockchain
    const { data: loanDetails } = useLoanDetails(loanIdBigInt);

    // Update the loans state when loan details are fetched
    useEffect(() => {
      if (!loanDetails || !address) return;

      // Convert blockchain data to our Loan type
      const blockchainLoan: Loan = {
        id: loanId, // Use loanId as id
        chain_id: chainId,
        address: '', // Contract address not needed here
        loan_id: loanId,
        borrower_address: loanDetails.borrower,
        collateral_address: loanDetails.collateralToken,
        collateral_token_id: Number(loanDetails.collateralTokenId),
        loan_amount: Number(loanDetails.principal) / 1e6, // Convert from wei to USDC
        interest_rate: Number(loanDetails.interestRate) / 100, // Convert from basis points
        term_days: Number(loanDetails.duration) / (24 * 60 * 60), // Convert from seconds to days
        start_date: new Date(Number(loanDetails.startTime) * 1000).toISOString(),
        end_date: new Date(Number(loanDetails.endTime) * 1000).toISOString(),
        status: LoanStatus[loanDetails.status].toLowerCase(), // Convert enum to string
        stablecoin: loanDetails.stablecoin
      };

      // Update the loans state with the blockchain data
      setLoans(prevLoans => {
        // Create a map of existing loans by loan_id for quick lookup
        const existingLoansMap = new Map();

        // Only add loans with valid loan_id to the map
        prevLoans.forEach(loan => {
          if (loan.loan_id !== undefined) {
            existingLoansMap.set(loan.loan_id, loan);
          }
        });

        // Check if this loan already exists in the state
        const existingLoan = existingLoansMap.get(loanId);

        if (existingLoan) {
          // Update existing loan with blockchain data
          // This ensures we keep any additional data from the database
          return prevLoans.map(loan =>
            loan.loan_id === loanId ? { ...loan, ...blockchainLoan } : loan
          );
        } else {
          // Add new loan to the state
          return [...prevLoans, blockchainLoan];
        }
      });
    }, [loanDetails, loanId, address]);

    // This component doesn't render anything
    return null;
  };

  // Effect to create LoanDetailsFetcher components for each loan ID
  useEffect(() => {
    if (!borrowerLoanIds || !address) return;

    // Convert borrowerLoanIds to array of numbers for easier handling
    const loanIds = Array.isArray(borrowerLoanIds)
      ? borrowerLoanIds.map(id => Number(id))
      : [];

    console.log('Borrower loan IDs from blockchain:', loanIds);

    // Create a temporary array of loan IDs to ensure the LoanDetailsFetcher components are created
    if (loanIds.length > 0) {
      // We don't need to create temporary loan objects anymore
      // The LoanDetailsFetcher components will fetch and update the loan data directly
      // Just log the loan IDs for debugging
      console.log('Processing blockchain loan IDs:', loanIds);
    }
  }, [borrowerLoanIds, address, chainId]);

  // No need for a separate loanDetailsFetchers variable since we render them directly

  // Function to handle "Activate Loan" button click

  // Effect to handle loan activation result (success or error)
  useEffect(() => {
    const handleActivationResult = async () => {
      // Handle success
      if (isActivationSuccess && activationTxHash) {
        // Update the loan status in the database
        const updateLoanStatus = async (loanId: number, txHash: string) => {
          try {
            const response = await fetch('/api/loan-activate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                loanId,
                txHash,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to update loan status');
            }

            // Show success toast
            toast.success(
              <div>
                Loan activated successfully!
                <a
                  href={getTransactionUrl(activationTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline ml-1"
                >
                  View transaction
                </a>
              </div>,
              { autoClose: 5000 }
            );

            // Refresh the loans data using the API
            if (address) {
              const loansResponse = await fetch(`/api/loans/user/${address}?chainId=${chainId}`);
              const loansData = await loansResponse.json();

              if (loansResponse.ok) {
                setLoans(loansData.loans || []);
              } else {
                console.error('Error refreshing loans data:', loansData.error);
              }
            }
          } catch (error) {
            console.error('Error updating loan status:', error);
            toast.error('Failed to update loan status in the database');
          }
        };

        // Find the loan that was being activated
        const activatingLoan = loans.find((loan: Loan) => loan.status === 'pending');
        if (activatingLoan && activatingLoan.loan_id) {
          updateLoanStatus(activatingLoan.loan_id, activationTxHash);
        }
      }

      // Handle error
      if (activationError) {
        console.error('Activation transaction error:', activationError);

        let errorMessage = 'Transaction failed. Please try again.';

        // Extract more specific error message if available
        if (activationError.message) {
          if (activationError.message.includes('execution reverted')) {
            // Check for common revert reasons
            if (activationError.message.includes('LoanOrigination: Loan is not pending')) {
              errorMessage = 'This loan is no longer in pending status. It may have already been activated.';
            } else if (activationError.message.includes('Not the borrower')) {
              errorMessage = 'Only the borrower can activate this loan.';
            } else if (activationError.message.includes('Failed to deposit collateral')) {
              errorMessage = 'Failed to deposit collateral. Please check that your policy token is approved.';
            } else {
              // Try to extract the revert reason
              const match = activationError.message.match(/execution reverted: ([^"]*)/i);
              if (match && match[1]) {
                errorMessage = `Transaction reverted: ${match[1]}`;
              } else {
                errorMessage = 'Transaction reverted by the contract';
              }
            }
          } else {
            errorMessage = activationError.message;
          }
        }

        toast.error(errorMessage);

        // Refresh the loans data to get the latest status
        if (address) {
          try {
            const loansResponse = await fetch(`/api/loans/user/${address}?chainId=${chainId}`);
            const loansData = await loansResponse.json();

            if (loansResponse.ok) {
              setLoans(loansData.loans || []);
            }
          } catch (refreshError) {
            console.error('Error refreshing loans after error:', refreshError);
          }
        }
      }

  };

  handleActivationResult();
  }, [isActivationSuccess, activationTxHash, activationError, loans, address, chainId]);

  // Format metrics for display
  const metricsDisplay = [
    {
      title: "Total Policy Value",
      value: `$${metrics.totalPolicyValue.toLocaleString()}`,
      subtitle: `${metrics.totalPolicies} Tokenized ${metrics.totalPolicies === 1 ? 'Policy' : 'Policies'}`,
      icon: <FileText className="h-5 w-5 text-gray-500" />
    },
    {
      title: "Active Loans",
      value: `$${metrics.totalLoanValue.toLocaleString()}`,
      subtitle: `${metrics.totalLoans} Active ${metrics.totalLoans === 1 ? 'Loan' : 'Loans'}`,
      icon: <FileText className="h-5 w-5 text-gray-500" />
    },
    {
      title: "Available Borrowing Power",
      value: `$${metrics.availableBorrowingPower.toLocaleString()}`,
      subtitle: `${metrics.availablePercentage.toFixed(0)}% Available`,
      icon: <TrendingUp className="h-5 w-5 text-gray-500" />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render loan detail fetchers (invisible components) */}
      {borrowerLoanIds && Array.isArray(borrowerLoanIds) ?
        borrowerLoanIds.map(id => (
          <LoanDetailsFetcher key={Number(id)} loanId={Number(id)} />
        ))
        : null
      }

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage tokenized policies and loans
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {loading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex items-center justify-between">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))
        ) : (
          // Actual metrics
          metricsDisplay.map((metric) => (
            <Card key={metric.title} className="p-6">
              <div className="space-y-2">
                <p className="text-gray-600">{metric.title}</p>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">{metric.value}</h2>
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {metric.icon}
                  </div>
                </div>
                <p className="text-gray-600">{metric.subtitle}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'policies'
              ? 'border border-blue-600 text-blue-600 rounded-full bg-blue-50'
              : 'text-gray-600'
          }`}
        >
          Tokenized Policies
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'loans'
              ? 'border border-blue-600 text-blue-600 rounded-full bg-blue-50'
              : 'text-gray-600'
          }`}
        >
          Loans
        </button>

      </div>

      {/* Content based on active tab */}
      {activeTab === 'policies' && (
        // Tokenized Policies List
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-8">
              <p>No policies found. Start by tokenizing a policy.</p>
              <Button
                variant="outline"
                size="lg"
                className="mt-4"
                onClick={() => router.push('/app/tokenize')}
              >
                Tokenize Policy
              </Button>
            </div>
          ) : (
            policies.map((policy) => {
              const isAvailable = policy.status === 'active';
              return (
                <Card key={policy.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Policy {formatAddress(policy.address)}</h3>
                        <Badge
                          variant={isAvailable ? "default" : "secondary"}
                          className={isAvailable ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                        >
                          {isAvailable ? 'Available' : 'Used as Collateral'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">Policy: {policy.policy_number} {policy.token_id ? `(Token ID: ${policy.token_id})` : ''}</p>
                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <p className="text-gray-600">Value</p>
                          <p className="font-semibold">${policy.face_value.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tokenized On</p>
                          <p className="font-semibold">{new Date(policy.tokenized_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expires On</p>
                          <p className="font-semibold">{new Date(policy.expiry_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {isAvailable && (
                        <Button
                          variant="outline"
                          className="text-blue-600 border-blue-600"
                          onClick={() => handleUseAsCollateral(policy.address, policy.chain_id)}
                        >
                          Use as Collateral
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/app/policy/${policy.address}?chainId=${policy.chain_id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}

          <div className="flex justify-center mt-6">
            <Button variant="outline" size="lg">
              Tokenize Policy
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        // Loans List
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array(2).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded w-28"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {Array(4).fill(0).map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-5 bg-gray-200 rounded w-24"></div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-8">
              <p>No loans found. Start by using a policy as collateral.</p>
              <Button
                variant="outline"
                size="lg"
                className="mt-4"
                onClick={() => setActiveTab('policies')}
              >
                View Policies
              </Button>
            </div>
          ) : (
            loans.map((loan) => {
              // Find the associated policy
              const policy = policies.find(p => p.address === loan.collateral_address);

              // Calculate days remaining
              const endDate = new Date(loan.end_date);
              const today = new Date();
              const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

              // Calculate repayment amount (principal + interest)
              const interestAmount = (loan.loan_amount * loan.interest_rate / 100) * (loan.term_days / 365);
              const repaymentAmount = loan.loan_amount + interestAmount;

              // Determine loan status
              let statusDisplay = loan.status;
              let statusClass = "bg-blue-100 text-blue-800";

              if (loan.status === 'active' && daysRemaining < 7) {
                statusDisplay = "Due Soon";
                statusClass = "bg-red-100 text-red-800";
              }

              // Create a unique key that combines loan_id and id
              const uniqueKey = loan.loan_id ? `loan-${loan.loan_id}` : `db-loan-${loan.id}`;

              return (
                <Card key={uniqueKey} className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Loan {formatAddress(loan.address)} {loan.loan_id ? `(ID: ${loan.loan_id})` : ''}</h3>
                        <Badge variant="secondary" className={statusClass}>
                          {statusDisplay}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-600">Collateral: Policy {formatAddress(loan.collateral_address)} {policy ? `(${policy.policy_number})` : ''} {loan.collateral_token_id ? `(Token ID: ${loan.collateral_token_id})` : ''}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-gray-600">Principal</p>
                        <p className="font-semibold">${loan.loan_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Interest Rate</p>
                        <p className="font-semibold">{loan.interest_rate.toFixed(2)}% APR</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Term</p>
                        <p className="font-semibold">{loan.term_days} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Repayment Amount</p>
                        <p className="font-semibold">${repaymentAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{new Date(loan.start_date).toLocaleDateString()}</span>
                        <span>{new Date(loan.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="h-2 w-full bg-blue-600 rounded-full" />
                      <div className="flex justify-end text-sm text-gray-600">
                        {daysRemaining} days remaining
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Liquidation Policy Notice */}
      <div className="bg-blue-50 p-4 rounded-lg mt-8">
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Liquidation Policy</h4>
            <p className="text-gray-600 mt-1">
              If a loan is not repaid by its due date, the collateralized policy NFT may be subject to liquidation. To avoid liquidation, please ensure timely repayment of all outstanding loans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  try {
    return (
      <WalletAuthCheck>
        <DashboardContent />
      </WalletAuthCheck>
    );
  } catch {
    // This error handling is only for build-time issues
    // At runtime, the component will work normally
    return (
      <WalletAuthCheck>
        <DashboardContent />
      </WalletAuthCheck>
    );
  }
}