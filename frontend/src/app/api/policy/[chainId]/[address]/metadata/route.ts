import { NextResponse } from 'next/server';
import { getPolicyMetadata } from '@/lib/contractUtils';

/**
 * GET handler for retrieving policy metadata
 * @param request The incoming request
 * @param params Route parameters including chainId and address
 * @returns JSON response with policy metadata
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const { chainId, address } = await params;
    
    if (!chainId) {
      return NextResponse.json(
        { error: "Missing chain ID" },
        { status: 400 }
      );
    }
    
    if (!address) {
      return NextResponse.json(
        { error: "Missing policy address" },
        { status: 400 }
      );
    }

    // Parse chainId to number
    const chainIdNum = parseInt(chainId, 10);
    if (isNaN(chainIdNum)) {
      return NextResponse.json(
        { error: "Invalid chain ID format" },
        { status: 400 }
      );
    }

    // Get policy metadata from the smart contract
    const metadata = await getPolicyMetadata(address);

    // Format the response
    return NextResponse.json({
      success: true,
      chainId: chainIdNum,
      address,
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
