
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from '@/components/ui/card';

const FaqPage: React.FC = () => {
  const faqs = [
    {
      question: "What is QuickFi?",
      answer: "QuickFi is a decentralized lending platform built on the Pharos blockchain that allows users to tokenize their insurance policies as ERC721 NFTs and use them as collateral to borrow USDC stablecoins."
    },
    {
      question: "How does tokenizing my insurance policy work?",
      answer: "Tokenizing your insurance policy creates a digital representation of your policy as an NFT (Non-Fungible Token) on the blockchain. This process involves uploading your policy document and providing key details like policy number, value, and expiry date. Once tokenized, your policy becomes a digital asset that can be used as collateral for loans through our platform, without affecting your actual insurance coverage."
    },
    {
      question: "Is my insurance policy affected when I use it as collateral?",
      answer: "No, tokenizing your insurance policy and using it as collateral does not affect the terms, coverage, or validity of your actual insurance policy. The NFT represents the policy's value but does not transfer ownership of the policy itself. Your insurance coverage remains intact throughout the process."
    },
    {
      question: "How much can I borrow against my policy?",
      answer: "You can borrow up to 70% of your insurance policy's value, depending on various risk factors. The exact Loan-to-Value (LTV) ratio may vary based on the policy type, term, and prevailing market conditions."
    },
    {
      question: "What happens if I don't repay my loan on time?",
      answer: "If you fail to repay your loan by the due date, your collateralized NFT may be subject to liquidation according to the terms specified in the smart contract. This means you could lose the right to reclaim your policy NFT. We send notifications before the due date to help you avoid liquidation."
    },
    {
      question: "What are the interest rates for loans?",
      answer: "Interest rates vary based on the Loan-to-Value (LTV) ratio, loan term, and current market conditions. Generally, lower LTV ratios receive more favorable interest rates. The exact rate for your loan will be displayed clearly before you confirm your loan application."
    },
    {
      question: "How do I repay my loan?",
      answer: "You can repay your loan through the Dashboard page by clicking on the 'Repay Loan' button next to your active loan. The system will connect to your wallet and process the repayment transaction. Once confirmed, your NFT collateral will be released back to you."
    },
    {
      question: "Is my personal and policy information secure?",
      answer: "Yes, we take security very seriously. Your sensitive policy documents are stored using encrypted, decentralized storage solutions. The blockchain only stores tokenized representations and not the actual documents. Additionally, all transactions are secured by blockchain technology, ensuring transparency and immutability."
    },
    {
      question: "What blockchain does QuickFi use?",
      answer: "QuickFi operates on the Pharos blockchain, which provides fast transaction speeds, low fees, and robust security for NFT operations and financial transactions."
    },
    {
      question: "Can I tokenize any type of insurance policy?",
      answer: "Currently, we support most types of life insurance, health insurance, and property insurance policies with a clear cash value. Some policy types may require additional verification. If you're unsure whether your policy qualifies, please contact our support team."
    },
    {
      question: "Do I need to have a crypto wallet to use QuickFi?",
      answer: "Yes, you need a blockchain wallet compatible with the Pharos network to interact with our platform. Popular options include MetaMask (with Pharos network configuration) and other Web3 wallets that support the Pharos blockchain."
    },
    {
      question: "How long does it take to get a loan approved?",
      answer: "Since our platform operates on smart contracts, loan approval is nearly instantaneous once you complete the application process. After selecting your collateral and entering your desired loan amount, you can receive the USDC in your wallet within minutes, depending on blockchain network conditions."
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-quickfi-slate mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600">Everything you need to know about QuickFi</p>
      </div>
      
      <Card className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium text-quickfi-slate">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
      
      <div className="mt-8 text-center">
        <p className="text-muted-foreground">
          Can't find an answer to your question? Contact our support team at <a href="mailto:support@quickfi.com" className="text-quickfi-blue">support@quickfi.com</a>
        </p>
      </div>
    </div>
  );
};

export default FaqPage;
