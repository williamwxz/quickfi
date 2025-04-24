import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const url = new URL(request.url);
    const chainId = url.searchParams.get('chainId');

    if (!address) {
      return NextResponse.json(
        { error: "Missing borrower address" },
        { status: 400 }
      );
    }

    // Fetch loans from Supabase for this borrower
    let query = supabase
      .from('loans')
      .select('*')
      .eq('borrower_address', address);

    // Filter by chain ID if provided
    if (chainId) {
      query = query.eq('chain_id', parseInt(chainId));
    }

    // Execute the query with ordering
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching loans from Supabase:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      loans: data || []
    });
  } catch (error) {
    console.error('Error in GET loans by user:', error);
    return NextResponse.json(
      { error: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}
