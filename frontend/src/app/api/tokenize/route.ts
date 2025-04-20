import { NextResponse } from 'next/server';
import { parseUnits } from 'viem';
import { storeTokenizedPolicy, PolicyData } from '@/lib/supabaseClient';

// API route handler
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      policyNumber,
      faceValue,
      issuer,
      expiryDate,
      documentHash,
      userAddress,
      chainId = 1337, // Default to localhost if not provided
      txHash,
      policyType = 'Life' // Default to Life insurance if not provided
    } = body;

    // Validate required fields
    if (!policyNumber || !faceValue || !issuer || !expiryDate || !userAddress) {
      return NextResponse.json(
        { error: "Missing required policy information" },
        { status: 400 }
      );
    }

    // Convert face value to the correct format (assuming 6 decimals for USDC)
    const valuationAmount = parseUnits(faceValue.toString(), 6);

    // Convert expiry date to timestamp
    const expiryTimestamp = BigInt(Math.floor(new Date(expiryDate).getTime() / 1000));

    // Convert document hash to bytes32 if provided
    const documentHashBytes32 = documentHash
      ? `0x${documentHash.padEnd(64, '0')}` as `0x${string}`
      : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

    // Store the policy data in Supabase
    const policyData: PolicyData = {
      chainId,
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
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Return formatted data for client-side minting
    return NextResponse.json({
      success: true,
      message: result.message,
      chainId,
      txHash: result.txHash || null,
      mintArgs: [
        userAddress as `0x${string}`, // to
        policyNumber, // policyNumber
        issuer as `0x${string}`, // issuer
        valuationAmount, // valuationAmount
        expiryTimestamp, // expiryDate
        documentHashBytes32 // documentHash
      ],
      policyDetails: {
        policyNumber,
        faceValue: valuationAmount.toString(),
        issuer,
        expiryDate: expiryTimestamp.toString(),
        documentHash: documentHash || "No document hash provided"
      }
    });
  } catch (error) {
    console.error("Error validating policy data:", error);
    return NextResponse.json(
      { error: "Failed to validate policy data" },
      { status: 500 }
    );
  }
}
