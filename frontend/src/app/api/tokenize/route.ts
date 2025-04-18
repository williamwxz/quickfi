import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, createWalletClient, parseUnits } from 'viem';
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

// API route handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { policyNumber, faceValue, issuer, expiryDate, policyType, documentHash, userAddress } = body;

    // Validate required fields
    if (!policyNumber || !faceValue || !issuer || !expiryDate || !policyType || !userAddress) {
      return NextResponse.json(
        { error: "Missing required policy information" },
        { status: 400 }
      );
    }

    // In a real implementation, this would use a backend wallet to interact with the blockchain
    // For now, we'll return a simulated response but with the correct structure

    // Convert face value to the correct format (assuming 6 decimals for USDC)
    const valuationAmount = parseUnits(faceValue.toString(), 6);

    // Convert expiry date to timestamp
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);

    // Generate a token ID (in a real implementation, this would come from the blockchain)
    const tokenId = Math.floor(Date.now() / 1000);

    // Create metadata for the token
    const metadata = JSON.stringify({
      policyNumber,
      issuer,
      policyType,
      documentHash: documentHash || "No document hash provided"
    });

    // In a real implementation, we would call the contract's mintPolicyToken function
    // This would require a private key and proper transaction signing

    // Mock successful tokenization with the structure that matches what the contract would return
    return NextResponse.json({
      success: true,
      tokenId,
      contractAddress: TOKEN_CONTRACT_ADDRESS,
      policyDetails: {
        policyNumber,
        faceValue: valuationAmount.toString(),
        issuer,
        expiryDate: expiryTimestamp.toString(),
        policyType,
        documentHash: documentHash || "No document hash provided"
      },
      owner: userAddress,
      tokenizedDate: new Date().toISOString(),
      // Note: This is still a mock implementation. In a production environment,
      // you would need to properly sign and send the transaction using a backend wallet
      isMockData: true
    });
  } catch (error) {
    console.error("Error tokenizing policy:", error);
    return NextResponse.json(
      { error: "Failed to tokenize insurance policy" },
      { status: 500 }
    );
  }
}