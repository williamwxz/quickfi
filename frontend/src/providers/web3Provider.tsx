'use client';

import { ReactNode } from 'react';
import { ClientProviders } from '@/components/providers/ClientProviders';

export function Web3Provider({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
} 