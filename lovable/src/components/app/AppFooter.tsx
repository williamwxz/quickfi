
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Globe, Mail } from 'lucide-react';

const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-border py-4 bg-background">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-3 md:mb-0">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-quickfi-blue to-quickfi-purple flex items-center justify-center">
            <span className="text-white font-bold text-xs">QF</span>
          </div>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} QuickFi</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link to="/app/faq" className="text-sm text-muted-foreground hover:text-quickfi-blue transition-colors">
            FAQ
          </Link>
          <a href="#" className="text-sm text-muted-foreground hover:text-quickfi-blue transition-colors">
            Terms
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-quickfi-blue transition-colors">
            Privacy
          </a>
          <div className="flex items-center space-x-4 ml-2">
            <a href="#" className="text-muted-foreground hover:text-quickfi-blue transition-colors">
              <Mail className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-quickfi-blue transition-colors">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-quickfi-blue transition-colors">
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
