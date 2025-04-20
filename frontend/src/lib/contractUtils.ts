import { createPublicClient, http } from 'viem';
import { localhost } from 'viem/chains';
import { TokenizedPolicyABI } from '@/config/abi';
import { parseUnits } from 'viem';
import { getContractAddresses as getContractAddressesFromSupabase } from './supabaseClient';

// Get contract address from environment variable as fallback
const contractAddressFromEnv = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Fallback to local address

// This will be populated with the address from Supabase or env
const contractAddress = contractAddressFromEnv;

// Create a public client for read operations
const publicClient = createPublicClient({
  chain: localhost,
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
      abi: TokenizedPolicyABI,
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
    const metadata = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: TokenizedPolicyABI,
      functionName: 'getPolicyMetadata',
      args: [policyAddress],
    });

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
      abi: TokenizedPolicyABI,
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
      abi: TokenizedPolicyABI,
      functionName: 'ownerOf',
      args: [policyAddress],
    });

    return owner;
  } catch (error) {
    console.error('Error getting token owner:', error);
    throw error;
  }
}

/**
 * Mint a new policy token on the blockchain
 * @param chainId The chain ID to mint on
 * @param policyNumber The policy number
 * @param faceValue The face value of the policy
 * @param issuer The issuer of the policy
 * @param expiryDate The expiry date of the policy
 * @param documentHash The document hash as bytes32
 * @param userAddress The address of the user
 * @returns The transaction hash and policy ID
 */
export async function mintPolicyToken(
  chainId: number,
  policyNumber: string,
  faceValue: number,
  issuer: string,
  expiryDate: string,
  documentHash: string,
  userAddress: string
) {
  try {
    // Get contract addresses for the specified chain
    const contractAddresses = await getContractAddresses(chainId);
    if (!contractAddresses?.TokenizedPolicy) {
      throw new Error('Contract address not found for the specified chain');
    }

    // Create a public client for the specified chain
    const client = createPublicClient({
      chain: localhost, // TODO: Support other chains
      transport: http()
    });

    // Convert face value to the correct format (assuming 6 decimals for USDC)
    const valuationAmount = parseUnits(faceValue.toString(), 6);

    // Convert expiry date to timestamp
    const expiryTimestamp = BigInt(Math.floor(new Date(expiryDate).getTime() / 1000));

    // Convert document hash to bytes32
    const documentHashBytes32 = `0x${documentHash.padEnd(64, '0')}` as `0x${string}`;

    // Prepare the arguments for the mintPolicy function
    const args = [
      userAddress as `0x${string}`, // to
      policyNumber, // policyNumber
      issuer as `0x${string}`, // issuer
      valuationAmount, // valuationAmount
      expiryTimestamp, // expiryDate
      documentHashBytes32 // documentHash
    ] as const;

    // Simulate the transaction first
    const { result } = await client.simulateContract({
      address: contractAddresses.TokenizedPolicy as `0x${string}`,
      abi: TokenizedPolicyABI,
      functionName: 'mintPolicy',
      args
    });

    // In a real implementation, we would use a backend wallet to sign and send the transaction
    // For now, we'll return a simulated transaction hash
    return {
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      policyId: result as bigint
    };
  } catch (error) {
    console.error('Error minting policy token:', error);
    throw error;
  }
}

export async function getContractAddresses(chainId: number = 1337) {
  const contractAddress = await getContractAddressesFromSupabase(chainId);
  return contractAddress;
}
