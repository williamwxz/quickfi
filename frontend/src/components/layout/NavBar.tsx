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
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">QF</span>
              </div>
              <span className="font-bold text-xl text-foreground">QuickFi</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#stats" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Statistics
            </a>
            <a href="#faq" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>
          <div>
            <Link href="/app">
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium">
                Open App
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar; 