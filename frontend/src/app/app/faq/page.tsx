'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      question: "What is QuickFi?",
      answer: "QuickFi is a decentralized platform that allows you to tokenize your insurance policies and use them as collateral for loans. We make it easy to unlock the value of your insurance policies while maintaining their coverage."
    },
    {
      question: "How does policy tokenization work?",
      answer: "Policy tokenization converts your traditional insurance policy into a digital asset (NFT) on the blockchain. This NFT represents your policy's value and can be used as collateral for loans while keeping the underlying policy active and protected."
    },
    {
      question: "What types of insurance policies can I tokenize?",
      answer: "Currently, we support tokenization of whole life insurance policies. We plan to expand to other types of insurance policies in the future."
    },
    {
      question: "How much can I borrow against my policy?",
      answer: "You can typically borrow up to 75% of your policy's cash value. The exact amount depends on various factors including policy type, value, and term."
    },
    {
      question: "What happens to my policy when I take a loan?",
      answer: "Your policy remains active and continues to provide coverage. The NFT is used as collateral, and you maintain ownership of the policy. If the loan is not repaid, the NFT may be liquidated according to the terms of the loan agreement."
    },
    {
      question: "What are the interest rates for loans?",
      answer: "Interest rates typically range from 5-10% APR, depending on the loan term, amount, and collateral value. Rates are competitive compared to traditional policy loans."
    },
    {
      question: "How do I repay my loan?",
      answer: "Loans can be repaid through our platform using cryptocurrency. You can make full or partial repayments at any time before the loan due date."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="text-gray-600 mt-2">
            Find answers to common questions about QuickFi's services and features.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
              <AccordionTrigger className="text-left text-gray-900 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-900 font-medium">Still have questions?</p>
          <p className="text-gray-600 mt-1">
            Contact our support team at support@quickfi.com for assistance.
          </p>
        </div>
      </div>
    </div>
  );
} 