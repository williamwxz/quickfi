// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

import DashboardClient from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return <DashboardClient />;
}