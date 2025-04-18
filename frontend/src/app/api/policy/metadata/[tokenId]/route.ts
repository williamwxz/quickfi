import { NextRequest, NextResponse } from 'next/server';
import { getPolicyMetadata } from '@/lib/contractUtils';

/**
 * GET handler for retrieving policy metadata
 * @param request The incoming request
 * @param params Route parameters including tokenId
 * @returns JSON response with policy metadata
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

    // Get policy metadata from the smart contract
    const metadata = await getPolicyMetadata(tokenId);

    // Format the response
    return NextResponse.json({
      success: true,
      tokenId,
      metadata,
    });
  } catch (error) {
    console.error("Error fetching policy metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy metadata" },
      { status: 500 }
    );
  }
}
