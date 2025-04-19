import { NextResponse } from 'next/server';
import { getPolicyTokenDetails, getTokenURI, getOwnerOf } from '@/lib/contractUtils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    
    if (!tokenId) {
      return NextResponse.json(
        { error: "Missing token ID" },
        { status: 400 }
      );
    }

    // Get real data from the blockchain
    const policyDetails = await getPolicyTokenDetails(tokenId);
    const owner = await getOwnerOf(tokenId);
    const tokenURI = await getTokenURI(tokenId);

    // Format the response
    return NextResponse.json({
      success: true,
      tokenId,
      owner,
      tokenURI,
      policyDetails
    });
  } catch (error) {
    console.error("Error fetching policy details:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy details" },
      { status: 500 }
    );
  }
}
