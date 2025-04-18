import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhatLocal } from '@/config/chains';
import { InsurancePolicyTokenABI } from '@/config/abi';

// Get contract address from environment variable
const TOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b"; // Fallback to example address

// Create a public client for read operations
const publicClient = createPublicClient({
  chain: hardhatLocal,
  transport: http(),
});

/**
 * GET handler for retrieving all policies
 * @param request The incoming request
 * @returns JSON response with all policies
 */
export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Query for all token IDs (e.g., using events or a subgraph)
    // 2. Fetch details for each token

    // For now, we'll return mock data
    // In a real implementation, you would query the blockchain for this data

    // Mock data for demonstration
    const mockPolicies = [
      {
        tokenId: "1",
        owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        value: "5000000000", // 5,000 USDC with 6 decimals
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        policyNumber: "POL-12345",
        issuer: "MetLife"
      },
      {
        tokenId: "2",
        owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        value: "10000000000", // 10,000 USDC with 6 decimals
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
        policyNumber: "POL-67890",
        issuer: "Prudential"
      }
    ];

    // Format the response
    return NextResponse.json({
      success: true,
      policies: mockPolicies,
      contractAddress: TOKEN_CONTRACT_ADDRESS,
      // Note: This is a mock implementation. In a real application, you would
      // query the blockchain for the actual tokens.
      isMockData: true
    });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}
