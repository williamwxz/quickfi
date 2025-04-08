import React from 'react';
import { ExternalLink, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-quickfi-blue to-quickfi-purple flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">QF</span>
              </div>
              <span className="font-bold text-xl text-quickfi-slate">QuickFi</span>
            </div>
            <p className="text-gray-600 mb-4">
              Bridging traditional insurance with DeFi to unlock the value of your assets.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-quickfi-blue">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-quickfi-blue">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-quickfi-blue">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-600 hover:text-quickfi-blue">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-600 hover:text-quickfi-blue">How It Works</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Pricing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">API</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Blog</a></li>
              <li><a href="#faq" className="text-gray-600 hover:text-quickfi-blue">FAQ</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Press</a></li>
              <li><a href="#" className="text-gray-600 hover:text-quickfi-blue">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} QuickFi. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="#" className="text-gray-600 hover:text-quickfi-blue">Terms</a>
            <a href="#" className="text-gray-600 hover:text-quickfi-blue">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-quickfi-blue">Security</a>
            <a href="#" className="flex items-center text-gray-600 hover:text-quickfi-blue">
              Smart Contracts <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
