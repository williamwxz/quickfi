import { createPublicClient, http } from 'viem';
import { hardhatLocal } from '@/config/chains';
import { InsurancePolicyTokenABI } from '@/config/abi';
import { getContractAddresses } from './supabaseClient';

// Get contract address from environment variable as fallback
const contractAddressFromEnv = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Fallback to local address

// This will be populated with the address from Supabase or env
let contractAddress = contractAddressFromEnv;

// Initialize contract addresses
async function initContractAddresses() {
  try {
    const addresses = await getContractAddresses('localhost');
    if (addresses && addresses.TokenizedPolicy) {
      contractAddress = addresses.TokenizedPolicy;
      console.log('Using contract address from Supabase:', contractAddress);
    } else {
      console.log('Using contract address from env:', contractAddress);
    }
  } catch (error) {
    console.error('Error initializing contract addresses:', error);
    console.log('Falling back to env contract address:', contractAddress);
  }
}

// Call the initialization function
initContractAddresses();

// Create a public client for read operations
const publicClient = createPublicClient({
  chain: hardhatLocal,
  transport: http(),
});

// Note: We're using direct contract calls with publicClient.readContract instead of a contract instance

/**
 * Get policy details from the smart contract
 * @param policyAddress The address of the policy token
 * @returns Policy details including owner, value, and expiry timestamp
 */
export async function getPolicyTokenDetails(policyAddress: string) {
  try {
    const details = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'getPolicyTokenDetails',
      args: [policyAddress],
    }) as [string, bigint, bigint]; // Type assertion for the returned tuple

    return {
      owner: details[0],
      value: details[1],
      expiryTimestamp: details[2],
    };
  } catch (error) {
    console.error('Error getting policy token details:', error);
    throw error;
  }
}

/**
 * Get policy metadata from the smart contract or database
 * @param policyAddress The address of the policy token
 * @returns Policy metadata as bytes or JSON
 */
export async function getPolicyMetadata(policyAddress: string) {
  try {
    // Query the blockchain for policy metadata

    // For on-chain tokens, we can use the address directly
    const metadata = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'getPolicyMetadata',
      args: [policyAddress], // Use the address directly instead of converting to BigInt
    });

    // In a real implementation, we might also check Supabase for off-chain tokens
    // if (chainId) {
    //   // Query Supabase for metadata using chainId and policyAddress
    //   const { data } = await supabase
    //     .from('policies')
    //     .select('metadata')
    //     .eq('chain_id', chainId)
    //     .eq('address', policyAddress)
    //     .single();
    //
    //   if (data?.metadata) {
    //     return data.metadata;
    //   }
    // }

    return metadata;
  } catch (error) {
    console.error('Error getting policy metadata:', error);
    throw error;
  }
}

/**
 * Get token URI from the smart contract
 * @param policyAddress The address of the policy token
 * @returns Token URI string
 */
export async function getTokenURI(policyAddress: string) {
  try {
    const uri = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'tokenURI',
      args: [policyAddress],
    });

    return uri;
  } catch (error) {
    console.error('Error getting token URI:', error);
    throw error;
  }
}

/**
 * Get owner of a policy token
 * @param policyAddress The address of the policy token
 * @returns Owner address
 */
export async function getOwnerOf(policyAddress: string) {
  try {
    const owner = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'ownerOf',
      args: [policyAddress],
    });

    return owner;
  } catch (error) {
    console.error('Error getting token owner:', error);
    throw error;
  }
}
