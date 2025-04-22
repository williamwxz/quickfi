'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useMintPolicyToken } from '@/hooks/useContractHooks';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-toastify';
import { Loader2, Upload, FileText, CheckCircle, Link } from 'lucide-react';
import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { parseUnits } from 'ethers';
import { getTransactionUrl } from '@/utils/explorer';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

function TokenizeContent() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mintPolicyToken, isSuccess, isLoading: isMinting, hash, txData, tokenId } = useMintPolicyToken(chainId);
  const { addresses } = useContractAddresses(chainId);

  const [formData, setFormData] = useState({
    policyNumber: '',
    issuer: '',
    faceValue: '',
    expiryDate: '',
    documentHash: '',
    jurisdiction: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storePolicyData = useCallback(async () => {
    try {
      // Get the tokenized policy address from the transaction receipt
      if (!txData?.logs?.[0]?.address) {
        throw new Error('Failed to get tokenized policy address');
      }

      // We must have a token ID from the smart contract
      // Use strict comparison with undefined to handle token ID 0 correctly
      if (tokenId === undefined) {
        throw new Error("Failed to extract token ID from transaction logs. Please check the console for more details.");
      }

      console.log('Using token ID from smart contract:', tokenId);

      // Use the TokenizedPolicy contract address from the hook
      const tokenAddress = addresses?.TokenizedPolicy;

      if (!tokenAddress) {
        throw new Error('TokenizedPolicy contract address not available');
      }

      const response = await fetch('/api/tokenize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId,
          address: tokenAddress,
          policyNumber: formData.policyNumber,
          issuer: formData.issuer,
          policyType: 'Life',
          faceValue: formData.faceValue,
          expiryDate: formData.expiryDate,
          documentHash: formData.documentHash,
          jurisdiction: formData.jurisdiction,
          userAddress: address,
          txHash: hash,
          tokenId: tokenId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to store policy data');
      }

      setIsStoring(true);
      toast.success(data.message || 'Policy data stored successfully');
    } catch (error) {
      console.error('Error storing policy:', error);

      // Provide a more detailed error message for token ID extraction failures
      if (error instanceof Error && error.message.includes('Failed to extract token ID')) {
        toast.error(
          <div>
            <p>{error.message}</p>
            <p className="mt-2 text-sm">This usually happens when the transaction was successful but we couldn&apos;t extract the token ID from the logs.</p>
            <p className="mt-1 text-sm">Please check the browser console (F12) for more details and contact support with this information.</p>
          </div>
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to store policy data');
      }

      setIsStoring(false);
    }
  }, [address, chainId, formData, hash, txData, tokenId, addresses]);

  // Watch for transaction success and show success message
  useEffect(() => {
    if (isSuccess && hash) {
      storePolicyData();
      toast.success(
        <div>
          Policy tokenized successfully! <a href={getTransactionUrl(hash, chainId)} target="_blank" rel="noopener noreferrer" className="underline">View transaction</a>
        </div>
      );
    }
  }, [isSuccess, hash, chainId, storePolicyData]);

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
    if (!formData.jurisdiction) missingFields.push('Jurisdiction');
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

      console.log('Minting policy token with args:', mintArgs);

      // Mint the policy token using the user's wallet
      await mintPolicyToken(mintArgs);
      toast.loading('Pending chain confirmation...');
    } catch (error) {
      console.error('Error tokenizing policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to tokenize policy');
    } finally {
      setIsUploading(false);
    }
  };

  // Show success message when we have a transaction hash
  if (isSuccess && isStoring && hash) {
    toast.dismiss();
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
            <div className="space-y-4">
              <p className="text-sm">
                You can now use this tokenized policy as collateral for loans.
              </p>
              {tokenId && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium">Policy Token ID: <span className="font-bold">{tokenId}</span></p>
                </div>
              )}
            </div>
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
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleChange}
                placeholder="e.g., New York, USA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <div className="relative">
                <DatePicker
                  selected={formData.expiryDate ? new Date(formData.expiryDate) : null}
                  onChange={(date) => {
                    if (date) {
                      setFormData(prev => ({
                        ...prev,
                        expiryDate: date.toISOString().split('T')[0]
                      }));
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                  placeholderText="e.g., 2025-06-30"
                  required
                  calendarClassName="absolute z-50"
                  showPopperArrow={false}
                />
              </div>
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
              disabled={isUploading || isMinting || !isConnected || !formData.policyNumber || !formData.issuer || !formData.faceValue || !formData.jurisdiction || !formData.expiryDate}
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