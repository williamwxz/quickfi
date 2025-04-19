'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { LTV_PARAMS, SUPPORTED_STABLECOINS, DEFAULT_STABLECOIN } from '@/config/loanParams';
import { getTokenConfig } from '@/config/tokens';
import { useAccount } from 'wagmi';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

// Define the policy type
type Policy = {
  id: number;
  token_id: string;
  policy_number: string;
  face_value: number;
  expiry_date: string;
  owner_address: string;
  issuer: string;
  policy_type: string;
  status: string;
};

// Client component that uses useSearchParams
function LoanClientContent() {
  const searchParams = useSearchParams();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>(DEFAULT_STABLECOIN);

  // Fetch policies from Supabase
  useEffect(() => {
    async function fetchPolicies() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('policies')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching policies:', error);
          return;
        }

        if (data) {
          setPolicies(data as Policy[]);
        }
      } catch (error) {
        console.error('Error fetching policies:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, []);

  // Check for policyId in URL query parameters
  useEffect(() => {
    if (!searchParams) return;

    const policyId = searchParams.get('policyId');
    if (policyId && policies.length > 0) {
      // Check if the policy exists in our data
      const policyExists = policies.some(policy => policy.token_id === policyId);
      if (policyExists) {
        setSelectedPolicy(policyId);

        // Set initial loan amount to 50% of the policy value
        const policy = policies.find(p => p.token_id === policyId);
        if (policy) {
          setLoanAmount(policy.face_value * 0.5);
        }
      }
    }
  }, [searchParams, policies]);

  // LTV = Loan to Value ratio
  const ltv = selectedPolicy
    ? (loanAmount / (policies.find(p => p.token_id === selectedPolicy)?.face_value || 1)) * 100
    : 0;

  // Check if LTV exceeds maximum
  const isLtvExceeded = ltv > LTV_PARAMS.MAX_LTV;
  const isLtvWarning = ltv > LTV_PARAMS.WARNING_THRESHOLD && ltv <= LTV_PARAMS.MAX_LTV;

  // Interest rate is fixed at 5% APR
  const interestRate = 5.00;

  // Calculate interest amount
  const interestAmount = (loanAmount * interestRate / 100) * (loanTerm / 365);

  // Calculate repayment amount
  const repaymentAmount = loanAmount + interestAmount;

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanTerm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPolicy) {
      alert('Please select a policy to use as collateral');
      return;
    }

    try {
      // Generate a unique loan ID
      const loanId = `LOAN-${Date.now()}`;

      // Get the selected policy
      const policy = policies.find(p => p.token_id === selectedPolicy);

      if (!policy) {
        alert('Selected policy not found');
        return;
      }

      // Insert the loan into Supabase
      const { error } = await supabase
        .from('loans')
        .insert([
          {
            loan_id: loanId,
            borrower_address: policy.owner_address,
            collateral_token_id: policy.token_id,
            loan_amount: loanAmount,
            interest_rate: interestRate,
            term_days: loanTerm,
            start_date: new Date().toISOString(),
            end_date: dueDate.toISOString(),
            status: 'pending',
            stablecoin: selectedStablecoin
          }
        ]);

      if (error) {
        console.error('Error creating loan:', error);
        alert('Failed to create loan. Please try again.');
        return;
      }

      // Update the policy status to 'used_as_collateral'
      const { error: policyError } = await supabase
        .from('policies')
        .update({ status: 'used_as_collateral' })
        .eq('token_id', policy.token_id);

      if (policyError) {
        console.error('Error updating policy status:', policyError);
      }

      alert('Loan application submitted successfully!');

      // Redirect to dashboard or loan details page
      window.location.href = '/app/dashboard';
    } catch (error) {
      console.error('Error submitting loan application:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Apply for a Stablecoin Loan</h1>
        <p className="text-gray-600">Use your tokenized insurance policies as collateral</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Select Collateral</h2>
                    <p className="text-sm text-gray-500 mb-4">Choose a tokenized policy to use as collateral for your loan</p>

                    {loading ? (
                      <div className="text-center py-8">
                        <p>Loading policies...</p>
                      </div>
                    ) : policies.length === 0 ? (
                      <div className="text-center py-8">
                        <p>No active policies found. Please tokenize a policy first.</p>
                      </div>
                    ) : (
                      <RadioGroup value={selectedPolicy || ''} onValueChange={setSelectedPolicy}>
                        <div className="space-y-4">
                          {policies.map((policy) => (
                            <div key={policy.token_id} className="flex items-center space-x-3 p-4 rounded-lg border">
                              <RadioGroupItem value={policy.token_id} id={policy.token_id} />
                              <Label htmlFor={policy.token_id} className="flex flex-1 justify-between cursor-pointer">
                                <div>
                                  <div className="font-medium">Token #{policy.token_id}</div>
                                  <div className="text-sm text-gray-500">Policy: {policy.policy_number}</div>
                                  <div className="text-sm text-gray-500">Issuer: {policy.issuer}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">${policy.face_value.toLocaleString()}</div>
                                  <div className="text-sm text-gray-500">
                                    Expires: {new Date(policy.expiry_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
                    <p className="text-sm text-gray-500 mb-4">Select your loan amount and term</p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="stablecoin">Stablecoin</Label>
                        <div className="relative mt-1">
                          <Select.Root value={selectedStablecoin} onValueChange={setSelectedStablecoin}>
                            <Select.Trigger
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              aria-label="Stablecoin"
                            >
                              <Select.Value placeholder="Select stablecoin">
                                {selectedStablecoin && (
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={getTokenConfig(selectedStablecoin).logoUrl}
                                      alt={selectedStablecoin}
                                      width={20}
                                      height={20}
                                    />
                                    {selectedStablecoin}
                                  </div>
                                )}
                              </Select.Value>
                              <Select.Icon>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content
                                className="overflow-hidden bg-white rounded-md shadow-lg z-50 border"
                                position="popper"
                              >
                                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                                  <ChevronUp className="h-4 w-4" />
                                </Select.ScrollUpButton>
                                <Select.Viewport className="p-1">
                                  {SUPPORTED_STABLECOINS.map((coin) => (
                                    <Select.Item
                                      key={coin}
                                      value={coin}
                                      className="relative flex items-center px-8 py-2 rounded-sm text-sm data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 outline-none cursor-pointer"
                                    >
                                      <Select.ItemText>
                                        <div className="flex items-center gap-2">
                                          <Image
                                            src={getTokenConfig(coin).logoUrl}
                                            alt={coin}
                                            width={20}
                                            height={20}
                                          />
                                          {coin}
                                        </div>
                                      </Select.ItemText>
                                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                                        <Check className="h-4 w-4" />
                                      </Select.ItemIndicator>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                                  <ChevronDown className="h-4 w-4" />
                                </Select.ScrollDownButton>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="loanAmount">Loan Amount ({selectedStablecoin})</Label>
                        <Input
                          id="loanAmount"
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                          min="0"
                          step="100"
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="loanTerm">Loan Term (Days)</Label>
                        <Input
                          id="loanTerm"
                          type="number"
                          value={loanTerm}
                          onChange={(e) => setLoanTerm(Number(e.target.value))}
                          placeholder="30"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mt-6">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium">Loan Terms</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            The total loan amount can be up to {LTV_PARAMS.MAX_LTV}% of the policy&apos;s cash value. As interest accrues,
                            the total loan amount increases as well. When it exceeds {LTV_PARAMS.LIQUIDATION_THRESHOLD}% of the cash value,
                            the platform will trigger the liquidation mechanism.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Loan Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Collateral:</span>
                  <span className="font-medium">{selectedPolicy || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loan Amount:</span>
                  <span className="font-medium">${loanAmount.toLocaleString()} {selectedStablecoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Term:</span>
                  <span className="font-medium">{loanTerm} days</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">LTV Ratio:</span>
                  <span className={`font-medium ${
                    isLtvExceeded ? 'text-red-500' : isLtvWarning ? 'text-amber-500' : 'text-green-500'
                  }`}>
                    {ltv.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest Rate (APR):</span>
                  <span className="font-medium">{interestRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest Amount:</span>
                  <span className="font-medium">${interestAmount.toFixed(2)} {selectedStablecoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Repayment Amount:</span>
                  <span className="font-semibold">${repaymentAmount.toFixed(2)} {selectedStablecoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium">{dueDate.toLocaleDateString()}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1D4ED8] hover:bg-blue-700 text-white mt-4"
                  disabled={!selectedPolicy || loanAmount <= 0 || ltv > LTV_PARAMS.MAX_LTV}
                  onClick={handleSubmit}
                >
                  Apply for {selectedStablecoin} Loan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// This is a client component that checks if the user is connected
function ClientLoanPage() {
  const { isConnected } = useAccount();

  // If the user is not connected, we'll show the WalletAuthCheck component
  // which will handle showing the connect wallet UI
  if (!isConnected) {
    return (
      <WalletAuthCheck>
        <div></div>
      </WalletAuthCheck>
    );
  }

  // If the user is connected, we'll show the loan content
  return <LoanClientContent />;
}

export default function LoanPage() {
  return <ClientLoanPage />;
}