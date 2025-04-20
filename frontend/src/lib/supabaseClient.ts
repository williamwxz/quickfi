import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

// For server-side operations that need admin privileges
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Create client only if URL is provided, otherwise use a mock
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch contract addresses from Supabase
 * @param chainId The blockchain chain ID to fetch addresses for
 * @returns An object with contract names as keys and addresses as values
 */
export async function fetchContractAddresses(chainId: number = 1337) {
  try {
    // Check if we have valid Supabase credentials
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Supabase credentials not provided, using environment variables');
      return null;
    }

    const { data, error } = await supabase
      .from('contract_addresses')
      .select('contract_name, address')
      .eq('chain_id', chainId)
      .eq('is_current', true);

    if (error) {
      console.error('Error fetching contract addresses:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`No contract addresses found for chain ID: ${chainId}`);
      return null;
    }

    // Convert the data to the expected format
    const addresses: Record<string, string> = {};
    data.forEach(item => {
      addresses[item.contract_name] = item.address;
    });

    return addresses;
  } catch (error) {
    console.error('Error fetching contract addresses:', error);
    return null;
  }
}

/**
 * Fallback function to get contract addresses from environment variables
 * @returns An object with contract names as keys and addresses as values
 */
export function getContractAddressesFromEnv() {
  return {
    TokenizedPolicy: process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS || '',
    RiskEngine: process.env.NEXT_PUBLIC_RISK_ENGINE_ADDRESS || '',
    LoanOrigination: process.env.NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS || '',
    MorphoAdapter: process.env.NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS || '',
    Stablecoin: process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS || ''
  };
}

/**
 * Get contract addresses, first trying Supabase, then falling back to environment variables
 * @param chainId The blockchain chain ID to fetch addresses for
 * @returns An object with contract names as keys and addresses as values
 */
export async function getContractAddresses(chainId: number = 1337) {
  const supabaseAddresses = await fetchContractAddresses(chainId);
  if (supabaseAddresses) {
    return supabaseAddresses;
  }

  return getContractAddressesFromEnv();
}

/**
 * Interface for policy data
 */
export interface PolicyData {
  chainId: number;
  policyNumber: string;
  issuer: string;
  policyType: string;
  faceValue: string;
  expiryDate: string;
  documentHash?: string;
  ownerAddress: string;
  txHash?: string;
}

/**
 * Store a tokenized policy in Supabase
 * @param policyData The policy data to store
 * @returns An object with success status and message or error
 */
export async function storeTokenizedPolicy(policyData: PolicyData) {
  try {
    // Use admin client if available, otherwise use regular client
    const client = supabaseAdmin || supabase;

    // Convert expiry date to ISO string
    const expiryDate = new Date(policyData.expiryDate).toISOString();

    // Insert the policy data
    const { error } = await client
      .from('tokenized_policies')
      .insert([
        {
          chain_id: policyData.chainId,
          policy_number: policyData.policyNumber,
          issuer: policyData.issuer,
          policy_type: policyData.policyType,
          face_value: policyData.faceValue,
          expiry_date: expiryDate,
          document_hash: policyData.documentHash || null,
          owner_address: policyData.ownerAddress,
          tx_hash: policyData.txHash || null,
          status: policyData.txHash ? 'pending' : 'draft', // Status based on whether txHash is provided
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Error storing policy data in Supabase:", error);
      return { success: false, error: "Failed to store policy data" };
    }

    return {
      success: true,
      message: "Policy data stored successfully",
      txHash: policyData.txHash
    };
  } catch (error) {
    console.error("Error storing policy data:", error);
    return { success: false, error: "Failed to store policy data" };
  }
}
