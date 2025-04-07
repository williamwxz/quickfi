import { NextRequest, NextResponse } from 'next/server';

// Simplified contract address from environment
const TOKEN_CONTRACT_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890";

// API route handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { policyNumber, faceValue, issuer, expiryDate, policyType, documentHash } = body;

    // Validate required fields
    if (!policyNumber || !faceValue || !issuer || !expiryDate || !policyType) {
      return NextResponse.json(
        { error: "Missing required policy information" },
        { status: 400 }
      );
    }

    // Simulate tokenization process
    // In a real implementation, this would interact with the blockchain
    
    // Generate a token ID
    const tokenId = Math.floor(Date.now() / 1000);
    
    // Mock successful tokenization
    return NextResponse.json({
      success: true,
      tokenId,
      contractAddress: TOKEN_CONTRACT_ADDRESS,
      policyDetails: {
        policyNumber,
        faceValue,
        issuer,
        expiryDate,
        policyType,
        documentHash: documentHash || "No document hash provided"
      },
      tokenizedDate: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error tokenizing policy:", error);
    return NextResponse.json(
      { error: "Failed to tokenize insurance policy" },
      { status: 500 }
    );
  }
} 