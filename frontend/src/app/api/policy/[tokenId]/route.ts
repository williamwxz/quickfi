import { NextRequest, NextResponse } from 'next/server';
import { getPolicyTokenDetails, getTokenURI, getOwnerOf } from '@/lib/contractUtils';

/**
 * GET handler for retrieving policy details
 * @param request The incoming request
 * @param params Route parameters including tokenId
 * @returns JSON response with policy details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;
    
    if (!tokenId) {
      return NextResponse.json(
        { error: "Missing token ID" },
        { status: 400 }
      );
    }

    // Get policy details from the smart contract
    const [policyDetails, tokenURI, owner] = await Promise.all([
      getPolicyTokenDetails(tokenId),
      getTokenURI(tokenId),
      getOwnerOf(tokenId)
    ]);

    // Format the response
    return NextResponse.json({
      success: true,
      tokenId,
      owner,
      tokenURI,
      policyDetails: {
        value: policyDetails.value.toString(),
        expiryTimestamp: policyDetails.expiryTimestamp.toString(),
        expiryDate: new Date(Number(policyDetails.expiryTimestamp) * 1000).toISOString(),
      }
    });
  } catch (error) {
    console.error("Error fetching policy details:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy details" },
      { status: 500 }
    );
  }
}
