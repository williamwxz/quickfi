import { NextRequest, NextResponse } from 'next/server';

// API route handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { tokenId, requestedAmount, duration, purpose } = body;

    // Validate input
    if (!tokenId || !requestedAmount || !duration) {
      return NextResponse.json(
        { error: "Missing required fields: tokenId, requestedAmount, duration" },
        { status: 400 }
      );
    }

    // Simulate loan application processing
    // In a real implementation, this would interact with the blockchain

    // Mock review process and application ID
    const applicationId = `app-${Date.now()}`;
    const approvedAmount = Math.min(parseFloat(requestedAmount), 10000); // Mock approval logic

    // Mock successful response
    return NextResponse.json({
      success: true,
      applicationId,
      tokenId,
      requestedAmount,
      approvedAmount,
      duration,
      purpose,
      status: "pending",
      applicationDate: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error processing loan application:", error);
    return NextResponse.json(
      { error: "Failed to process loan application" },
      { status: 500 }
    );
  }
} 