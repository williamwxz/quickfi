'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';

// Sample data for tokenized policies
const SAMPLE_POLICIES = [
  { id: 'NFT-001', policyNumber: 'POL-123456', value: 100000, expiryDate: '2026-05-20' },
  { id: 'NFT-002', policyNumber: 'POL-789012', value: 50000, expiryDate: '2025-12-10' },
  { id: 'NFT-003', policyNumber: 'POL-345678', value: 75000, expiryDate: '2027-03-15' },
];

const LoanClient = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<number>(30);

  // LTV = Loan to Value ratio
  const ltv = selectedPolicy 
    ? (loanAmount / (SAMPLE_POLICIES.find(p => p.id === selectedPolicy)?.value || 1)) * 100
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
    console.log({
      selectedPolicy,
      loanAmount,
      loanTerm,
      ltv,
      interestRate,
      repaymentAmount,
      dueDate
    });
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
                    
                    <RadioGroup value={selectedPolicy || ''} onValueChange={setSelectedPolicy}>
                      <div className="space-y-4">
                        {SAMPLE_POLICIES.map((policy) => (
                          <div key={policy.id} className="flex items-center space-x-3 p-4 rounded-lg border">
                            <RadioGroupItem value={policy.id} id={policy.id} />
                            <Label htmlFor={policy.id} className="flex flex-1 justify-between cursor-pointer">
                              <div>
                                <div className="font-medium">{policy.id}</div>
                                <div className="text-sm text-gray-500">Policy: {policy.policyNumber}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${policy.value.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">
                                  Expires: {new Date(policy.expiryDate).toLocaleDateString()}
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
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
                            You can borrow up to 70% of your policy's value. Interest is calculated
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

export default function LoanPage() {
  return <LoanClient />;
} 