import { redirect } from 'next/navigation';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

// Redirect to the correct loan page
export default function LoanPage() {
  redirect('/app/loan');
}