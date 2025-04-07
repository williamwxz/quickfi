import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral text-base-100 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">QuickFi</h3>
            <p className="text-sm text-base-300">
              A decentralized micro-loan platform on Pharos Network that enables users to 
              obtain stablecoin loans backed by their tokenized insurance policies.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tokenize" className="hover:text-primary transition-colors">Tokenize Policy</Link></li>
              <li><Link href="/loan" className="hover:text-primary transition-colors">Get Loan</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Ecosystem</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://pharosnetwork.xyz/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Pharos Network</a></li>
              <li><a href="https://perimeter.fi/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Perimeter Protocol</a></li>
              <li><a href="https://morpho.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Morpho Blue</a></li>
              <li><a href="https://erc721.org/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">ERC721 Standard</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@quickfi.io" className="hover:text-primary transition-colors">support@quickfi.io</a></li>
              <li><a href="https://twitter.com/quickfi" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Twitter</a></li>
              <li><a href="https://discord.gg/quickfi" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Discord</a></li>
              <li><a href="https://github.com/quickfi" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-base-300/20 text-center text-sm text-base-300">
          <p>© {new Date().getFullYear()} QuickFi. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="/terms" className="text-xs hover:text-primary transition-colors">Terms of Service</a>
            <a href="/privacy" className="text-xs hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/help" className="text-xs hover:text-primary transition-colors">Help Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 