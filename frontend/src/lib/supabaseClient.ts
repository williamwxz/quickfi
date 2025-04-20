import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
}

// For server-side operations that need admin privileges
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Export admin client for use in server-side operations
export { supabaseAdmin };

// Create client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch contract addresses from Supabase
 * @param chainId The blockchain chain ID to fetch addresses for
 * @returns An object with contract names as keys and addresses as values
 */
export async function fetchContractAddresses(chainId: number = 1337) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
      return null;
    }

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
  address: string;
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
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Supabase credentials not configured' };
    }

    const expiryDate = new Date(policyData.expiryDate).toISOString();

    // First check if policy already exists
    const { data: existingPolicy } = await supabase
      .from('policies')
      .select('*')
      .eq('chain_id', policyData.chainId)
      .eq('address', policyData.address)
      .single();

    if (existingPolicy) {
      // If policy exists, update it instead of inserting
      const { error: updateError } = await supabase
        .from('policies')
        .update({
          policy_number: policyData.policyNumber,
          issuer: policyData.issuer,
          policy_type: policyData.policyType,
          face_value: policyData.faceValue,
          expiry_date: expiryDate,
          document_hash: policyData.documentHash || null,
          owner_address: policyData.ownerAddress,
          tx_hash: policyData.txHash || null,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('chain_id', policyData.chainId)
        .eq('address', policyData.address);

      if (updateError) {
        console.error("Error updating policy:", updateError.message);
        return { success: false, error: updateError.message };
      }

      return {
        success: true,
        message: "Policy data updated successfully",
        txHash: policyData.txHash
      };
    }

    // If policy doesn't exist, insert new record
    const { error: insertError } = await supabase
      .from('policies')
      .insert([
        {
          chain_id: policyData.chainId,
          address: policyData.address,
          policy_number: policyData.policyNumber,
          issuer: policyData.issuer,
          policy_type: policyData.policyType,
          face_value: policyData.faceValue,
          expiry_date: expiryDate,
          document_hash: policyData.documentHash || null,
          owner_address: policyData.ownerAddress,
          tx_hash: policyData.txHash || null,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error("Error storing policy:", insertError.message);
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      message: "Policy data stored successfully",
      txHash: policyData.txHash
    };
  } catch (error) {
    console.error("Error storing policy:", error);
    return { success: false, error: "Failed to store policy data" };
  }
}
