import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// API route handler
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { loanId, txHash } = body;

    // Validate input
    if (loanId === undefined) {
      return NextResponse.json(
        { error: "Missing required field: loanId" },
        { status: 400 }
      );
    }

    // Update loan status to 'active' in Supabase
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: 'active',
        // Update start_date and end_date based on current time and term_days
        start_date: new Date().toISOString()
      })
      .eq('loan_id', loanId)
      .select();

    if (error) {
      console.error("Error updating loan status:", error);
      return NextResponse.json(
        { error: `Failed to update loan status: ${error.message}` },
        { status: 500 }
      );
    }

    // If we have the loan data, update the end_date based on term_days
    if (data && data.length > 0) {
      const loan = data[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + loan.term_days);
      
      const { error: updateError } = await supabase
        .from('loans')
        .update({ 
          end_date: endDate.toISOString()
        })
        .eq('loan_id', loanId);

      if (updateError) {
        console.error("Error updating loan end date:", updateError);
        // We don't fail the request if end date update fails, just log it
      }
    }

    // Return a response with the updated loan data
    return NextResponse.json({
      success: true,
      message: "Loan activated successfully",
      loanId,
      data,
      txHash
    });
  } catch (error) {
    console.error("Error activating loan:", error);
    return NextResponse.json(
      { error: "Failed to activate loan" },
      { status: 500 }
    );
  }
}
