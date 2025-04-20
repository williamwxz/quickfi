import { NextResponse } from 'next/server';
import { getPolicyTokenDetails, getTokenURI, getOwnerOf } from '@/lib/contractUtils';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const { chainId, address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { error: "Missing policy address" },
        { status: 400 }
      );
    }

    if (!chainId) {
      return NextResponse.json(
        { error: "Missing chain ID" },
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

    // Try to get data from Supabase first
    const { data: policyData, error } = await supabase
      .from('policies')
      .select('*')
      .eq('address', address)
      .eq('chain_id', chainIdNum)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error code
      console.error('Error fetching policy from Supabase:', error);
      throw error;
    }

    // If we found the policy in Supabase, return it
    if (policyData) {
      return NextResponse.json({
        success: true,
        chainId: chainIdNum,
        address,
        policy: policyData,
        source: 'supabase'
      });
    }

    // Otherwise, try to get data from the blockchain
    try {
      const policyDetails = await getPolicyTokenDetails(address);
      const owner = await getOwnerOf(address);
      const tokenURI = await getTokenURI(address);

      // Format the response
      return NextResponse.json({
        success: true,
        chainId: chainIdNum,
        address,
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
        chainId: chainIdNum,
        address
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
