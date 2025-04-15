// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

import LoanClient from '@/components/loan/LoanClient';

export default function LoanPage() {
  return <LoanClient />;
}