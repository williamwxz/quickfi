
import React from 'react';
import { Outlet } from 'react-router-dom';
import AppNavBar from '@/components/app/AppNavBar';
import AppFooter from '@/components/app/AppFooter';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavBar />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-10">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
};

export default AppLayout;
