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
export async function fetchContractAddresses(chainId: number = 1337): Promise<Partial<ContractAddresses> | null> {
  console.log(`fetchContractAddresses called for chainId: ${chainId}`);
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Missing Supabase credentials');
      return null;
    }

    console.log('Querying Supabase for contract addresses...');
    const { data, error } = await supabase
      .from('contract_addresses')
      .select('contract_name, address')
      .eq('chain_id', chainId)
      .eq('is_current', true);

    if (error) {
      console.error('Error fetching contract addresses from Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`No contract addresses found for chain ID: ${chainId}`);
      return null;
    }

    console.log(`Found ${data.length} contract addresses for chain ID: ${chainId}`);
    console.log('Raw Supabase data:', data);

    const addresses: Partial<ContractAddresses> = {};
    data.forEach(item => {
      // Type assertion to ensure we're only adding valid keys
      addresses[item.contract_name as keyof ContractAddresses] = item.address;
      console.log(`Added contract address: ${item.contract_name} = ${item.address}`);
    });

    return addresses;
  } catch (error) {
    console.error('Error fetching contract addresses from Supabase:', error);
    return null;
  }
}

/**
 * Fallback function to get contract addresses from environment variables
 * @returns An object with contract names as keys and addresses as values
 */
export function getContractAddressesFromEnv(): ContractAddresses {
  // Use a safe way to access environment variables that works in both client and server components
  const envVars = {
    NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS,
    NEXT_PUBLIC_RISK_ENGINE_ADDRESS: process.env.NEXT_PUBLIC_RISK_ENGINE_ADDRESS,
    NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS: process.env.NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS,
    NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS: process.env.NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS,
    NEXT_PUBLIC_STABLECOIN_ADDRESS: process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS,
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    NEXT_PUBLIC_USDT_ADDRESS: process.env.NEXT_PUBLIC_USDT_ADDRESS,
  };

  // Log the environment variables for debugging
  console.log('Environment variables for contract addresses:', {
    TokenizedPolicy: envVars.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS,
    RiskEngine: envVars.NEXT_PUBLIC_RISK_ENGINE_ADDRESS,
    LoanOrigination: envVars.NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS,
    MorphoAdapter: envVars.NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS,
    Stablecoin: envVars.NEXT_PUBLIC_STABLECOIN_ADDRESS,
    USDC: envVars.NEXT_PUBLIC_USDC_ADDRESS,
    USDT: envVars.NEXT_PUBLIC_USDT_ADDRESS,
  });

  return {
    TokenizedPolicy: envVars.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS || '',
    RiskEngine: envVars.NEXT_PUBLIC_RISK_ENGINE_ADDRESS || '',
    LoanOrigination: envVars.NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS || '',
    MorphoAdapter: envVars.NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS || '',
    Stablecoin: envVars.NEXT_PUBLIC_STABLECOIN_ADDRESS || '',
    USDC: envVars.NEXT_PUBLIC_USDC_ADDRESS || '',
    USDT: envVars.NEXT_PUBLIC_USDT_ADDRESS || ''
  };
}

/**
 * Get contract addresses, first trying Supabase, then falling back to environment variables
 * @param chainId The blockchain chain ID to fetch addresses for
 * @returns An object with contract names as keys and addresses as values
 */
// Define the contract addresses type
type ContractAddresses = {
  TokenizedPolicy: string;
  RiskEngine: string;
  LoanOrigination: string;
  MorphoAdapter: string;
  Stablecoin: string;
  USDC: string;
  USDT: string;
};

export async function getContractAddresses(chainId: number = 1337): Promise<ContractAddresses> {
  console.log(`getContractAddresses called for chainId: ${chainId}`);

  const supabaseAddresses = await fetchContractAddresses(chainId);
  console.log('Supabase addresses:', supabaseAddresses);

  const envAddresses = getContractAddressesFromEnv();
  console.log('Environment addresses:', envAddresses);

  if (supabaseAddresses) {
    // Merge Supabase addresses with environment variables
    // Environment variables take precedence for USDC and USDT
    const mergedAddresses = {
      ...supabaseAddresses,
      USDC: envAddresses.USDC,
      USDT: envAddresses.USDT
    } as ContractAddresses;

    console.log('Merged addresses:', mergedAddresses);
    return mergedAddresses;
  }

  console.log('Using environment addresses only');
  return envAddresses as ContractAddresses;
}

/**
 * Interface for policy data
 */
export interface PolicyData {
  chainId: number;
  address: string;
  tokenId: number;
  policyNumber: string;
  issuer: string;
  policyType: string;
  faceValue: string;
  expiryDate: string;
  documentHash?: string;
  jurisdiction?: string;
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
          jurisdiction: policyData.jurisdiction || null,
          owner_address: policyData.ownerAddress,
          tx_hash: policyData.txHash || null,
          token_id: policyData.tokenId,
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
          token_id: policyData.tokenId || null,
          policy_number: policyData.policyNumber,
          issuer: policyData.issuer,
          policy_type: policyData.policyType,
          face_value: policyData.faceValue,
          expiry_date: expiryDate,
          document_hash: policyData.documentHash || null,
          jurisdiction: policyData.jurisdiction || null,
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
