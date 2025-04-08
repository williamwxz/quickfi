
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

// Sample data for tokenized policies
const SAMPLE_POLICIES = [
  { id: 'NFT-001', policyNumber: 'POL-123456', value: 100000, expiryDate: '2026-05-20' },
  { id: 'NFT-002', policyNumber: 'POL-789012', value: 50000, expiryDate: '2025-12-10' },
  { id: 'NFT-003', policyNumber: 'POL-345678', value: 75000, expiryDate: '2027-03-15' },
];

const LoanPage: React.FC = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // LTV = Loan to Value ratio
  const ltv = selectedPolicy 
    ? (loanAmount / (SAMPLE_POLICIES.find(p => p.id === selectedPolicy)?.value || 1)) * 100
    : 0;
  
  // Calculate interest rate based on LTV (just an example formula)
  const interestRate = 5 + (ltv > 50 ? (ltv - 50) / 10 : 0);
  
  // Maximum loan amount is 70% of policy value
  const maxLoanAmount = selectedPolicy
    ? (SAMPLE_POLICIES.find(p => p.id === selectedPolicy)?.value || 0) * 0.7
    : 0;

  const handleLoanAmountChange = (value: number[]) => {
    setLoanAmount(value[0]);
  };

  const handleApplyForLoan = async () => {
    if (!selectedPolicy) {
      toast.error('Please select a tokenized policy');
      return;
    }
    
    if (loanAmount <= 0) {
      toast.error('Please enter a loan amount');
      return;
    }
    
    if (ltv > 70) {
      toast.error('Loan amount exceeds the maximum LTV ratio of 70%');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success response simulation
      toast.success('Loan application submitted successfully!');
      
    } catch (error) {
      toast.error('Failed to submit loan application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-quickfi-slate mb-2">Apply for a USDC Loan</h1>
        <p className="text-gray-600">Use your tokenized insurance policies as collateral</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Collateral</CardTitle>
              <CardDescription>
                Choose a tokenized policy to use as collateral for your loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RadioGroup 
                  value={selectedPolicy || ""}
                  onValueChange={setSelectedPolicy}
                >
                  {SAMPLE_POLICIES.map(policy => (
                    <div key={policy.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={policy.id} id={policy.id} />
                      <Label htmlFor={policy.id} className="flex flex-col sm:flex-row sm:items-center justify-between flex-grow p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                        <div>
                          <div className="font-medium">{policy.id}</div>
                          <div className="text-sm text-muted-foreground">Policy: {policy.policyNumber}</div>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <div className="font-medium">${policy.value.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Expires: {new Date(policy.expiryDate).toLocaleDateString()}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {SAMPLE_POLICIES.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You don't have any tokenized policies yet</p>
                    <Button variant="outline" onClick={() => window.location.href = '/app/tokenize'}>
                      Tokenize a Policy
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardHeader className="border-t">
              <CardTitle>Loan Details</CardTitle>
              <CardDescription>
                Select your loan amount and term
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loan-amount" className="mb-1 block">
                    Loan Amount (USDC)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>$0</span>
                      <span className="font-medium">${maxLoanAmount.toLocaleString()}</span>
                    </div>
                    {selectedPolicy ? (
                      <>
                        <Slider 
                          id="loan-amount"
                          min={0} 
                          max={maxLoanAmount} 
                          step={100}
                          value={[loanAmount]}
                          onValueChange={handleLoanAmountChange}
                          disabled={!selectedPolicy}
                        />
                        <div className="flex items-center mt-3">
                          <span className="text-lg font-medium mr-3">
                            ${loanAmount.toLocaleString()}
                          </span>
                          <Input 
                            className="w-28" 
                            type="number" 
                            value={loanAmount} 
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            min={0}
                            max={maxLoanAmount}
                            disabled={!selectedPolicy}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-5 bg-muted rounded animate-pulse" />
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="loan-term">Loan Term (Days)</Label>
                  <Select 
                    value={loanTerm} 
                    onValueChange={setLoanTerm}
                    disabled={!selectedPolicy}
                  >
                    <SelectTrigger id="loan-term" className="mt-1.5">
                      <SelectValue placeholder="Select a term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                <Info className="text-quickfi-blue h-5 w-5 shrink-0 mt-0.5 mr-3" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-quickfi-slate mb-1">Loan Terms</p>
                  <p>You can borrow up to 70% of your policy's value. Interest is calculated based on the LTV ratio and loan term. Repayment must be made before the due date to avoid liquidation of your NFT collateral.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collateral:</span>
                  <span className="font-medium">{selectedPolicy || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <span className="font-medium">${loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term:</span>
                  <span className="font-medium">{loanTerm} days</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LTV Ratio:</span>
                  <div className={`font-medium ${ltv > 70 ? 'text-red-500' : ltv > 50 ? 'text-amber-500' : 'text-green-500'}`}>
                    {ltv.toFixed(1)}%
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate (APR):</span>
                  <span className="font-medium">{interestRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Amount:</span>
                  <span className="font-medium">
                    ${((loanAmount * interestRate / 100) * (parseInt(loanTerm) / 365)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repayment Amount:</span>
                  <span className="font-semibold">
                    ${(loanAmount + (loanAmount * interestRate / 100) * (parseInt(loanTerm) / 365)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">
                    {new Date(Date.now() + parseInt(loanTerm) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleApplyForLoan}
                className="w-full bg-quickfi-blue hover:bg-quickfi-darkBlue text-white" 
                disabled={!selectedPolicy || loanAmount <= 0 || ltv > 70 || isSubmitting}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Processing...' : 'Apply for Loan'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoanPage;
