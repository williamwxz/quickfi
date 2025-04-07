import { ReactNode } from 'react';
import AppHeader from './AppHeader';
import Footer from './Footer';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
} 