import { NextResponse } from 'next/server';
import { supabase, getContractAddresses } from '@/lib/supabaseClient';

/**
 * GET handler for retrieving all policies
 * @returns JSON response with all policies
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') ? parseInt(searchParams.get('chainId')!) : 1337;

    // Get contract addresses from Supabase
    const addressObj = await getContractAddresses(chainId);

    // Fetch policies from Supabase
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching policies from Supabase:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      contractAddress: addressObj['TokenizedPolicy'],
      policies: data || []
    });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}
