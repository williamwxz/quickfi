import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: "Missing owner address" },
        { status: 400 }
      );
    }

    // Fetch policies from Supabase for this owner
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('owner_address', address)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching policies from Supabase:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      owner: address,
      policies: data || []
    });
  } catch (error) {
    console.error("Error fetching owned policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch owned policies" },
      { status: 500 }
    );
  }
}
