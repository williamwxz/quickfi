
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-hero-gradient opacity-95"></div>
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] mix-blend-overlay opacity-10"></div>
          
          <div className="relative z-10 px-6 py-16 md:px-12 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Unlock the Value of Your Insurance Policy?
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Join thousands of policy holders who have already accessed over $12.5M in liquidity through QuickFi.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/app">
                <Button size="lg" className="bg-white text-quickfi-blue hover:bg-white/90">
                  Open App <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
