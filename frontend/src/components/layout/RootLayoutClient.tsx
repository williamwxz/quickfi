'use client';

import { Geist, Geist_Mono } from "next/font/google";
// Web3Provider is used in app/app/layout.tsx, not needed here
import NavBar from "@/components/layout/NavBar";
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith('/app');

  return (
    <html lang="en" data-theme="quickfi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          {!isAppRoute && <NavBar />}
          <main className={`min-h-screen ${!isAppRoute ? 'pt-16 md:pt-20' : ''}`}>
            {children}
          </main>
      </body>
    </html>
  );
}