import { redirect } from 'next/navigation';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function AppPage() {
  redirect('/app/dashboard');
} 