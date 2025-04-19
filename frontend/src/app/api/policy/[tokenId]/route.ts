import { NextResponse } from 'next/server';
import { getPolicyTokenDetails, getTokenURI, getOwnerOf } from '@/lib/contractUtils';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  _request: Request,
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

    // Try to get data from Supabase first
    const { data: policyData, error } = await supabase
      .from('policies')
      .select('*')
      .eq('token_id', tokenId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error code
      console.error('Error fetching policy from Supabase:', error);
      throw error;
    }

    // If we found the policy in Supabase, return it
    if (policyData) {
      return NextResponse.json({
        success: true,
        tokenId,
        policy: policyData,
        source: 'supabase'
      });
    }

    // Otherwise, try to get data from the blockchain
    try {
      const policyDetails = await getPolicyTokenDetails(tokenId);
      const owner = await getOwnerOf(tokenId);
      const tokenURI = await getTokenURI(tokenId);

      // Format the response
      return NextResponse.json({
        success: true,
        tokenId,
        owner,
        tokenURI,
        policyDetails,
        source: 'blockchain'
      });
    } catch (blockchainError) {
      console.error('Error fetching from blockchain:', blockchainError);

      // If both Supabase and blockchain fail, return an error
      return NextResponse.json({
        success: false,
        error: 'Policy not found in database or blockchain',
        tokenId
      }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching policy details:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy details" },
      { status: 500 }
    );
  }
}
