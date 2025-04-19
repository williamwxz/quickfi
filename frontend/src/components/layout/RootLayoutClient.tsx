'use client';

// Web3Provider is used in app/app/layout.tsx, not needed here
import NavBar from "@/components/layout/NavBar";
import { usePathname } from 'next/navigation';
import Footer from '@/components/layout/Footer';

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith('/app');

  return (
    <div className="antialiased">
      {!isAppRoute && <NavBar />}
      <main className={`min-h-screen ${!isAppRoute ? 'pt-16 md:pt-20' : ''}`}>
        {children}
      </main>
      {!isAppRoute && <Footer />}
    </div>
  );
}