import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from 'lucide-react';

const NavBar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">QF</span>
              </div>
              <span className="font-bold text-xl text-gray-900">QuickFi</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              How It Works
            </a>
            <a href="#stats" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Statistics
            </a>
            <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              FAQ
            </a>
          </nav>
          <div>
            <Link href="/app">
              <Button variant="outline" className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50 font-medium">
                Open App <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;