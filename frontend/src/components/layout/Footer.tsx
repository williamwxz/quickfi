export default function Footer() {
  return (
    <footer className="bg-neutral text-base-100 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">QuickFi</h3>
            <p className="text-sm text-base-300">
              A decentralized micro-loan platform on Pharos Network that enables users to 
              obtain stablecoin loans backed by their tokenized insurance policies.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/tokenize" className="hover:text-primary transition-colors">Tokenize Policy</a></li>
              <li><a href="/loan" className="hover:text-primary transition-colors">Get Loan</a></li>
              <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Powered By</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://pharosnetwork.xyz/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Pharos Network</a></li>
              <li><a href="https://plumenetwork.xyz/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Plume Arc/Nexus</a></li>
              <li><a href="https://morpho.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Morpho Blue</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-base-300/20 text-center text-sm text-base-300">
          <p>© {new Date().getFullYear()} QuickFi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 