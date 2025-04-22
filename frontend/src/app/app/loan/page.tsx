'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';

import { WalletAuthCheck } from '@/components/auth/WalletAuthCheck';
import { useAccount, useChainId } from 'wagmi';
import { useCreateLoan, useSetApprovalForAll, useIsApprovedForAll } from '@/hooks/useContractHooks';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { toast } from 'react-toastify';
import { parseUnits } from 'viem';
import { LTV_PARAMS, DURATION_PARAMS, SUPPORTED_STABLECOINS, DEFAULT_STABLECOIN } from '@/config/loanParams';
import { getTokenConfig } from '@/config/tokens';
import { getExplorerUrl, getTransactionUrl } from '@/utils/explorer';

// Add dynamic flag to prevent static generation issues
export const dynamic = 'force-dynamic';

// Define the policy type
type Policy = {
  id: number;
  chain_id: number;
  address: string; // On-chain policy token address
  token_id: number;
  policy_number: string;
  face_value: number;
  expiry_date: string;
  owner_address: string;
  issuer: string;
  policy_type: string;
  status: string;
};

// Client component that uses useSearchParams
function LoanClientContent() {
  const searchParams = useSearchParams();
  const chainId = useChainId();
  const { address } = useAccount();
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedPolicyChainId, setSelectedPolicyChainId] = useState<number | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>(DEFAULT_STABLECOIN);
  const { createLoan, isLoading: isCreatingLoan, data: loanTxHash, isSuccess: isLoanCreated, txStatus: txStatus, txError: txError } = useCreateLoan();
  const { setApprovalForAll } = useSetApprovalForAll();
  const { addresses, refetch: refetchAddresses } = useContractAddresses();

  // Check if LoanOrigination address is loaded
  useEffect(() => {
    if (!addresses.LoanOrigination) {
      console.log('LoanOrigination address is undefined, will retry in 2 seconds');
      const timer = setTimeout(() => {
        // Force a re-render to try loading addresses again
        setIsProcessing(prev => !prev);
        setIsProcessing(prev => !prev);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [addresses]);
  // Only call useIsApprovedForAll if we have both addresses
  const shouldCheckApproval = !!address && !!addresses.LoanOrigination;
  const { data: isApprovedForAll = false, refetch: refetchApproval } = useIsApprovedForAll(
    shouldCheckApproval ? address : undefined,
    shouldCheckApproval ? addresses.LoanOrigination as `0x${string}` : undefined
  );

  // Just use isApprovedForAll for simplicity
  const isApproved = isApprovedForAll;

  // Debug approval status
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Approval status:', { isApproved, isApprovedForAll, address, loanOriginationAddress: addresses.LoanOrigination });
    }

    // Refresh approval status when component mounts or addresses change
    if (address && addresses.LoanOrigination) {
      refetchApproval();
    }
  }, [isApproved, isApprovedForAll, address, addresses.LoanOrigination, refetchApproval]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch policies from API
  useEffect(() => {
    async function fetchPolicies() {
      if (!address) return; // Don't fetch if user is not connected

      setLoading(true);
      try {
        const response = await fetch(`/api/policy/owner/${address}?chainId=${chainId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch policies');
        }

        // Filter active policies only
        if (data.policies) {
          const activePolicies = data.policies.filter((p: Policy) => p.status === 'active');
          setPolicies(activePolicies as Policy[]);
        }
      } catch (error) {
        console.error('Error fetching policies:', error);
        toast.error('Failed to load policies');
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, [address, chainId]); // Re-fetch when address or chain changes

  // Check for tokenId in URL query parameters
  useEffect(() => {
    if (!searchParams) return;

    const tokenId = searchParams.get('tokenId');

    if (tokenId && policies.length > 0) {
      // Find the policy with the matching token ID
      const policy = policies.find(p => p.token_id === Number(tokenId));

      if (policy) {
        setSelectedPolicyId(policy.token_id || 0);
        setLoanAmount(policy.face_value * 0.5);
        setSelectedPolicyChainId(policy.chain_id);
      }
    }
  }, [searchParams, policies]);

  // LTV = Loan to Value ratio
  const ltv = selectedPolicyId
    ? (loanAmount / (policies.find(p => p.token_id === selectedPolicyId)?.face_value || 1)) * 100
    : 0;

  // Check if LTV exceeds maximum
  const isLtvExceeded = ltv > LTV_PARAMS.MAX_LTV;
  const isLtvWarning = ltv > LTV_PARAMS.WARNING_THRESHOLD && ltv <= LTV_PARAMS.MAX_LTV;

  // Interest rate is fixed at 5% APR
  const interestRate = 5.00;

  // Calculate interest amount
  const interestAmount = (loanAmount * interestRate / 100) * (loanTerm / 365);

  // Calculate repayment amount
  const repaymentAmount = loanAmount + interestAmount;

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanTerm);

  // Watch for transaction status
  useEffect(() => {
    if (!loanTxHash) return;

    // Show initial processing toast
    if (!toast.isActive('loan-processing')) {
      toast.loading('Processing loan request...', { toastId: 'loan-processing' });
    }

    // Handle transaction failure
    if (txError) {
      console.error('Loan transaction failed:', txError);
      toast.update('loan-processing', {
        render: (
          <div className="text-red-500">
            Loan request failed: {txError instanceof Error ? txError.message : 'Transaction reverted'}. 
            <a href={getTransactionUrl(loanTxHash, chainId)} target="_blank" rel="noopener noreferrer" className="underline ml-1">
              View transaction
            </a>
          </div>
        ),
        type: 'error',
        autoClose: 5000,
        isLoading: false
      });
      return;
    }

    // Handle successful transaction
    if (isLoanCreated && txStatus === 'success') {
      // Get the selected policy
      const policy = policies.find(p => p.token_id === selectedPolicyId);

      if (policy) {
        // Store loan data via API
        (async () => {
          try {
            const response = await fetch('/api/loan-apply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                policyAddress: policy.address,
                policyTokenId: policy.token_id,
                policyChainId: policy.chain_id,
                borrowerAddress: address,
                loanAmount: loanAmount,
                interestRate: interestRate,
                termDays: loanTerm,
                stablecoin: selectedStablecoin,
                transactionHash: loanTxHash
              }),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || 'Failed to store loan data');
            }

            // Update the existing toast with success message
            toast.update('loan-processing', {
              render: (
                <div className="text-green-500">
                  Loan created successfully! <a href={getTransactionUrl(loanTxHash, chainId)} target="_blank" rel="noopener noreferrer" className="underline">View transaction</a>
                </div>
              ),
              type: 'success',
              autoClose: 5000,
              isLoading: false
            });

            // Redirect to dashboard after successful loan creation
            setTimeout(() => {
              window.location.href = '/app/dashboard';
            }, 3000);
          } catch (apiError) {
            console.error('Error storing loan data via API:', apiError);
            // Update the existing toast with warning message
            toast.update('loan-processing', {
              render: (
                <div className="text-yellow-500">
                  Loan initiated on blockchain but failed to store in database: {apiError instanceof Error ? apiError.message : String(apiError)}
                </div>
              ),
              type: 'warning',
              autoClose: 5000,
              isLoading: false
            });
          }
        })();
      }
    }
  }, [loanTxHash, txStatus, txError, isLoanCreated, chainId, selectedPolicyId, policies, address, loanAmount, interestRate, loanTerm, selectedStablecoin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPolicyId) {
      toast.error('Please select a policy to use as collateral');
      return;
    }

    // Validate loan term
    if (loanTerm < DURATION_PARAMS.MIN_DURATION_DAYS) {
      toast.error(`Loan term must be at least ${DURATION_PARAMS.MIN_DURATION_DAYS} days`);
      return;
    }

    if (loanTerm > DURATION_PARAMS.MAX_DURATION_DAYS) {
      toast.error(`Loan term cannot exceed ${DURATION_PARAMS.MAX_DURATION_DAYS} days`);
      return;
    }

    try {
      setIsProcessing(true);

      // Get the selected policy
      const policy = policies.find(p => p.token_id === selectedPolicyId);

      if (!policy) {
        toast.error('Selected policy not found');
        return;
      }

      // Validate policy data
      if (!policy.face_value || policy.face_value <= 0) {
        toast.error('Policy has invalid face value');
        return;
      }

      // Check if policy is expired
      const expiryDate = new Date(policy.expiry_date);
      if (expiryDate < new Date()) {
        toast.error('Policy is expired and cannot be used as collateral');
        return;
      }

      // Convert loan amount to BigInt with 6 decimals (for USDC/USDT)
      const loanAmountBigInt = parseUnits(loanAmount.toString(), 6);

      // Convert loan term from days to seconds
      const loanTermSeconds = BigInt(loanTerm * 24 * 60 * 60);
      if (process.env.NODE_ENV === 'development') {
        console.log('Loan term in days:', loanTerm);
        console.log('Loan term in seconds:', loanTermSeconds);
      }

      // Get stablecoin address based on selection
      let stablecoinAddress;
      if (selectedStablecoin === 'USDT') {
        stablecoinAddress = addresses.USDT;
        if (process.env.NODE_ENV === 'development') {
          console.log('Using USDT address:', stablecoinAddress);
        }
      } else {
        stablecoinAddress = addresses.USDC;
        if (process.env.NODE_ENV === 'development') {
          console.log('Using USDC address:', stablecoinAddress);
        }
      }

      if (!stablecoinAddress) {
        console.error('Stablecoin address not found:', {
          selectedStablecoin,
          addresses
        });
        toast.error(`${selectedStablecoin} address not configured`);
        setIsProcessing(false);
        return;
      }

      // Ensure the policy token is approved for transfer
      if (!isApproved) {
        toast.error('Please approve the policy token first');
        setIsProcessing(false);
        return;
      }

      // Log all parameters for debugging
      console.log('Creating loan with parameters:', {
        collateralToken: policy.address,
        collateralTokenId: policy.token_id,
        principal: loanAmountBigInt.toString(),
        duration: loanTermSeconds.toString(),
        stablecoin: stablecoinAddress
      });

      try {
        // Call the createLoan function from our hook
        await createLoan([
          policy.address as `0x${string}`, // collateralToken
          BigInt(policy.token_id), // collateralTokenId
          loanAmountBigInt, // principal
          loanTermSeconds, // duration
          stablecoinAddress as `0x${string}` // stablecoin
        ] as [`0x${string}`, bigint, bigint, bigint, `0x${string}`]);
      } catch (error) {
        console.error('Detailed loan creation error:', error);

        // Extract more detailed error message
        let errorMessage = 'Failed to create loan';
        if (error instanceof Error) {
          errorMessage = error.message;

          // Check for common error patterns
          if (errorMessage.includes('user rejected')) {
            errorMessage = 'Transaction was rejected by the user';
          } else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds to complete the transaction';
          } else if (errorMessage.includes('execution reverted')) {
            errorMessage = 'Transaction reverted by the smart contract. This could be due to insufficient policy valuation, unsupported stablecoin, or policy token not properly approved.';
          }
        }

        toast.update('loan-processing', {
          render: errorMessage,
          type: 'error',
          autoClose: 5000,
          isLoading: false
        });

        setIsProcessing(false);
        return;
      }

      // Show a message that the transaction is being processed
      if (!toast.isActive('loan-processing')) {
        toast.loading('Loan application submitted! Waiting for blockchain confirmation...', {
          toastId: 'loan-processing', // Add a unique ID to reference this toast later
        });
      }
    } catch (error) {
      console.error('Error submitting loan application:', error);
      // Only show an error toast if there's no loan-processing toast yet
      // The useEffect for loanError will handle showing the error for transaction failures
      toast.update('loan-processing', {
        render: `Error submitting loan application: ${error instanceof Error ? error.message : 'Failed to create loan'}`,
        type: 'error',
        autoClose: 5000,
        isLoading: false
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Apply for a Stablecoin Loan</h1>
        <p className="text-gray-600">Use your tokenized insurance policies as collateral</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Select Collateral</h2>
                    <p className="text-sm text-gray-500 mb-4">Choose a tokenized policy to use as collateral for your loan</p>

                    {loading ? (
                      <div className="text-center py-8">
                        <p>Loading policies...</p>
                      </div>
                    ) : policies.length === 0 ? (
                      <div className="text-center py-8">
                        <p>No active policies found. Please tokenize a policy first.</p>
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedPolicyId ? selectedPolicyId.toString() : ''}
                        onValueChange={(value) => setSelectedPolicyId(Number(value))}
                      >
                        <div className="space-y-4">
                          {policies.map((policy) => (
                            <div key={policy.token_id} className="flex items-center space-x-3 p-4 rounded-lg border">
                              <RadioGroupItem value={policy.token_id?.toString() || ''} id={policy.token_id?.toString() || ''} />
                              <Label htmlFor={policy.token_id?.toString() || ''} className="flex flex-1 justify-between cursor-pointer">
                                <div>
                                  <div className="font-medium">Policy #{policy.token_id || 'N/A'}</div>
                                  <div className="text-sm text-gray-500">Policy: {policy.policy_number}</div>
                                  <div className="text-sm text-gray-500">Issuer: {policy.issuer}</div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${policy.face_value < 1000 ? 'text-red-500' : ''}`}>
                                    ${policy.face_value.toLocaleString()}
                                    {policy.face_value < 1000 && (
                                      <div className="text-xs text-red-500">(Low value)</div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Expires: {new Date(policy.expiry_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
                    <p className="text-sm text-gray-500 mb-4">Select your loan amount and term</p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="stablecoin">Stablecoin</Label>
                        <div className="relative mt-1">
                          <Select.Root value={selectedStablecoin} onValueChange={setSelectedStablecoin}>
                            <Select.Trigger
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              aria-label="Stablecoin"
                            >
                              <Select.Value placeholder="Select stablecoin">
                                {selectedStablecoin && (
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={getTokenConfig(selectedStablecoin).logoUrl}
                                      alt={selectedStablecoin}
                                      width={20}
                                      height={20}
                                    />
                                    {selectedStablecoin}
                                  </div>
                                )}
                              </Select.Value>
                              <Select.Icon>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content
                                className="overflow-hidden bg-white rounded-md shadow-lg z-50 border"
                                position="popper"
                              >
                                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                                  <ChevronUp className="h-4 w-4" />
                                </Select.ScrollUpButton>
                                <Select.Viewport className="p-1">
                                  {SUPPORTED_STABLECOINS.map((coin) => (
                                    <Select.Item
                                      key={coin}
                                      value={coin}
                                      className="relative flex items-center px-8 py-2 rounded-sm text-sm data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 outline-none cursor-pointer"
                                    >
                                      <Select.ItemText>
                                        <div className="flex items-center gap-2">
                                          <Image
                                            src={getTokenConfig(coin).logoUrl}
                                            alt={coin}
                                            width={20}
                                            height={20}
                                          />
                                          {coin}
                                        </div>
                                      </Select.ItemText>
                                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                                        <Check className="h-4 w-4" />
                                      </Select.ItemIndicator>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                                  <ChevronDown className="h-4 w-4" />
                                </Select.ScrollDownButton>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="loanAmount">Loan Amount ({selectedStablecoin})</Label>
                        <Input
                          id="loanAmount"
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                          min="0"
                          step="100"
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="loanTerm">Loan Term (Days)</Label>
                        <Input
                          id="loanTerm"
                          type="number"
                          value={loanTerm}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= DURATION_PARAMS.MIN_DURATION_DAYS && value <= DURATION_PARAMS.MAX_DURATION_DAYS) {
                              setLoanTerm(value);
                            }
                          }}
                          min={DURATION_PARAMS.MIN_DURATION_DAYS}
                          max={DURATION_PARAMS.MAX_DURATION_DAYS}
                          placeholder="30"
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Minimum: {DURATION_PARAMS.MIN_DURATION_DAYS} days, Maximum: {DURATION_PARAMS.MAX_DURATION_DAYS} days
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mt-6">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium">Loan Terms</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            The total loan amount can be up to {LTV_PARAMS.MAX_LTV}% of the policy&apos;s cash value. As interest accrues,
                            the total loan amount increases as well. When it exceeds {LTV_PARAMS.LIQUIDATION_THRESHOLD}% of the cash value,
                            the platform will trigger the liquidation mechanism.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Loan Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Collateral:</span>
                  {selectedPolicyId ? (
                    <a
                      href={getExplorerUrl(policies.find(p => p.token_id === selectedPolicyId)?.address || '', selectedPolicyChainId || undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Policy #{selectedPolicyId || 'N/A'}
                    </a>
                  ) : (
                    <span className="font-medium">-</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loan Amount:</span>
                  <span className="font-medium">${loanAmount.toLocaleString()} {selectedStablecoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Term:</span>
                  <span className="font-medium">{loanTerm} days</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">LTV Ratio:</span>
                  <span className={`font-medium ${
                    isLtvExceeded ? 'text-red-500' : isLtvWarning ? 'text-amber-500' : 'text-green-500'
                  }`}>
                    {ltv.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest Rate (APR):</span>
                  <span className="font-medium">{interestRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest Amount:</span>
                  <span className="font-medium">${interestAmount.toFixed(2)} {selectedStablecoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Repayment Amount:</span>
                  <span className="font-semibold">${repaymentAmount.toFixed(2)} {selectedStablecoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium">{dueDate.toLocaleDateString()}</span>
                </div>

                <div className="mt-4">
                  <>
                    <Button
                      type="submit"
                      className="w-full bg-[#1D4ED8] hover:bg-blue-700 text-white mt-4"
                      disabled={!selectedPolicyId || loanAmount <= 0 || ltv > LTV_PARAMS.MAX_LTV || isProcessing || isCreatingLoan || !isApproved}
                      onClick={handleSubmit}
                    >
                      {isProcessing || isCreatingLoan ? 'Processing...' : `Apply for ${selectedStablecoin} Loan`}
                    </Button>


                  </>
                </div>

                {/* Show approval button if needed */}
                {!isApproved && selectedPolicyId && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={isProcessing || isCreatingLoan || !addresses.LoanOrigination}
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          // Show a message that we're requesting approval
                          toast.loading('Requesting approval to use your policy token...', {
                            toastId: 'approval-processing',
                          });

                          // Get the selected policy
                          const policy = policies.find(p => p.token_id === selectedPolicyId);
                          if (!policy) {
                            throw new Error('Selected policy not found');
                          }

                          // Request approval for the loan origination contract to transfer all policy tokens
                          await setApprovalForAll(addresses.LoanOrigination as string, true);

                          // Add a small delay to allow the blockchain to update
                          await new Promise(resolve => setTimeout(resolve, 2000));

                          // Refresh the approval status
                          await refetchApproval();

                          // Update the toast with success message
                          toast.update('approval-processing', {
                            render: 'Policy token approved successfully!',
                            type: 'success',
                            autoClose: 3000,
                            isLoading: false
                          });
                        } catch (error) {
                          // Update the toast with error message
                          toast.update('approval-processing', {
                            render: `Failed to approve policy token: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            type: 'error',
                            autoClose: 5000,
                            isLoading: false
                          });
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                    >
                      {isProcessing ? 'Processing...' : 'Approve All Policy Tokens'}
                    </Button>
                  </div>
                )}

                {/* Contract address loading message */}
                {!addresses.LoanOrigination && selectedPolicyId && (
                  <div className="mt-2">
                    <p className="text-xs text-amber-600 flex items-center">
                      <Info className="inline-block w-3 h-3 mr-1" />
                      Loading contract addresses... Please wait.
                    </p>
                    <button
                      onClick={() => refetchAddresses()}
                      className="text-xs text-blue-600 hover:underline mt-1"
                      type="button"
                    >
                      Refresh contract addresses
                    </button>
                  </div>
                )}

                {/* Approval needed message */}
                {addresses.LoanOrigination && !isApprovedForAll && selectedPolicyId && (
                  <div className="mt-2">
                    <p className="text-xs text-amber-600 flex items-center">
                      <Info className="inline-block w-3 h-3 mr-1" />
                      You need to approve the loan contract to use your policy tokens
                    </p>
                    <button
                      onClick={() => refetchApproval()}
                      className="text-xs text-blue-600 hover:underline mt-1"
                      type="button"
                    >
                      Check approval status
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// This is a client component that checks if the user is connected
function ClientLoanPage() {
  const { isConnected } = useAccount();

  // If the user is not connected, we'll show the WalletAuthCheck component
  // which will handle showing the connect wallet UI
  if (!isConnected) {
    return (
      <WalletAuthCheck>
        <div></div>
      </WalletAuthCheck>
    );
  }

  // If the user is connected, we'll show the loan content
  return <LoanClientContent />;
}

export default function LoanPage() {
  return <ClientLoanPage />;
}