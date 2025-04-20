'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { formatAddress } from '@/utils/explorer';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

// Define types for our data
type Policy = {
  id: number;
  chain_id: number;
  address: string; // On-chain policy token address
  policy_number: string;
  face_value: number;
  expiry_date: string;
  tokenized_date: string;
  owner_address: string;
  issuer: string;
  policy_type: string;
  status: string;
};

type Loan = {
  id: number;
  chain_id: number;
  address: string; // On-chain loan address
  borrower_address: string;
  collateral_address: string; // Policy token address used as collateral
  loan_amount: number;
  interest_rate: number;
  term_days: number;
  start_date: string;
  end_date: string;
  status: string;
};

function DashboardContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'policies' | 'loans'>('policies');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState({
    totalPolicyValue: 0,
    totalPolicies: 0,
    totalLoanValue: 0,
    totalLoans: 0,
    availableBorrowingPower: 0,
    availablePercentage: 0
  });

  // Fetch policies and loans from Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch policies
        const { data: policiesData, error: policiesError } = await supabase
          .from('policies')
          .select('*')
          .order('created_at', { ascending: false });

        if (policiesError) {
          console.error('Error fetching policies:', policiesError);
          return;
        }

        // Fetch loans
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .order('created_at', { ascending: false });

        if (loansError) {
          console.error('Error fetching loans:', loansError);
          return;
        }

        // Set the data
        setPolicies(policiesData || []);
        setLoans(loansData || []);

        // Calculate metrics
        const totalPolicyValue = policiesData?.reduce((sum, policy) => sum + policy.face_value, 0) || 0;
        const availablePolicies = policiesData?.filter(p => p.status === 'active') || [];
        const availablePolicyValue = availablePolicies.reduce((sum, policy) => sum + policy.face_value, 0) || 0;
        const totalLoanValue = loansData?.reduce((sum, loan) => sum + loan.loan_amount, 0) || 0;

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
  }, []);

  // Function to handle "Use as Collateral" button click
  const handleUseAsCollateral = (policyAddress: string, chainId: number) => {
    router.push(`/app/loan?policyAddress=${policyAddress}&chainId=${chainId}`);
  };

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
                      <p className="text-gray-600">Policy: {policy.policy_number}</p>
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

              return (
                <Card key={loan.id} className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Loan {formatAddress(loan.address)}</h3>
                        <Badge variant="secondary" className={statusClass}>
                          {statusDisplay}
                        </Badge>
                      </div>
                      {loan.status === 'active' && (
                        <Button className="bg-primary text-white">
                          Repay Loan
                        </Button>
                      )}
                    </div>

                    <p className="text-gray-600">Collateral: Policy {formatAddress(loan.collateral_address)} {policy ? `(${policy.policy_number})` : ''}</p>

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