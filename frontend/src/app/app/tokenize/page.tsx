'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useMintPolicyToken } from '@/hooks/useContractHooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-toastify';
import { Loader2, Upload, FileText, CheckCircle, Link } from 'lucide-react';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { parseUnits } from 'ethers';
import { getTransactionUrl } from '@/utils/explorer';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

function TokenizeContent() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mintPolicyToken, isLoading: isMinting, hash, isSuccess } = useMintPolicyToken(chainId);

  const [formData, setFormData] = useState({
    policyNumber: '',
    issuer: '',
    faceValue: '',
    expiryDate: '',
    documentHash: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch for transaction hash and show initial submission message
  useEffect(() => {
    if (hash) {
      toast.success(
        <div>
          Transaction submitted! <a href={getTransactionUrl(hash, chainId)} target="_blank" rel="noopener noreferrer" className="underline">View transaction</a>
        </div>
      );
    }
  }, [hash, chainId]);

  // Watch for transaction success, store policy data, and show final success message
  useEffect(() => {
    const storePolicyData = async () => {
      if (isSuccess && hash) {
        try {
          const response = await fetch('/api/tokenize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chainId,
              address: address,
              ownerAddress: address,
              policyNumber: formData.policyNumber,
              issuer: formData.issuer,
              policyType: 'Life', // Default to Life insurance for now
              faceValue: formData.faceValue,
              expiryDate: formData.expiryDate,
              documentHash: formData.documentHash,
              txHash: hash,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to store policy data');
          }

          toast.success(
            <div>
              Policy tokenized successfully! <a href={getTransactionUrl(hash, chainId)} target="_blank" rel="noopener noreferrer" className="underline">View transaction</a>
            </div>
          );
        } catch (error) {
          console.error('Error storing policy data:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to store policy data');
        }
      }
    };

    storePolicyData();
  }, [isSuccess, hash, chainId, address, formData]);

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
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate required fields before proceeding
    const missingFields = [];
    if (!formData.policyNumber) missingFields.push('Policy Number');
    if (!formData.issuer) missingFields.push('Insurance Company Name');
    if (!formData.faceValue) missingFields.push('Face Value');
    if (!formData.expiryDate) missingFields.push('Expiry Date');
    if (!formData.documentHash) missingFields.push('Document Hash');

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setIsUploading(true);

      // Convert face value to the correct format (assuming 6 decimals for USDC)
      const valuationAmount = parseUnits(formData.faceValue.toString(), 6);

      // Convert expiry date to timestamp
      const expiryTimestamp = BigInt(Math.floor(new Date(formData.expiryDate).getTime() / 1000));

      // Convert document hash to bytes32 if provided
      const documentHashBytes32 = formData.documentHash
        ? `0x${formData.documentHash.padEnd(64, '0')}` as `0x${string}`
        : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

      // Convert issuer name to a valid address (using a simple hash for demo purposes)
      // In production, you should use a proper mapping of issuer names to their addresses
      const issuerAddress = `0x${Buffer.from(formData.issuer.toLowerCase())
        .toString('hex')
        .padEnd(40, '0')}` as `0x${string}`;

      // Prepare the arguments for the mintPolicy function
      const mintArgs: [`0x${string}`, string, `0x${string}`, bigint, bigint, `0x${string}`] = [
        address as `0x${string}`, // to
        formData.policyNumber, // policyNumber
        issuerAddress, // issuer
        valuationAmount, // valuationAmount
        expiryTimestamp, // expiryDate
        documentHashBytes32 // documentHash
      ];

      // Mint the policy token using the user's wallet
      await mintPolicyToken(mintArgs);

      // The hash will be set by the hook after the transaction is submitted
      // We'll use the hash from the hook in the useEffect below

    } catch (error) {
      console.error('Error tokenizing policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to tokenize policy');
    } finally {
      setIsUploading(false);
    }
  };

  // Show success message when we have a transaction hash
  if (hash) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-green-500">Policy Tokenized!</CardTitle>
            <CardDescription>
              Your insurance policy has been successfully tokenized.
              <br />
              <Link href={`${getTransactionUrl(hash, chainId)}`}>
                View on Explorer
              </Link>
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
              <Label htmlFor="faceValue">Face Value</Label>
              <Input
                id="faceValue"
                name="faceValue"
                value={formData.faceValue}
                onChange={handleChange}
                placeholder="e.g., $1,000,000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                placeholder="e.g., 2024-06-30"
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

            <Button
              type="submit"
              className="w-full"
              disabled={isUploading || isMinting || !isConnected || !formData.policyNumber || !formData.issuer || !formData.faceValue || !formData.expiryDate || !formData.documentHash}
            >
              {isUploading || isMinting ? 'Processing...' : 'Tokenize Policy'}
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