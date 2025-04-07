'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppHeader() {
  const pathname = usePathname();
  
  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard' },
    { label: 'Tokenize Policy', href: '/app/tokenize' },
    { label: 'Get Loan', href: '/app/loan' },
  ];
  
  return (
    <header className="bg-base-100 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-primary">
              QuickFi
            </Link>
            
            <nav className="hidden md:flex ml-10">
              <ul className="flex gap-6">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`hover:text-primary transition-colors ${
                        pathname === item.href ? 'text-primary font-medium' : 'text-neutral'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center">
            <ConnectButton />
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <label htmlFor="app-mobile-menu" className="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Drawer */}
      <div className="md:hidden">
        <input id="app-mobile-menu" type="checkbox" className="drawer-toggle" />
        <div className="drawer-side z-50">
          <label htmlFor="app-mobile-menu" className="drawer-overlay"></label>
          <ul className="menu p-4 w-80 h-full bg-base-100 text-neutral">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={pathname === item.href ? 'text-primary font-medium' : ''}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-4 border-t pt-4">
              <Link href="/" className="text-neutral">
                Return to Main Site
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
} 