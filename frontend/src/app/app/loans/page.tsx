'use client';

import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { BorrowerLoansList } from '@/components/loan/BorrowerLoansList';

export default function LoansPage() {
  return (
    <WalletAuthCheck>
      <div className="container mx-auto px-4 py-8">
        <BorrowerLoansList />
      </div>
    </WalletAuthCheck>
  );
}
