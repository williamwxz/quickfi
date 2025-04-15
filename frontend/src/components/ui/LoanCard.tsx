'use client';

import { Card } from './Card';
import { Button } from './Button';

interface LoanCardProps {
  loanId: string;
  amount: number;
  term: number;
  interestRate: number;
  startDate: string | Date;
  nextPaymentDate: string | Date;
  remainingPayments: number;
  totalPayments: number;
  collateralName: string;
  collateralValue: number;
  status: 'active' | 'paid' | 'defaulted';
  className?: string;
  onViewDetails?: () => void;
  onMakePayment?: () => void;
}

export default function LoanCard({
  loanId,
  amount,
  term,
  interestRate,
  startDate,
  nextPaymentDate,
  remainingPayments,
  totalPayments,
  collateralName,
  collateralValue,
  status,
  className = '',
  onViewDetails,
  onMakePayment,
}: LoanCardProps) {
  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const monthlyInterestRate = interestRate / 100 / 12;
    const payment = (amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -term));
    return payment.toFixed(2);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    return Math.round(((totalPayments - remainingPayments) / totalPayments) * 100);
  };

  // Calculate LTV ratio
  const calculateLTV = () => {
    return ((amount / collateralValue) * 100).toFixed(1);
  };

  // Get status styling
  const getStatusStyles = () => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-success',
          text: 'text-success',
          label: 'Paid',
        };
      case 'defaulted':
        return {
          bg: 'bg-error',
          text: 'text-error',
          label: 'Defaulted',
        };
      case 'active':
      default:
        return {
          bg: 'bg-primary',
          text: 'text-primary',
          label: 'Active',
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-all ${className}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">Loan #{loanId}</h3>
            <p className="text-sm text-neutral-content">
              Started on {formatDate(startDate)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full ${statusStyles.text} bg-opacity-20 ${statusStyles.bg} bg-opacity-10 text-xs font-medium`}>
            {statusStyles.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <p className="text-neutral-content">Loan Amount</p>
            <p className="font-medium">${amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-neutral-content">Interest Rate</p>
            <p className="font-medium">{interestRate}% APR</p>
          </div>
          <div>
            <p className="text-neutral-content">Term</p>
            <p className="font-medium">{term} months</p>
          </div>
          <div>
            <p className="text-neutral-content">Monthly Payment</p>
            <p className="font-medium">${calculateMonthlyPayment()}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-neutral-content mb-1">Collateral</p>
          <div className="bg-base-200 p-2 rounded flex justify-between items-center">
            <span className="font-medium text-sm">{collateralName}</span>
            <div className="text-xs">
              <span className="text-neutral-content">LTV:</span> {calculateLTV()}%
            </div>
          </div>
        </div>

        {status === 'active' && (
          <>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Repayment Progress</span>
                <span>{totalPayments - remainingPayments} of {totalPayments} payments</span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${calculateProgress()}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="p-3 border border-accent bg-accent/5 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-content">Next Payment Due</p>
                  <p className="font-medium">{formatDate(nextPaymentDate)}</p>
                </div>
                <p className="font-medium">${calculateMonthlyPayment()}</p>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {onViewDetails && (
            <Button onClick={onViewDetails} variant="outline" className="w-full">
              View Details
            </Button>
          )}
          {onMakePayment && status === 'active' && (
            <Button onClick={onMakePayment} className="w-full">
              Make Payment
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
} 