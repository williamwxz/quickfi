
import React from 'react';
import { Shield, Clock, Zap, BarChart4, Lock, Wallet } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Secure Tokenization",
      description: "Convert insurance policies into secure ERC721 NFTs verified by our trusted network."
    },
    {
      icon: <Clock className="h-10 w-10" />,
      title: "Instant Liquidity",
      description: "Access up to 75% of your policy value in USDC within minutes, not weeks."
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "No Credit Checks",
      description: "Your tokenized insurance policy is all the collateral you need—no credit history required."
    },
    {
      icon: <BarChart4 className="h-10 w-10" />,
      title: "Competitive Rates",
      description: "Enjoy lower interest rates compared to traditional lenders and credit cards."
    },
    {
      icon: <Lock className="h-10 w-10" />,
      title: "Self-Custody",
      description: "Maintain ownership of your policy NFT in your own wallet—we never take custody."
    },
    {
      icon: <Wallet className="h-10 w-10" />,
      title: "Flexible Repayment",
      description: "Repay your loan on your schedule with no early repayment penalties."
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-white to-blue-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose QuickFi</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform offers unique advantages for insurance policy holders looking to access their policy value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 mb-5 rounded-lg bg-blue-100 flex items-center justify-center text-quickfi-blue">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
