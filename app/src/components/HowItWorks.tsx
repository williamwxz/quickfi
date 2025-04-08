
import React from 'react';
import { FileCheck, Wallet, CreditCard, Lock } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <FileCheck className="h-10 w-10" />,
      title: "Upload Policy Details",
      description: "Submit your insurance policy documentation through our secure portal for verification."
    },
    {
      icon: <Lock className="h-10 w-10" />,
      title: "Mint Your NFT",
      description: "Once verified, your policy is tokenized as an ERC721 NFT on the Pharos blockchain."
    },
    {
      icon: <CreditCard className="h-10 w-10" />,
      title: "Borrow USDC",
      description: "Use your NFT as collateral to instantly borrow USDC at competitive rates."
    },
    {
      icon: <Wallet className="h-10 w-10" />,
      title: "Manage Your Position",
      description: "Monitor your loan, make repayments, and reclaim your NFT once fully repaid."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How QuickFi Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Four simple steps to transform your insurance policy into liquid capital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gray-200 -z-10 transform -translate-x-8">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-quickfi-blue rounded-full"></div>
                </div>
              )}
              <div className="text-center">
                <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full bg-blue-100 text-quickfi-blue">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
