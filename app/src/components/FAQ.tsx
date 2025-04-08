
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What types of insurance policies can be tokenized?",
      answer: "QuickFi currently supports whole life insurance, universal life insurance, and certain types of term life insurance policies with cash value. We're expanding to support more policy types in the future."
    },
    {
      question: "How much can I borrow against my policy?",
      answer: "Typically, you can borrow up to 75% of your policy's cash surrender value, depending on the policy type and issuer. Our system will calculate the exact amount available once your policy is verified."
    },
    {
      question: "Is my insurance policy still valid after tokenization?",
      answer: "Yes, your insurance policy remains fully valid and active. Tokenization doesn't affect the terms of your insurance policy or coverage—it simply creates a digital representation that can be used as collateral."
    },
    {
      question: "What happens if I don't repay my loan?",
      answer: "If you don't repay your loan by the end of the term, part of your NFT value equivalent to your outstanding balance plus fees may be liquidated. However, your underlying insurance policy remains intact and valid."
    },
    {
      question: "How long does the verification process take?",
      answer: "The verification process typically takes 24-48 hours, depending on how quickly we can verify your policy details with the insurance provider."
    },
    {
      question: "What blockchain does QuickFi use?",
      answer: "QuickFi operates on the Pharos blockchain, which offers high security, low transaction costs, and excellent scalability for our decentralized lending platform."
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about tokenizing insurance policies and borrowing on QuickFi.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                <AccordionTrigger className="text-lg font-medium text-left py-5 text-quickfi-slate hover:text-quickfi-blue transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a href="#" className="text-quickfi-blue hover:text-quickfi-darkBlue font-medium">
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
