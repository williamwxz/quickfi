'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';

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

const LoanClient = () => {
  const searchParams = useSearchParams();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
            status: 'pending'
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
        <h1 className="text-3xl font-bold mb-2">Apply for a USDC Loan</h1>
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
                        <Label htmlFor="loanAmount">Loan Amount (USDC)</Label>
                        <Input
                          id="loanAmount"
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(Number(e.target.value))}
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
                            You can borrow up to 70% of your policy&apos;s value. Interest is calculated
                            based on the LTV ratio and loan term. Repayment must be made before
                            the due date to avoid liquidation of your NFT collateral.
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
                  <span className="font-medium">${loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Term:</span>
                  <span className="font-medium">{loanTerm} days</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">LTV Ratio:</span>
                  <span className={`font-medium ${
                    ltv > 70 ? 'text-red-500' : ltv > 50 ? 'text-amber-500' : 'text-green-500'
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
                  <span className="font-medium">${interestAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Repayment Amount:</span>
                  <span className="font-semibold">${repaymentAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium">{dueDate.toLocaleDateString()}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1D4ED8] hover:bg-blue-700 text-white mt-4"
                  disabled={!selectedPolicy || loanAmount <= 0 || ltv > 70}
                  onClick={handleSubmit}
                >
                  Apply for Loan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that uses Suspense for useSearchParams
function LoanClientWrapper() {
  return (
    <WalletAuthCheck>
      <Suspense fallback={<div className="p-8 text-center">Loading loan application...</div>}>
        <LoanClient />
      </Suspense>
    </WalletAuthCheck>
  );
}

export default function LoanPage() {
  try {
    return <LoanClientWrapper />;
  } catch {
    // This error handling is only for build-time issues
    // At runtime, the component will work normally
    return <LoanClientWrapper />;
  }
}