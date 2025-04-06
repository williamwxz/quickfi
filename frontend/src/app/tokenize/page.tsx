'use client';

import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FileUpload from '@/components/ui/FileUpload';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function TokenizePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Metadata, 3: Confirmation
  const [formData, setFormData] = useState({
    policyNumber: '',
    provider: '',
    policyType: '',
    coverage: '',
    faceValue: '',
    expiryDate: '',
  });
  
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      // Show wallet connection prompt
      return;
    }
    
    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call to backend
      // This is a placeholder for the actual tokenization process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Move to the next step after successful submission
      setStep(step + 1);
    } catch (error) {
      console.error('Error tokenizing policy:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Tokenize Your Insurance Policy</h1>
        
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-10">
            <ul className="steps steps-horizontal w-full">
              <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Upload Document</li>
              <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Policy Details</li>
              <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Confirmation</li>
            </ul>
          </div>
          
          <Card className="shadow-md">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload Your Insurance Policy Document</h2>
                <p className="mb-6 text-neutral-content">
                  Please upload a clear scan or image of your insurance policy document. We accept PDF, JPG, or PNG files.
                </p>
                
                <FileUpload 
                  onFileSelect={handleFileSelect}
                  label="Upload Insurance Policy"
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                  maxFileSizeMB={10}
                  className="mb-6"
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => file && setStep(2)}
                    disabled={!file}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-4">Enter Policy Details</h2>
                <p className="mb-6 text-neutral-content">
                  Please provide the following information about your insurance policy. This data will be used to value your policy.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Policy Number</span>
                    </label>
                    <input
                      type="text"
                      name="policyNumber"
                      value={formData.policyNumber}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Insurance Provider</span>
                    </label>
                    <input
                      type="text"
                      name="provider"
                      value={formData.provider}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Policy Type</span>
                    </label>
                    <select
                      name="policyType"
                      value={formData.policyType}
                      onChange={handleInputChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select Policy Type</option>
                      <option value="life">Life Insurance</option>
                      <option value="health">Health Insurance</option>
                      <option value="auto">Auto Insurance</option>
                      <option value="home">Home Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Coverage Amount (USD)</span>
                    </label>
                    <input
                      type="number"
                      name="coverage"
                      value={formData.coverage}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Face Value (USD)</span>
                    </label>
                    <input
                      type="number"
                      name="faceValue"
                      value={formData.faceValue}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Expiry Date</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" isLoading={isLoading}>
                    Tokenize Policy
                  </Button>
                </div>
              </form>
            )}
            
            {step === 3 && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-success p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mb-4">Policy Successfully Tokenized!</h2>
                <p className="mb-6 text-neutral-content">
                  Your insurance policy has been successfully tokenized as an ERC-721 NFT. You can now use it as collateral to get a loan.
                </p>
                
                <div className="card bg-base-200 p-4 mb-6 mx-auto max-w-md">
                  <h3 className="font-medium mb-2">Token Details</h3>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Token ID:</span> 123456789
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Collection:</span> QuickFi Insurance Policies
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Estimated Value:</span> ${formData.faceValue} USD
                  </p>
                  <p className="text-sm break-all">
                    <span className="font-medium">Contract Address:</span> 0x123...abc
                  </p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    View Dashboard
                  </Button>
                  <Button
                    onClick={() => router.push('/loan')}
                  >
                    Get a Loan
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 