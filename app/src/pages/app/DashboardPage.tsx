
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Calendar, CreditCard, FileText, ArrowRight, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';

// Sample data for dashboard
const SAMPLE_POLICIES = [
  { 
    id: 'NFT-001', 
    policyNumber: 'POL-123456', 
    value: 100000, 
    expiryDate: '2026-05-20', 
    createdAt: '2023-11-15',
    status: 'active'
  },
  { 
    id: 'NFT-002', 
    policyNumber: 'POL-789012', 
    value: 50000, 
    expiryDate: '2025-12-10', 
    createdAt: '2023-12-03',
    status: 'collateralized'
  },
  { 
    id: 'NFT-003', 
    policyNumber: 'POL-345678', 
    value: 75000, 
    expiryDate: '2027-03-15', 
    createdAt: '2024-01-22',
    status: 'active'
  },
];

const SAMPLE_LOANS = [
  {
    id: 'LOAN-001',
    tokenId: 'NFT-002',
    amount: 25000,
    term: 90,
    startDate: '2024-02-15',
    dueDate: '2024-05-15',
    interestRate: 7.5,
    repaymentAmount: 25468.75,
    status: 'active',
  }
];

const DashboardPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRepayLoan = async (loanId: string) => {
    setIsProcessing(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Loan repaid successfully!');
    } catch (error) {
      toast.error('Failed to repay loan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate dashboard statistics
  const totalPoliciesValue = SAMPLE_POLICIES.reduce((sum, policy) => sum + policy.value, 0);
  const totalLoansValue = SAMPLE_LOANS.reduce((sum, loan) => sum + loan.amount, 0);
  const availableBorrowingPower = totalPoliciesValue * 0.7 - totalLoansValue;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-quickfi-slate mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your tokenized policies and loans</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Policy Value</CardDescription>
            <CardTitle className="text-2xl font-bold">${totalPoliciesValue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-1" />
              {SAMPLE_POLICIES.length} Tokenized {SAMPLE_POLICIES.length === 1 ? 'Policy' : 'Policies'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Loans</CardDescription>
            <CardTitle className="text-2xl font-bold">${totalLoansValue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 mr-1" />
              {SAMPLE_LOANS.length} Active {SAMPLE_LOANS.length === 1 ? 'Loan' : 'Loans'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Borrowing Power</CardDescription>
            <CardTitle className="text-2xl font-bold">${availableBorrowingPower.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <BarChart className="h-4 w-4 mr-1" />
              {(availableBorrowingPower / (totalPoliciesValue * 0.7) * 100).toFixed(0)}% Available
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies">
        <TabsList className="mb-6">
          <TabsTrigger value="policies">My Tokenized Policies</TabsTrigger>
          <TabsTrigger value="loans">My Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          {SAMPLE_POLICIES.length > 0 ? (
            SAMPLE_POLICIES.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-1">
                        <h3 className="font-semibold text-lg mr-2">{policy.id}</h3>
                        <Badge 
                          className={policy.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}
                        >
                          {policy.status === 'active' ? 'Available' : 'Used as Collateral'}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground text-sm mb-2">Policy: {policy.policyNumber}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Value</p>
                          <p className="font-medium">${policy.value.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tokenized On</p>
                          <p className="font-medium">{new Date(policy.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expires On</p>
                          <p className="font-medium">{new Date(policy.expiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {policy.status === 'active' && (
                        <Button 
                          variant="outline" 
                          className="text-quickfi-blue border-quickfi-blue"
                          onClick={() => window.location.href = '/app/loan'}
                        >
                          Use as Collateral
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <div className="mb-4">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tokenized Policies Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Tokenize your first insurance policy to get started with QuickFi
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/app/tokenize'}
                  className="bg-quickfi-blue hover:bg-quickfi-darkBlue text-white"
                >
                  Tokenize a Policy
                </Button>
              </CardContent>
            </Card>
          )}
          
          {SAMPLE_POLICIES.length > 0 && (
            <div className="text-center">
              <Button variant="outline" onClick={() => window.location.href = '/app/tokenize'}>
                Tokenize Another Policy
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          {SAMPLE_LOANS.length > 0 ? (
            SAMPLE_LOANS.map((loan) => {
              const now = new Date();
              const dueDate = new Date(loan.dueDate);
              const startDate = new Date(loan.startDate);
              
              // Calculate progress percentage
              const totalDuration = dueDate.getTime() - startDate.getTime();
              const elapsedDuration = now.getTime() - startDate.getTime();
              const progressPercentage = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
              
              // Get corresponding policy
              const relatedPolicy = SAMPLE_POLICIES.find(p => p.id === loan.tokenId);

              return (
                <Card key={loan.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center mb-1">
                          <h3 className="font-semibold text-lg mr-2">{loan.id}</h3>
                          <Badge 
                            className={
                              progressPercentage > 90 ? 'bg-red-100 text-red-800 hover:bg-red-100' : 
                              progressPercentage > 70 ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                              'bg-green-100 text-green-800 hover:bg-green-100'
                            }
                          >
                            {progressPercentage > 90 ? 'Due Soon' : 'Active'}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground text-sm">
                          Collateral: {loan.tokenId} ({relatedPolicy?.policyNumber})
                        </p>
                      </div>

                      <div className="mt-4 md:mt-0">
                        <Button
                          onClick={() => handleRepayLoan(loan.id)}
                          disabled={isProcessing}
                          className="bg-quickfi-blue hover:bg-quickfi-darkBlue text-white"
                        >
                          {isProcessing ? 'Processing...' : 'Repay Loan'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Principal</p>
                        <p className="font-medium">${loan.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <p className="font-medium">{loan.interestRate}% APR</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Term</p>
                        <p className="font-medium">{loan.term} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Repayment Amount</p>
                        <p className="font-medium">${loan.repaymentAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>{new Date(loan.startDate).toLocaleDateString()}</span>
                        <span>{new Date(loan.dueDate).toLocaleDateString()}</span>
                      </div>
                      <Progress value={progressPercentage} />
                      <div className="flex justify-end mt-1">
                        <div className="text-sm flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <div className="mb-4">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Loans</h3>
                  <p className="text-muted-foreground mb-6">
                    Apply for a loan using your tokenized policies as collateral
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/app/loan'}
                  className="bg-quickfi-blue hover:bg-quickfi-darkBlue text-white"
                >
                  Apply for a Loan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {SAMPLE_LOANS.length > 0 && (
        <div className="mt-8 bg-blue-50 p-4 rounded-lg flex items-start">
          <Info className="text-quickfi-blue h-5 w-5 shrink-0 mt-0.5 mr-3" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-quickfi-slate mb-1">Liquidation Policy</p>
            <p>If a loan is not repaid by its due date, the collateralized policy NFT may be subject to liquidation. To avoid liquidation, please ensure timely repayment of all outstanding loans.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
