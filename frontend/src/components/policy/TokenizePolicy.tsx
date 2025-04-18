'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useMintPolicyToken } from '@/hooks/useContractHooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-toastify';

export default function TokenizePolicy() {
  const { address, isConnected } = useAccount();
  const { mintPolicyToken, isLoading, isSuccess, error } = useMintPolicyToken();

  const [formData, setFormData] = useState({
    policyNumber: '',
    policyValue: '',
    expiryDate: '',
    issuer: '',
    documentHash: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet to tokenize a policy.');
      return;
    }

    try {
      // Convert form data to the format expected by the contract
      const expiryTimestamp = Math.floor(new Date(formData.expiryDate).getTime() / 1000);
      const policyValue = parseUnits(formData.policyValue, 6); // Assuming 6 decimals for USDC

      // Create metadata for the token
      const metadata = JSON.stringify({
        policyNumber: formData.policyNumber,
        issuer: formData.issuer,
        documentHash: formData.documentHash || 'No document hash provided',
      });

      // Call the contract function
      mintPolicyToken?.({
        args: [
          address, // to
          `ipfs://policy/${formData.policyNumber}`, // tokenURI (placeholder)
          policyValue, // policyValue
          BigInt(expiryTimestamp), // expiryTimestamp
          new TextEncoder().encode(metadata), // metadata as bytes
        ],
      });

    } catch (err) {
      console.error('Error tokenizing policy:', err);
      toast.error('Failed to tokenize policy. Please try again.');
    }
  };

  // Show success message when tokenization is successful
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
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
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
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
            <Label htmlFor="issuer">Issuer</Label>
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
            <Label htmlFor="policyValue">Policy Value (USDC)</Label>
            <Input
              id="policyValue"
              name="policyValue"
              type="number"
              value={formData.policyValue}
              onChange={handleChange}
              placeholder="e.g., 10000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentHash">Document Hash (optional)</Label>
            <Input
              id="documentHash"
              name="documentHash"
              value={formData.documentHash}
              onChange={handleChange}
              placeholder="e.g., ipfs://Qm..."
            />
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
  );
}
