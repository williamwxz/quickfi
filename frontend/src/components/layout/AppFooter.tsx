'use client';

import Link from 'next/link';
import { Github, Globe, Mail } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="border-t border-border py-4 bg-background">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-3 md:mb-0">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#1D4ED8] to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">QF</span>
          </div>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} QuickFi</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link 
            href="/app/faq" 
            className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
          >
            FAQ
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
          >
            Terms
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
          >
            Privacy
          </Link>
          <div className="flex items-center space-x-4 ml-2">
            <a 
              href="mailto:support@quickfi.xyz" 
              className="text-muted-foreground hover:text-blue-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a 
              href="https://github.com/quickfi" 
              className="text-muted-foreground hover:text-blue-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
            </a>
            <a 
              href="https://quickfi.xyz" 
              className="text-muted-foreground hover:text-blue-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 