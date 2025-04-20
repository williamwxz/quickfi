// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

import DashboardClient from '@/components/app/DashboardClient';

export default function DashboardPage() {
  return <DashboardClient />;
}