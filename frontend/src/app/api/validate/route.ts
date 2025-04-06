import { NextRequest, NextResponse } from 'next/server';

// Simple validation rules for insurance documents
const validInsurers = [
  'MetLife', 
  'Prudential', 
  'New York Life', 
  'Allstate', 
  'State Farm', 
  'Blue Cross', 
  'Sample Insurance Co.'
];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Extract metadata to validate
    const { metadata } = data;
    
    if (!metadata) {
      return NextResponse.json(
        { error: 'No metadata provided' },
        { status: 400 }
      );
    }
    
    // Validate policy number (simple pattern check)
    const hasPolicyNumber = metadata.policyNumber && 
      /^[A-Z0-9\-]{5,20}$/.test(metadata.policyNumber);
    
    // Validate insurer (check against known insurers)
    const hasValidInsurer = metadata.insurer && 
      validInsurers.includes(metadata.insurer);
    
    // Validate declared value (must be a positive number)
    const hasValidValue = metadata.declaredValue && 
      Number(metadata.declaredValue) > 0;
    
    // Validate expiry date (must be in the future)
    const hasValidExpiryDate = metadata.expiryDate && 
      new Date(metadata.expiryDate) > new Date();
    
    // Aggregate all validation results
    const validationResults = {
      policyNumber: hasPolicyNumber,
      insurer: hasValidInsurer,
      declaredValue: hasValidValue,
      expiryDate: hasValidExpiryDate,
      // Overall validation status
      isValid: hasPolicyNumber && hasValidInsurer && hasValidValue && hasValidExpiryDate
    };
    
    // Return validation results
    return NextResponse.json({
      message: validationResults.isValid 
        ? 'Document is valid' 
        : 'Document validation failed',
      validationResults,
      // If valid, include enriched metadata (for next steps)
      ...(validationResults.isValid && { 
        enrichedMetadata: {
          ...metadata,
          // Additional fields we might want to add
          verificationTimestamp: new Date().toISOString(),
          verificationMethod: 'automated'
        }
      })
    });
  } catch (error) {
    console.error('Error validating document:', error);
    return NextResponse.json(
      { error: 'Error validating document' },
      { status: 500 }
    );
  }
} 