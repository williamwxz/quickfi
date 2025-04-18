'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp } from 'lucide-react';
import { useState } from 'react';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'policies' | 'loans'>('policies');

  // Mock data that matches the UI
  const metrics = [
    {
      title: "Total Policy Value",
      value: "$225,000",
      subtitle: "3 Tokenized Policies",
      icon: <FileText className="h-5 w-5 text-gray-500" />
    },
    {
      title: "Active Loans",
      value: "$25,000",
      subtitle: "1 Active Loan",
      icon: <FileText className="h-5 w-5 text-gray-500" />
    },
    {
      title: "Available Borrowing Power",
      value: "$132,500",
      subtitle: "84% Available",
      icon: <TrendingUp className="h-5 w-5 text-gray-500" />
    }
  ];

  const tokenizedPolicies = [
    {
      id: "NFT-001",
      status: "Available",
      policyNumber: "POL-123456",
      value: "$100,000",
      tokenizedOn: "11/15/2023",
      expiresOn: "5/20/2026"
    },
    {
      id: "NFT-002",
      status: "Used as Collateral",
      policyNumber: "POL-789012",
      value: "$50,000",
      tokenizedOn: "12/3/2023",
      expiresOn: "12/10/2025"
    },
    {
      id: "NFT-003",
      status: "Available",
      policyNumber: "POL-345678",
      value: "$75,000",
      tokenizedOn: "1/22/2024",
      expiresOn: "3/15/2027"
    }
  ];

  const loans = [
    {
      id: "LOAN-001",
      status: "Due Soon",
      collateral: "NFT-002 (POL-789012)",
      principal: "$25,000",
      interestRate: "7.5% APR",
      term: "90 days",
      repaymentAmount: "$25,468.75",
      startDate: "2/15/2024",
      endDate: "5/15/2024",
      daysRemaining: 333,
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
        {metrics.map((metric) => (
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
        ))}
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
          {tokenizedPolicies.map((policy) => (
            <Card key={policy.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{policy.id}</h3>
                    <Badge
                      variant={policy.status === "Available" ? "default" : "secondary"}
                      className={policy.status === "Available" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                    >
                      {policy.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600">Policy: {policy.policyNumber}</p>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-gray-600">Value</p>
                      <p className="font-semibold">{policy.value}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tokenized On</p>
                      <p className="font-semibold">{policy.tokenizedOn}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expires On</p>
                      <p className="font-semibold">{policy.expiresOn}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {policy.status === "Available" && (
                    <Button variant="outline" className="text-blue-600 border-blue-600">
                      Use as Collateral
                    </Button>
                  )}
                  <Button variant="ghost">View Details</Button>
                </div>
              </div>
            </Card>
          ))}

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
          {loans.map((loan) => (
            <Card key={loan.id} className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{loan.id}</h3>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      {loan.status}
                    </Badge>
                  </div>
                  <Button className="bg-primary text-white">
                    Repay Loan
                  </Button>
                </div>

                <p className="text-gray-600">Collateral: {loan.collateral}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-600">Principal</p>
                    <p className="font-semibold">{loan.principal}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Interest Rate</p>
                    <p className="font-semibold">{loan.interestRate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Term</p>
                    <p className="font-semibold">{loan.term}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Repayment Amount</p>
                    <p className="font-semibold">{loan.repaymentAmount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{loan.startDate}</span>
                    <span>{loan.endDate}</span>
                  </div>
                  <div className="h-2 w-full bg-blue-600 rounded-full" />
                  <div className="flex justify-end text-sm text-gray-600">
                    {loan.daysRemaining} days remaining
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
    return <DashboardContent />;
  } catch {
    // This error handling is only for build-time issues
    // At runtime, the component will work normally
    return <DashboardContent />;
  }
}