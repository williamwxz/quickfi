import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4">QuickFi</h3>
            <p className="text-sm text-gray-400">
              A decentralized micro-loan platform on Pharos Network that enables users to
              obtain stablecoin loans backed by their tokenized insurance policies.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/app/tokenize" className="hover:text-blue-400 transition-colors">Tokenize Policy</Link></li>
              <li><Link href="/app/loan" className="hover:text-blue-400 transition-colors">Get Loan</Link></li>
              <li><Link href="/app/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
              <li><Link href="/#faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Ecosystem</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://pharosnetwork.xyz/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Pharos Network</a></li>
              <li><a href="https://perimeter.fi/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Perimeter Protocol</a></li>
              <li><a href="https://morpho.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Morpho Blue</a></li>
              <li><a href="https://erc721.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">ERC721 Standard</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@quickfi.io" className="hover:text-blue-400 transition-colors">support@quickfi.io</a></li>
              <li><a href="https://twitter.com/quickfi" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Twitter</a></li>
              <li><a href="https://discord.gg/quickfi" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Discord</a></li>
              <li><a href="https://github.com/quickfi" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} QuickFi. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="/terms" className="text-xs hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="/privacy" className="text-xs hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="/help" className="text-xs hover:text-blue-400 transition-colors">Help Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
}