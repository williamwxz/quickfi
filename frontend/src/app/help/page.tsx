'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  const faqItems: FaqItem[] = [
    {
      question: "What is QuickFi?",
      answer: "QuickFi is a decentralized micro-lending platform built on the EVM that allows users to tokenize their insurance policies as ERC721 NFTs and use them as collateral to borrow stable coins. It offers a fast, secure way to unlock capital from your insurance assets without selling them."
    },
    {
      question: "How do I tokenize my insurance policy?",
      answer: "To tokenize your insurance policy, navigate to the 'Tokenize Policy' page, upload your insurance policy document, and fill in the required metadata such as policy number, face value, and expiry date. Once submitted, your policy will be tokenized as an ERC721 NFT on the EVM blockchain."
    },
    {
      question: "What insurance policies can I tokenize?",
      answer: "QuickFi supports various types of insurance policies including life insurance, health insurance, auto insurance, and home insurance. The policy must be valid, in good standing, and not expired. Each policy is evaluated for its value and eligibility when tokenized."
    },
    {
      question: "How much can I borrow against my policy?",
      answer: "You can typically borrow up to 70% of your policy's assessed value. The maximum loan amount depends on factors like policy type, coverage, face value, and time to expiry. The platform calculates a risk assessment and loan-to-value (LTV) ratio for each policy."
    },
    {
      question: "What are the interest rates and loan terms?",
      answer: "Interest rates typically range from 4.5% to 7.5% APR depending on the loan term, policy value, and risk assessment. Loan terms range from 3 to 24 months. You can see your personalized rates and terms when applying for a loan with your tokenized policy as collateral."
    },
    {
      question: "How do I repay my loan?",
      answer: "You can repay your loan in equal monthly installments over the loan term. Payments are made in USDC directly through the platform. You can view your payment schedule, make payments, and track your loan status on your dashboard. Early repayment is allowed without penalties."
    },
    {
      question: "What happens if I fail to repay my loan?",
      answer: "If you default on your loan, your tokenized policy collateral may be liquidated to recover the outstanding loan amount. This process follows smart contract terms you agree to when taking the loan. We recommend maintaining timely payments to avoid collateral liquidation."
    },
    {
      question: "Is my policy information secure?",
      answer: "Yes, QuickFi uses blockchain technology to secure your policy data. The metadata stored on-chain is minimal and encrypted, while policy documents are stored securely using decentralized storage systems like IPFS. We never share your personal information with unauthorized third parties."
    },
    {
      question: "What is EVM?",
      answer: "EVM is a high-performance, low-cost blockchain designed specifically for financial applications. It offers fast transaction times and low gas fees, making it ideal for DeFi applications like QuickFi. All operations including policy tokenization and loan management occur on this network."
    },
    {
      question: "What are the fees for using QuickFi?",
      answer: "QuickFi charges a small origination fee (typically 1-2% of the loan amount) when a loan is issued. There are also minimal network transaction fees (gas fees) for blockchain operations. There are no hidden fees, and all charges are clearly displayed before confirming any transaction."
    },
    {
      question: "How do I connect my wallet?",
      answer: "Click the 'Connect Wallet' button in the top-right corner of the page. QuickFi supports popular Ethereum-compatible wallets like MetaMask, WalletConnect, Coinbase Wallet, and more through RainbowKit integration. Make sure your wallet is configured to work with the EVM Network."
    },
    {
      question: "What happens to my tokenized policy after I repay my loan?",
      answer: "After fully repaying your loan, your tokenized policy NFT is fully released from collateral status and remains in your wallet. You can use it for another loan, keep it as a digital representation of your policy, or burn it if you no longer need it."
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-md">
            <div className="divide-y">
              {faqItems.map((item, index) => (
                <div key={index} className="py-4">
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex justify-between items-center w-full text-left font-medium text-lg focus:outline-none"
                  >
                    <span>{item.question}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 transition-transform ${
                        openIndex === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  <div
                    className={`mt-2 overflow-hidden transition-all ${
                      openIndex === index ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <p className="text-neutral-content">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="mb-6 max-w-xl mx-auto">
              If you couldn&apos;t find the answer to your question, feel free to reach out to our support team.
            </p>
            <a
              href="mailto:support@quickfi.io"
              className="btn btn-primary"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 