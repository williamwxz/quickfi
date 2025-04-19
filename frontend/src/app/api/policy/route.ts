import { NextResponse } from 'next/server';
import { supabase, getContractAddresses } from '@/lib/supabaseClient';

// Initialize with fallback address
let TOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS ||
  "0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b"; // Fallback to example address

// Function to initialize contract address
async function initContractAddress() {
  try {
    const addresses = await getContractAddresses('localhost');
    if (addresses) {
      // Convert to a regular object to avoid type issues
      const addressObj = addresses as Record<string, string>;

      // Try both possible contract names
      if (addressObj['TokenizedPolicy']) {
        TOKEN_CONTRACT_ADDRESS = addressObj['TokenizedPolicy'];
        console.log('API using TokenizedPolicy address from Supabase:', TOKEN_CONTRACT_ADDRESS);
      } else if (addressObj['InsurancePolicyToken']) {
        TOKEN_CONTRACT_ADDRESS = addressObj['InsurancePolicyToken'];
        console.log('API using InsurancePolicyToken address from Supabase:', TOKEN_CONTRACT_ADDRESS);
      }
    }
  } catch (error) {
    console.error('Error initializing contract address in API:', error);
  }
}

/**
 * GET handler for retrieving all policies
 * @returns JSON response with all policies
 */
export async function GET() {
  // Initialize contract address before processing request
  await initContractAddress();

  try {
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
      contractAddress: TOKEN_CONTRACT_ADDRESS,
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
