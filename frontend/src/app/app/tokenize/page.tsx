'use client';

import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useMintPolicyToken } from '@/hooks/useContractHooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-toastify';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

function TokenizeContent() {
  const { address, isConnected } = useAccount();
  const { mintPolicyToken, isLoading, isSuccess, error } = useMintPolicyToken();

  const [formData, setFormData] = useState({
    policyNumber: '',
    issuer: '',
    jurisdiction: '',
    documentHash: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Handle file upload and hash generation
  const handleFileUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Create a simple hash from the file (in a real app, use a proper hashing algorithm)
      const buffer = await uploadedFile.arrayBuffer();
      const hashArray = Array.from(new Uint8Array(buffer)).slice(0, 32); // Take first 32 bytes for simplicity
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Update the form with the generated hash
      setFormData(prev => ({
        ...prev,
        documentHash: hashHex
      }));

      toast.success('Document hash generated successfully');
    } catch (error) {
      console.error('Error generating hash:', error);
      toast.error('Failed to generate document hash');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet to tokenize a policy.');
      return;
    }

    try {
      // Call the contract function with Oracle integration
      // The Oracle will determine the policy value and expiry date
      await mintPolicyToken?.([
        address as `0x${string}`, // to
        formData.policyNumber, // policy number
        formData.documentHash ? `0x${formData.documentHash}` as `0x${string}` : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // document hash as bytes32
        formData.jurisdiction, // jurisdiction
      ]);

    } catch (err) {
      console.error('Error tokenizing policy:', err);
      toast.error('Failed to tokenize policy. Please try again.');
    }
  };

  // Show success message when tokenization is successful
  if (isSuccess) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-green-500">Policy Tokenized!</CardTitle>
            <CardDescription>
              Your insurance policy has been successfully tokenized.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You can now use this tokenized policy as collateral for loans.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => window.location.href = '/app/dashboard'}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tokenize Insurance Policy</CardTitle>
          <CardDescription>
            Convert your insurance policy into a digital asset on the blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                name="policyNumber"
                value={formData.policyNumber}
                onChange={handleChange}
                placeholder="e.g., POL-12345"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Insurance Company Name</Label>
              <Input
                id="issuer"
                name="issuer"
                value={formData.issuer}
                onChange={handleChange}
                placeholder="e.g., MetLife"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleChange}
                placeholder="e.g., United States"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Policy Document</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                  uploadedFile ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />

                {uploadedFile ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-10 w-10 text-green-500 mb-2" />
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {formData.documentHash && (
                      <div className="flex items-center mt-2 text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Hash generated</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG or PNG (max. 10MB)
                    </p>
                  </div>
                )}
              </div>

              {uploadedFile && !formData.documentHash && (
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="w-full mt-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Hash...
                    </>
                  ) : (
                    'Generate Document Hash'
                  )}
                </Button>
              )}

              {formData.documentHash && (
                <div className="mt-2">
                  <Label htmlFor="documentHash">Document Hash</Label>
                  <Input
                    id="documentHash"
                    name="documentHash"
                    value={formData.documentHash}
                    onChange={handleChange}
                    placeholder="e.g., 1234abcd..."
                    required
                    readOnly
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> The Oracle will automatically determine the policy value and expiry date based on the provided information.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">
                Error: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !isConnected}>
              {isLoading ? 'Processing...' : 'Tokenize Policy'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TokenizePage() {
  return (
    <WalletAuthCheck>
      <TokenizeContent />
    </WalletAuthCheck>
  );
}