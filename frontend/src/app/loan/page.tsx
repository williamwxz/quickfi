'use client';

import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Image from 'next/image';

// Interfaces for our data types
interface InsurancePolicy {
  id: string;
  name: string;
  type: string;
  provider: string;
  value: number;
  imageUrl: string;
}

export default function LoanPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  
  const [step, setStep] = useState(1); // 1: Select Policy, 2: Loan Amount, 3: Confirmation
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(0);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  
  // Mock data for tokenized policies (this would come from the blockchain in the real app)
  const mockPolicies: InsurancePolicy[] = [
    {
      id: '123456789',
      name: 'Life Insurance Policy',
      type: 'life',
      provider: 'MetLife',
      value: 100000,
      imageUrl: 'https://placehold.co/150x150/3B82F6/FFFFFF?text=Policy',
    },
    {
      id: '987654321',
      name: 'Health Insurance Policy',
      type: 'health',
      provider: 'Blue Cross',
      value: 50000,
      imageUrl: 'https://placehold.co/150x150/10B981/FFFFFF?text=Policy',
    },
  ];
  
  // Calculate max loan amount (70% of policy value for this example)
  const calculateMaxLoanAmount = (policy: InsurancePolicy) => {
    return policy.value * 0.7;
  };
  
  const handlePolicySelect = (policy: InsurancePolicy) => {
    setSelectedPolicy(policy);
    setMaxLoanAmount(calculateMaxLoanAmount(policy));
    // Set initial loan amount to 50% of max as a default
    setLoanAmount(calculateMaxLoanAmount(policy) * 0.5);
  };
  
  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value);
    setLoanAmount(amount);
  };
  
  const handleLoanTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const term = parseInt(e.target.value);
    setLoanTermMonths(term);
    
    // Adjust interest rate based on term (just for demo purposes)
    if (term <= 6) {
      setInterestRate(4.5);
    } else if (term <= 12) {
      setInterestRate(5.5);
    } else {
      setInterestRate(6.5);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !selectedPolicy) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call your backend or directly interact with the smart contracts
      // to deposit the token as collateral and receive the loan
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Move to confirmation step
      setStep(3);
    } catch (error) {
      console.error('Error processing loan:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate monthly payment (simple calculation for demo)
  const calculateMonthlyPayment = () => {
    const monthlyInterestRate = interestRate / 100 / 12;
    const payment = (loanAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -loanTermMonths));
    return payment.toFixed(2);
  };
  
  // Calculate total repayment amount
  const calculateTotalRepayment = () => {
    return (parseFloat(calculateMonthlyPayment()) * loanTermMonths).toFixed(2);
  };
  
  // LTV (Loan-to-Value) ratio
  const calculateLTV = () => {
    if (!selectedPolicy) return "0";
    return ((loanAmount / selectedPolicy.value) * 100).toFixed(1);
  };

  // Get risk level based on LTV
  const getRiskLevel = () => {
    const ltvValue = parseFloat(calculateLTV());
    if (ltvValue < 50) return "Low";
    if (ltvValue < 70) return "Medium";
    return "High";
  };

  // Get risk level color based on LTV
  const getRiskLevelColor = () => {
    const ltvValue = parseFloat(calculateLTV());
    if (ltvValue < 50) return "text-success";
    if (ltvValue < 70) return "text-warning";
    return "text-error";
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2 text-center">Get a USDC Loan</h1>
        <p className="text-center text-neutral-content max-w-2xl mx-auto mb-10">
          Use your tokenized insurance policies as collateral to obtain an instant USDC loan on the Pharos Network.
        </p>
        
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-10">
            <ul className="steps steps-horizontal w-full">
              <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Select Collateral</li>
              <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Loan Terms</li>
              <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Confirmation</li>
            </ul>
          </div>
          
          <Card className="shadow-md">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Select an Insurance Policy as Collateral</h2>
                
                {mockPolicies.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="mb-4">You don&apos;t have any tokenized insurance policies yet.</p>
                    <Button onClick={() => router.push('/tokenize')}>
                      Tokenize a Policy
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="mb-6 text-neutral-content">
                      Select one of your tokenized insurance policies to use as collateral for your loan.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      {mockPolicies.map((policy) => (
                        <div 
                          key={policy.id}
                          className={`
                            border rounded-lg p-4 cursor-pointer flex items-center
                            ${selectedPolicy?.id === policy.id ? 'border-primary bg-primary/5' : 'border-base-300'}
                          `}
                          onClick={() => handlePolicySelect(policy)}
                        >
                          <div className="flex-shrink-0 mr-4">
                            <Image 
                              src={policy.imageUrl} 
                              alt={policy.name}
                              width={100}
                              height={100}
                              className="rounded-lg"
                              sizes="100px"
                              priority
                            />
                          </div>
                          
                          <div className="flex-grow">
                            <h3 className="font-medium">{policy.name}</h3>
                            <p className="text-sm text-neutral-content">
                              Provider: {policy.provider}
                            </p>
                            <p className="text-sm text-neutral-content">
                              Type: {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium">${policy.value.toLocaleString()}</p>
                            <p className="text-sm text-neutral-content">
                              Max Loan: ${calculateMaxLoanAmount(policy).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => selectedPolicy && setStep(2)}
                        disabled={!selectedPolicy}
                      >
                        Continue
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {step === 2 && selectedPolicy && (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-4">Specify Loan Details</h2>
                
                <div className="mb-6">
                  <div className="p-4 bg-base-200 rounded-lg mb-6">
                    <h3 className="font-medium mb-2">Selected Collateral</h3>
                    <div className="flex items-center">
                      <Image 
                        src={selectedPolicy.imageUrl} 
                        alt={selectedPolicy.name}
                        width={100}
                        height={100}
                        className="rounded-lg"
                        sizes="100px"
                        priority
                      />
                      <div>
                        <p className="font-medium">{selectedPolicy.name}</p>
                        <p className="text-sm text-neutral-content">
                          Value: ${selectedPolicy.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Loan Amount (USDC)</span>
                      <span className="label-text-alt">
                        Max: ${maxLoanAmount.toLocaleString()}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="100"
                      max={maxLoanAmount}
                      value={loanAmount}
                      onChange={handleLoanAmountChange}
                      className="range range-primary"
                      step="100"
                    />
                    <div className="w-full flex justify-between text-xs px-2 mt-1">
                      <span>$100</span>
                      <span>${(maxLoanAmount / 2).toFixed(0)}</span>
                      <span>${maxLoanAmount.toLocaleString()}</span>
                    </div>
                    <div className="mt-2">
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={handleLoanAmountChange}
                        min="100"
                        max={maxLoanAmount}
                        className="input input-bordered w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Loan Term</span>
                    </label>
                    <select
                      value={loanTermMonths}
                      onChange={handleLoanTermChange}
                      className="select select-bordered w-full"
                    >
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-base-200 rounded-lg">
                      <h4 className="font-medium mb-2">Loan Summary</h4>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span>Interest Rate:</span>
                          <span>{interestRate}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Monthly Payment:</span>
                          <span>${calculateMonthlyPayment()} USDC</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Total Repayment:</span>
                          <span>${calculateTotalRepayment()} USDC</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-base-200 rounded-lg">
                      <h4 className="font-medium mb-2">Risk Assessment</h4>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span>LTV Ratio:</span>
                          <span>{calculateLTV()}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Liquidation Threshold:</span>
                          <span>85%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className={`font-medium ${getRiskLevelColor()}`}>
                            {getRiskLevel()}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" isLoading={isLoading}>
                    Apply for Loan
                  </Button>
                </div>
              </form>
            )}
            
            {step === 3 && selectedPolicy && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-success p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mb-4">Loan Successfully Approved!</h2>
                <p className="mb-6 text-neutral-content">
                  Your loan has been approved and the USDC has been transferred to your wallet.
                </p>
                
                <div className="card bg-base-200 p-4 mb-6 mx-auto max-w-md">
                  <h3 className="font-medium mb-2">Loan Details</h3>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex justify-between">
                      <span>Loan ID:</span>
                      <span>L-{Math.floor(Math.random() * 1000000)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Amount:</span>
                      <span>${loanAmount.toLocaleString()} USDC</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Term:</span>
                      <span>{loanTermMonths} Months</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span>{interestRate}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Monthly Payment:</span>
                      <span>${calculateMonthlyPayment()} USDC</span>
                    </li>
                    <li className="flex justify-between">
                      <span>First Payment Due:</span>
                      <span>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                  >
                    Back to Home
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 