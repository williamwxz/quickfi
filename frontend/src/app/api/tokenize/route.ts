import { NextResponse } from 'next/server';
import { parseUnits } from 'viem';

// Get contract address from environment variable
const TOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b"; // Fallback to example address

// API route handler
export async function POST(request: Request) {
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

    // Convert face value to the correct format (assuming 6 decimals for USDC)
    const valuationAmount = parseUnits(faceValue.toString(), 6);

    // Convert expiry date to timestamp
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);

    // Generate a policy address as an Ethereum address
    // In a real implementation, this would be the address of the token contract or NFT
    // For now, we'll generate a deterministic address based on the policy details
    const policyHash = `${policyNumber}${issuer}${expiryTimestamp}`;
    const hashBase = policyHash.split('').map(c => c.charCodeAt(0).toString(16)).join('');
    const policyAddress = `0x${hashBase.padEnd(40, '0')}`.substring(0, 42);

    // Return a simple response
    return NextResponse.json({
      success: true,
      message: "Policy tokenization would be processed in production",
      contractAddress: TOKEN_CONTRACT_ADDRESS,
      address: policyAddress, // Policy token address
      policyDetails: {
        policyNumber,
        faceValue: valuationAmount.toString(),
        issuer,
        expiryDate: expiryTimestamp.toString(),
        policyType,
        documentHash: documentHash || "No document hash provided"
      },
      owner: userAddress
    });
  } catch (error) {
    console.error("Error tokenizing policy:", error);
    return NextResponse.json(
      { error: "Failed to tokenize insurance policy" },
      { status: 500 }
    );
  }
}
