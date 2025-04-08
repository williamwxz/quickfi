
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, Calendar, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Form schema
const tokenizeFormSchema = z.object({
  policyNumber: z.string().min(5, 'Policy number must be at least 5 characters'),
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Value must be a positive number',
  }),
  expiryDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, {
    message: 'Expiry date must be in the future',
  }),
});

type TokenizeFormValues = z.infer<typeof tokenizeFormSchema>;

const TokenizePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TokenizeFormValues>({
    resolver: zodResolver(tokenizeFormSchema),
    defaultValues: {
      policyNumber: '',
      value: '',
      expiryDate: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: TokenizeFormValues) => {
    if (!file) {
      toast.error('Please upload your insurance policy document');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success response simulation
      toast.success('Policy successfully tokenized!');
      
      // Reset form
      form.reset();
      setFile(null);
      
    } catch (error) {
      toast.error('Failed to tokenize policy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-quickfi-slate mb-2">Tokenize Your Insurance Policy</h1>
        <p className="text-gray-600">Convert your insurance policy into a digital asset on the blockchain</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Policy Information</CardTitle>
          <CardDescription>
            Upload your policy document and provide the required details to tokenize your insurance policy as an NFT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="document">Upload Policy Document</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                  {!file ? (
                    <>
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-1">PDF, JPG or PNG up to 10MB</p>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('document-upload')?.click()}
                        type="button"
                      >
                        Select File
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center mb-4 text-quickfi-blue">
                        <Upload className="h-6 w-6 mr-2" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setFile(null)}
                        type="button"
                        size="sm"
                      >
                        Change File
                      </Button>
                    </>
                  )}
                  <input
                    id="document-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your policy number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Value (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input className="pl-7" placeholder="0.00" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The face value of your insurance policy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Expiry Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="date" 
                          {...field}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                <Info className="text-quickfi-blue h-5 w-5 shrink-0 mt-0.5 mr-3" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-quickfi-slate mb-1">Important Information</p>
                  <p className="mb-2">By tokenizing your insurance policy, you're creating a digital representation of it on the blockchain. This allows you to use it as collateral.</p>
                  <p>This process doesn't affect your actual insurance coverage or terms.</p>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            className="bg-quickfi-blue hover:bg-quickfi-darkBlue text-white" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Tokenize Policy'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TokenizePage;
