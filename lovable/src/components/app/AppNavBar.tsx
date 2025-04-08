
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { Wallet, MenuIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const AppNavBar: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // This would be replaced with actual wallet connection logic
  const handleConnectWallet = () => {
    setIsConnected(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <NavLink to="/app" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-quickfi-blue to-quickfi-purple flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">QF</span>
              </div>
              <span className="font-bold text-xl text-quickfi-slate">QuickFi</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavLink to="/app/tokenize">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Tokenize
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink to="/app/loan">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Loan
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink to="/app/dashboard">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Dashboard
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink to="/app/faq">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    FAQ
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <Button variant="outline" className="hidden md:flex">
                <Wallet className="mr-2 h-4 w-4" />
                <span className="font-mono text-sm">0x1a2...3b4c</span>
              </Button>
            ) : (
              <Button onClick={handleConnectWallet} className="hidden md:flex bg-quickfi-blue hover:bg-quickfi-darkBlue text-white">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-4 space-y-4 flex flex-col">
            <NavLink 
              to="/app/tokenize"
              className={({ isActive }) => 
                cn("px-3 py-2 rounded-md", isActive ? "bg-quickfi-blue/10 text-quickfi-blue" : "hover:bg-gray-100")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Tokenize
            </NavLink>
            <NavLink 
              to="/app/loan"
              className={({ isActive }) => 
                cn("px-3 py-2 rounded-md", isActive ? "bg-quickfi-blue/10 text-quickfi-blue" : "hover:bg-gray-100")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Loan
            </NavLink>
            <NavLink 
              to="/app/dashboard"
              className={({ isActive }) => 
                cn("px-3 py-2 rounded-md", isActive ? "bg-quickfi-blue/10 text-quickfi-blue" : "hover:bg-gray-100")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/app/faq"
              className={({ isActive }) => 
                cn("px-3 py-2 rounded-md", isActive ? "bg-quickfi-blue/10 text-quickfi-blue" : "hover:bg-gray-100")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </NavLink>
            {!isConnected && (
              <Button onClick={handleConnectWallet} className="bg-quickfi-blue hover:bg-quickfi-darkBlue text-white">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppNavBar;
