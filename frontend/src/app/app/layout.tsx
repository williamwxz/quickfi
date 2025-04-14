'use client';

import { Web3Provider } from "@/providers/web3Provider";
import AppLayout from "@/components/layout/AppLayout";

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <AppLayout>
        {children}
      </AppLayout>
    </Web3Provider>
  );
}