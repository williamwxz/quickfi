'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

const formSchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  policyValue: z.string().min(1, 'Policy value is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

const TokenizeClient = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policyNumber: '',
      policyValue: '',
      expiryDate: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form values:', values);
    console.log('Selected file:', selectedFile);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upload Policy Document</h2>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">PDF, JPG or PNG up to 10MB</p>
                  <Button type="button" variant="secondary" className="mt-2">
                    Select File
                  </Button>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  placeholder="Enter your policy number"
                  {...form.register('policyNumber')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="policyValue">Policy Value (USD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    id="policyValue"
                    type="number"
                    placeholder="0.00"
                    {...form.register('policyValue')}
                    className="pl-7"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">The face value of your insurance policy</p>
              </div>

              <div>
                <Label htmlFor="expiryDate">Policy Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...form.register('expiryDate')}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 text-blue-500">ℹ️</div>
                <h3 className="font-medium">Important Information</h3>
              </div>
              <p className="text-sm text-gray-600">
                By tokenizing your insurance policy, you&apos;re creating a digital representation of it on the blockchain.
                This allows you to use it as collateral.
              </p>
              <p className="text-sm text-gray-600">
                This process doesn&apos;t affect your actual insurance coverage or terms.
              </p>
            </div>

            <Button type="submit" className="w-full bg-[#1D4ED8] hover:bg-blue-700 text-white">
              Tokenize Policy
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function TokenizePage() {
  try {
    return <TokenizeClient />;
  } catch {
    // This error handling is only for build-time issues
    // At runtime, the component will work normally
    return <TokenizeClient />;
  }
} 