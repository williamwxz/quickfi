import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// API route handler
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      policyAddress,
      policyTokenId,
      policyChainId,
      borrowerAddress,
      loanAmount,
      interestRate,
      termDays,
      stablecoin,
      txHash
    } = body;

    // Validate input
    if (!policyAddress || !borrowerAddress || !loanAmount || !termDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate due date
    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + termDays);

    // Generate a loan ID based on the transaction hash or random if not available
    const loanId = txHash
      ? parseInt(txHash.slice(-8), 16) % 10000
      : Math.floor(Math.random() * 10000) + 1;

    // Store loan data in Supabase
    const { data, error } = await supabase
      .from('loans')
      .insert([
        {
          chain_id: policyChainId,
          borrower_address: borrowerAddress,
          collateral_address: policyAddress,
          collateral_token_id: policyTokenId,
          loan_id: loanId,
          address: process.env.NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS || '',
          loan_amount: loanAmount,
          interest_rate: interestRate,
          term_days: termDays,
          start_date: startDate.toISOString(),
          end_date: dueDate.toISOString(),
          status: 'pending',
          stablecoin: stablecoin
        }
      ])
      .select();

    if (error) {
      console.error("Error storing loan data:", error);
      return NextResponse.json(
        { error: `Failed to store loan data: ${error.message}` },
        { status: 500 }
      );
    }

    // Update the policy status to 'used_as_collateral'
    const { error: policyError } = await supabase
      .from('policies')
      .update({ status: 'used_as_collateral' })
      .eq('address', policyAddress)
      .eq('chain_id', policyChainId)
      .eq('token_id', policyTokenId); // Add token_id to the query to ensure we're updating the correct policy

    if (policyError) {
      console.error("Error updating policy status:", policyError);
      // We don't fail the request if policy update fails, just log it
    }

    // Return a response with the created loan data
    return NextResponse.json({
      success: true,
      message: "Loan application processed successfully",
      loanId,
      data
    });
  } catch (error) {
    console.error("Error processing loan application:", error);
    return NextResponse.json(
      { error: "Failed to process loan application" },
      { status: 500 }
    );
  }
}
