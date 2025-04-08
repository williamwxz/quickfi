
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-quickfi-blue mb-2">
              Built on Pharos
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Tokenize Insurance.</span><br />
              <span className="gradient-text">Unlock Capital.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Convert insurance policies into ERC721 NFTs and use them as collateral to borrow USDC on our decentralized lending platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button size="lg" className="bg-quickfi-blue hover:bg-quickfi-darkBlue text-white font-medium">
                Open App <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-quickfi-blue text-quickfi-blue hover:bg-quickfi-blue/5">
                Learn More <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -z-10 top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl"></div>
            <div className="relative z-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-float">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-gray-500">Policy Value</p>
                  <p className="text-2xl font-bold text-quickfi-slate">$250,000</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-hero-gradient flex items-center justify-center">
                  <span className="text-white font-bold">NFT</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-hero-gradient rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available to borrow</span>
                  <span className="font-medium text-quickfi-blue">$187,500 USDC</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium">Life Insurance Policy</p>
                      <p className="text-xs text-gray-500">Tokenized #8294</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-quickfi-blue h-8 px-3">
                    Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
