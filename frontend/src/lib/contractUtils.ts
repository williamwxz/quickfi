import { createPublicClient, http, getContract } from 'viem';
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

// Create contract instance
const policyContract = getContract({
  address: contractAddress as `0x${string}`,
  abi: InsurancePolicyTokenABI,
  publicClient,
});

/**
 * Get policy details from the smart contract
 * @param tokenId The token ID of the policy
 * @returns Policy details including owner, value, and expiry timestamp
 */
export async function getPolicyTokenDetails(tokenId: string) {
  try {
    const details = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'getPolicyTokenDetails',
      args: [BigInt(tokenId)],
    });

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
 * Get policy metadata from the smart contract
 * @param tokenId The token ID of the policy
 * @returns Policy metadata as bytes
 */
export async function getPolicyMetadata(tokenId: string) {
  try {
    const metadata = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'getPolicyMetadata',
      args: [BigInt(tokenId)],
    });

    return metadata;
  } catch (error) {
    console.error('Error getting policy metadata:', error);
    throw error;
  }
}

/**
 * Get token URI from the smart contract
 * @param tokenId The token ID of the policy
 * @returns Token URI string
 */
export async function getTokenURI(tokenId: string) {
  try {
    const uri = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    return uri;
  } catch (error) {
    console.error('Error getting token URI:', error);
    throw error;
  }
}

/**
 * Get owner of a policy token
 * @param tokenId The token ID of the policy
 * @returns Owner address
 */
export async function getOwnerOf(tokenId: string) {
  try {
    const owner = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: InsurancePolicyTokenABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });

    return owner;
  } catch (error) {
    console.error('Error getting token owner:', error);
    throw error;
  }
}
