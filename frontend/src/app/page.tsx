import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-focus text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Unlock Liquidity from Your Insurance Policies
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mb-8 text-white/90">
                QuickFi is a decentralized micro-loan platform that enables you to obtain USDC loans backed by your tokenized insurance policies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/tokenize">
                  <Button variant="secondary" size="lg">
                    Tokenize Policy
                  </Button>
                </Link>
                <Link href="/loan">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                    Get a Loan
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0">
              <div className="relative w-full max-w-md">
                {/* Main illustration - stylized with CSS */}
                <div className="relative z-10">
                  <div className="w-full h-80 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-focus/30 to-accent/30"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="flex items-center justify-center">
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white font-medium">Secure & Decentralized</span>
                      </div>
                    </div>
                    <div className="absolute top-6 right-6">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-xs font-medium text-white">Powered by Pharos</span>
                      </div>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute top-1/4 left-6 w-12 h-12 bg-accent/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute bottom-1/4 right-6 w-12 h-12 bg-secondary/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-accent/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-40 h-40 bg-secondary/30 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className="mb-4 h-32 w-32 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-primary/10 w-28 h-28 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0">
                    <div className="rounded-full bg-primary w-10 h-10 flex items-center justify-center text-white font-bold">1</div>
                  </div>
                </div>
                <h3 className="card-title justify-center mb-2">Tokenize Your Policy</h3>
                <p className="text-center">Upload your insurance policy document and we'll tokenize it as an ERC-721 NFT using Plume Arc/Nexus.</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className="mb-4 h-32 w-32 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-secondary/10 w-28 h-28 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 17h.01" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0">
                    <div className="rounded-full bg-secondary w-10 h-10 flex items-center justify-center text-white font-bold">2</div>
                  </div>
                </div>
                <h3 className="card-title justify-center mb-2">Apply for a Loan</h3>
                <p className="text-center">Select your tokenized policy as collateral and specify the amount you want to borrow in USDC.</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className="mb-4 h-32 w-32 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-accent/10 w-28 h-28 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0">
                    <div className="rounded-full bg-accent w-10 h-10 flex items-center justify-center text-white font-bold">3</div>
                  </div>
                </div>
                <h3 className="card-title justify-center mb-2">Receive Funds Instantly</h3>
                <p className="text-center">Once approved, USDC is instantly transferred to your wallet on the high-speed Pharos Network.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powered By Cutting-Edge Technology</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="mb-4 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="card-title">Pharos Network</h3>
                <p>Ultra-fast, low-cost blockchain designed for DeFi applications</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="card-title">Plume Arc/Nexus</h3>
                <p>Advanced platform for tokenizing and valuing insurance policies</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="mb-4 w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="card-title">Perimeter Protocol</h3>
                <p>Sophisticated risk engine for loan origination and management</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body items-center text-center">
                <div className="mb-4 w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="card-title">Morpho Blue</h3>
                <p>Efficient liquidity protocol for executing lending markets</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-accent/90"></div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mt-20 -mr-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -mb-20 -ml-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full"></div>
          
          <svg className="absolute bottom-0 left-0" width="404" height="384" fill="none" viewBox="0 0 404 384">
            <defs>
              <pattern id="cta-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-white/10" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#cta-grid)" />
          </svg>
          <svg className="absolute top-0 right-0" width="404" height="384" fill="none" viewBox="0 0 404 384">
            <defs>
              <pattern id="cta-grid-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-white/10" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#cta-grid-2)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Unlock the Value of Your Insurance?</h2>
            <p className="text-lg md:text-xl max-w-xl mx-auto mb-10 text-white/90">
              Connect your wallet and start the process today. It only takes a few minutes to tokenize your policy and apply for a loan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tokenize">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  Get Started Now
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-accent shadow-lg">
                  View Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Trusted</h3>
                <p className="text-white/80">Your assets are secured by smart contracts on the Pharos Network</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Funding</h3>
                <p className="text-white/80">Get your loans funded instantly after approval</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Low Fees</h3>
                <p className="text-white/80">Benefit from Pharos Network's ultra-low transaction fees</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
