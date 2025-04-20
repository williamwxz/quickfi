import { NextResponse } from 'next/server';
import { parseUnits } from 'viem';
import { storeTokenizedPolicy, PolicyData } from '@/lib/supabaseClient';

// API route handler
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    console.log('Tokenize request:', { policyNumber: body.policyNumber, issuer: body.issuer });

    const {
      address,
      policyNumber,
      faceValue,
      issuer,
      expiryDate,
      documentHash,
      userAddress,
      chainId = 1337,
      txHash,
      policyType = 'Life'
    } = body;

    // Validate required fields
    if (!policyNumber || !faceValue || !issuer || !expiryDate || !userAddress) {
      return NextResponse.json(
        { error: "Missing required policy information" },
        { status: 400 }
      );
    }

    // Convert values
    const valuationAmount = parseUnits(faceValue.toString(), 6);
    const expiryTimestamp = BigInt(Math.floor(new Date(expiryDate).getTime() / 1000));
    const documentHashBytes32 = documentHash
      ? `0x${documentHash.padEnd(64, '0')}` as `0x${string}`
      : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

    // Store the policy data in Supabase
    const policyData: PolicyData = {
      chainId,
      address,
      policyNumber,
      issuer,
      policyType,
      faceValue,
      expiryDate,
      documentHash: documentHash || undefined,
      ownerAddress: userAddress,
      txHash: txHash || undefined
    };

    const result = await storeTokenizedPolicy(policyData);

    if (!result.success) {
      console.error('Failed to store policy:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Return formatted data for client-side minting
    const response = {
      success: true,
      message: result.message,
      chainId,
      txHash: result.txHash || null,
      mintArgs: [
        userAddress as `0x${string}`,
        policyNumber,
        issuer as `0x${string}`,
        valuationAmount.toString(),
        expiryTimestamp.toString(),
        documentHashBytes32
      ],
      policyDetails: {
        policyNumber,
        faceValue: valuationAmount.toString(),
        issuer,
        expiryDate: expiryTimestamp.toString(),
        documentHash: documentHash || "No document hash provided"
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in tokenize API route:", error);
    return NextResponse.json(
      { error: "Failed to validate policy data" },
      { status: 500 }
    );
  }
}
