'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Image from 'next/image';

// Mock data interfaces
interface InsurancePolicy {
  id: string;
  name: string;
  type: string;
  provider: string;
  value: number;
  expiryDate: string;
  imageUrl: string;
}

interface Loan {
  id: string;
  policyId: string;
  amount: number;
  term: number;
  interestRate: number;
  startDate: string;
  nextPaymentDate: string;
  remainingPayments: number;
  status: 'active' | 'paid' | 'defaulted';
}

function DashboardContent() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'loans' | 'policies'>('loans');
  
  // Mock data for tokenized policies
  const mockPolicies: InsurancePolicy[] = [
    {
      id: '123456789',
      name: 'Life Insurance Policy',
      type: 'life',
      provider: 'MetLife',
      value: 100000,
      expiryDate: '2030-12-31',
      imageUrl: 'https://placehold.co/150x150/3B82F6/FFFFFF?text=Policy',
    },
    {
      id: '987654321',
      name: 'Health Insurance Policy',
      type: 'health',
      provider: 'Blue Cross',
      value: 50000,
      expiryDate: '2025-06-30',
      imageUrl: 'https://placehold.co/150x150/10B981/FFFFFF?text=Policy',
    },
  ];
  
  // Mock data for loans
  const mockLoans: Loan[] = [
    {
      id: 'L-123456',
      policyId: '123456789',
      amount: 50000,
      term: 12,
      interestRate: 5.5,
      startDate: '2023-01-15',
      nextPaymentDate: '2023-06-15',
      remainingPayments: 8,
      status: 'active',
    },
  ];
  
  // Find policy by ID
  const getPolicyById = (id: string) => {
    return mockPolicies.find(policy => policy.id === id);
  };
  
  // Calculate monthly payment
  const calculateMonthlyPayment = (loan: Loan) => {
    const monthlyInterestRate = loan.interestRate / 100 / 12;
    const payment = (loan.amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -loan.term));
    return payment.toFixed(2);
  };
  
  // Calculate total remaining balance
  const calculateRemainingBalance = (loan: Loan) => {
    const monthlyPayment = parseFloat(calculateMonthlyPayment(loan));
    return (monthlyPayment * loan.remainingPayments).toFixed(2);
  };
  
  // Calculate progress percentage
  const calculateProgress = (loan: Loan) => {
    return (((loan.term - loan.remainingPayments) / loan.term) * 100).toFixed(0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Check if the wallet is connected, if not display a message
  if (!isConnected) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-6">Connect Your Wallet</h1>
          <p className="mb-8 max-w-md mx-auto">
            Please connect your wallet to view your dashboard and manage your tokenized policies and loans.
          </p>
          <div className="flex justify-center">
            {/* The RainbowKit ConnectButton will be visible in the header */}
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-neutral-content max-w-2xl mb-8">
          Manage your tokenized insurance policies and active loans from one place.
        </p>
        
        {/* Wallet Info */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Wallet</h2>
              <p className="text-sm text-neutral-content break-all">
                {address}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                onClick={() => router.push('/tokenize')}
                variant="outline"
                className="mr-2"
              >
                Tokenize Policy
              </Button>
              <Button
                onClick={() => router.push('/loan')}
              >
                Get a Loan
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <a 
            className={`tab ${activeTab === 'loans' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            My Loans
          </a>
          <a 
            className={`tab ${activeTab === 'policies' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            My Policies
          </a>
        </div>
        
        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div>
            {mockLoans.length === 0 ? (
              <div className="text-center py-10">
                <p className="mb-4">You don&apos;t have any active loans.</p>
                <Button onClick={() => router.push('/loan')}>
                  Apply for a Loan
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {mockLoans.map((loan) => {
                  const policy = getPolicyById(loan.policyId);
                  
                  return (
                    <Card key={loan.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Left: Collateral Info */}
                        <div className="md:w-1/3 p-6 bg-base-200">
                          <h3 className="font-semibold mb-4">Collateral</h3>
                          {policy && (
                            <div className="flex items-center">
                              <Image 
                                src={policy.imageUrl} 
                                alt={policy.name}
                                width={100}
                                height={100}
                                className="rounded-lg"
                                sizes="100px"
                                priority
                              />
                              <div>
                                <p className="font-medium">{policy.name}</p>
                                <p className="text-sm text-neutral-content">
                                  Value: ${policy.value.toLocaleString()}
                                </p>
                                <p className="text-sm text-neutral-content">
                                  Expires: {formatDate(policy.expiryDate)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Right: Loan Info */}
                        <div className="md:w-2/3 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">
                                ${loan.amount.toLocaleString()} USDC Loan
                              </h3>
                              <p className="text-sm text-neutral-content">
                                ID: {loan.id}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`badge ${
                                loan.status === 'active' ? 'badge-primary' : 
                                loan.status === 'paid' ? 'badge-success' : 'badge-error'
                              }`}>
                                {loan.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Repayment Progress</span>
                              <span>{calculateProgress(loan)}%</span>
                            </div>
                            <progress 
                              className="progress progress-primary w-full" 
                              value={calculateProgress(loan)} 
                              max="100"
                            ></progress>
                          </div>
                          
                          {/* Loan details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-neutral-content">Monthly Payment</p>
                              <p className="font-medium">${calculateMonthlyPayment(loan)} USDC</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-content">Next Payment</p>
                              <p className="font-medium">{formatDate(loan.nextPaymentDate)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-content">Remaining Balance</p>
                              <p className="font-medium">${calculateRemainingBalance(loan)} USDC</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-content">Term</p>
                              <p className="font-medium">{loan.term} Months</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-content">Interest Rate</p>
                              <p className="font-medium">{loan.interestRate}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-content">Payments Remaining</p>
                              <p className="font-medium">{loan.remainingPayments} of {loan.term}</p>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="mt-6 flex flex-wrap gap-2">
                            <Button size="sm">
                              Make Payment
                            </Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div>
            {mockPolicies.length === 0 ? (
              <div className="text-center py-10">
                <p className="mb-4">You don&apos;t have any tokenized policies.</p>
                <Button onClick={() => router.push('/tokenize')}>
                  Tokenize a Policy
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockPolicies.map((policy) => (
                  <Card key={policy.id} className="shadow-sm">
                    <div className="p-6">
                      <div className="flex">
                        <Image 
                          src={policy.imageUrl} 
                          alt={policy.name}
                          width={100}
                          height={100}
                          className="rounded-lg"
                          sizes="100px"
                          priority
                        />
                        <div>
                          <h3 className="font-semibold">{policy.name}</h3>
                          <p className="text-sm text-neutral-content mb-2">
                            ID: {policy.id}
                          </p>
                          <div className="badge badge-outline">
                            {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance
                          </div>
                        </div>
                      </div>
                      
                      <div className="divider"></div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-content">Provider</p>
                          <p className="font-medium">{policy.provider}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-content">Policy Value</p>
                          <p className="font-medium">${policy.value.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-content">Expires On</p>
                          <p className="font-medium">{formatDate(policy.expiryDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-content">Max Loan Amount</p>
                          <p className="font-medium">${(policy.value * 0.7).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          View Details
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => router.push('/loan')}
                        >
                          Get a Loan
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Add a try-catch wrapper to handle any build-time issues
export default function DashboardClient() {
  try {
    return <DashboardContent />;
  } catch {
    // This error handling is only for build-time issues
    // At runtime, the component will work normally
    return <DashboardContent />;
  }
}
