import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhatLocal } from '@/config/chains';
import { InsurancePolicyTokenABI } from '@/config/abi';

// Get contract address from environment variable
const contractAddress = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b"; // Fallback to example address

// Create a public client for read operations
const publicClient = createPublicClient({
  chain: hardhatLocal,
  transport: http(),
});

/**
 * GET handler for retrieving all policies owned by an address
 * @param request The incoming request
 * @param params Route parameters including owner address
 * @returns JSON response with owned policies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json(
        { error: "Missing owner address" },
        { status: 400 }
      );
    }

    // This is a simplified approach. In a real implementation, you would:
    // 1. Listen for Transfer events to the address
    // 2. Use a subgraph or indexer to efficiently query ownership
    // 3. Or implement a balanceOf + tokenOfOwnerByIndex pattern if the contract supports it

    // For now, we'll return a mock response
    // In a real implementation, you would query the blockchain for this data

    // Mock data for demonstration
    const mockOwnedTokens = [
      {
        tokenId: "1",
        value: "5000000000", // 5,000 USDC with 6 decimals
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      },
      {
        tokenId: "2",
        value: "10000000000", // 10,000 USDC with 6 decimals
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
      }
    ];

    // Format the response
    return NextResponse.json({
      success: true,
      owner: address,
      policies: mockOwnedTokens,
      // Note: This is a mock implementation. In a real application, you would
      // query the blockchain for the actual tokens owned by this address.
      isMockData: true
    });
  } catch (error) {
    console.error("Error fetching owned policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch owned policies" },
      { status: 500 }
    );
  }
}
