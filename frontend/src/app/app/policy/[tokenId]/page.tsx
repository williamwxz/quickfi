'use client';

import { useParams } from 'next/navigation';
import PolicyDetails from '@/components/policy/PolicyDetails';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function PolicyPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/app/dashboard">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Policy Details</h1>
      
      <PolicyDetails tokenId={tokenId} />
      
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline">View on Explorer</Button>
        <Button>Apply for Loan</Button>
      </div>
    </div>
  );
}
