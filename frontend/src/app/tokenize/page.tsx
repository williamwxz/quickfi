// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

import TokenizeClient from '@/components/tokenize/TokenizeClient';

export default function TokenizePage() {
  return <TokenizeClient />;
}