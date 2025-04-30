import { Button } from "@/components/ui/Button";
import { ChevronRight, ArrowRight, Shield, Clock, Zap, BarChart4, Lock, Wallet, FileCheck, CreditCard } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: <Shield className="h-10 w-10" />,
    title: "Secure Tokenization",
    description: "Decentralized platform that unlocks liquidity from real-world insurance policies.."
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
    title: "Borrow Stable Coins",
    description: "Use your NFT as collateral to instantly borrow stable coins at competitive rates."
  },
  {
    icon: <Wallet className="h-10 w-10" />,
    title: "Manage Your Position",
    description: "Monitor your loan, make repayments, and reclaim your NFT once fully repaid."
  }
];

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 mb-2">
                  Built on Pharos
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tokenize Insurance.</span><br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Unlock Capital.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-lg">
                  A Decentralized platform that unlocks liquidity from real-world insurance policies.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link href="/app">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      Open App <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-600/5">
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
                      <p className="text-2xl font-bold text-gray-800">$250,000</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold">NFT</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-3/4"></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Available to borrow</span>
                      <span className="font-medium text-blue-600">$187,500 USDC</span>
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
                      <Button variant="ghost" className="text-blue-600 h-8 px-3">
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Section */}
        <section id="stats" className="py-12 bg-blue-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">175,000</h3>
                <p className="text-gray-600 font-medium">Total Insurances Tokenized</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">$4,522,000</h3>
                <p className="text-gray-600 font-medium">Total Collateral Value</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">$3,014,000</h3>
                <p className="text-gray-600 font-medium">Total Borrowed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
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
                  <div className="w-14 h-14 mb-5 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
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
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
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

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-95"></div>
              <div className="absolute inset-0 bg-[url('/placeholder.svg')] mix-blend-overlay opacity-10"></div>

              <div className="relative z-10 px-6 py-16 md:px-12 md:py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Unlock the Value of Your Insurance Policy?
                </h2>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
                  Join over 175,000 policy holders who have already accessed more than $3M in liquidity through QuickFi.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/app">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
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

        {/* FAQ Section */}
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
                    <AccordionTrigger className="text-lg font-medium text-left py-5 text-gray-800 hover:text-blue-600 transition-colors">
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
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact our support team
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
