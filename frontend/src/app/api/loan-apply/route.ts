import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Mock Perimeter Protocol ABI - in a real implementation, you would have the actual ABI
const perimeterProtocolABI = [
  "function assessCollateral(address tokenContract, uint256 tokenId, uint256 requestedAmount) external view returns (bool isEligible, uint256 maxLoanAmount, uint256 riskScore, uint256 interestRate)"
];

// Mock environment variables
const PERIMETER_PROTOCOL_ADDRESS = process.env.PERIMETER_PROTOCOL_ADDRESS || "0x9A5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed12c";
const PHAROS_RPC_URL = process.env.PHAROS_RPC_URL || "https://rpc.pharosnet.io";

// Risk score to interest rate mapping
const riskToInterestRate = (riskScore: number): number => {
  if (riskScore < 30) return 4.5; // Low risk
  if (riskScore < 70) return 5.5; // Medium risk
  return 6.5; // High risk
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Extract the necessary data
    const { 
      userAddress,
      tokenContractAddress,
      tokenId,
      requestedAmount,
      loanTermMonths = 12 // Default to 12 months if not specified
    } = data;
    
    if (!userAddress || !tokenContractAddress || !tokenId || !requestedAmount) {
      return NextResponse.json(
        { error: 'Missing required loan application data' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would call the Perimeter Protocol
    // For this mock, we'll simulate the risk assessment
    
    // Determine if loan amount is reasonable based on some simple rules
    const mockCollateralValue = 100000; // This would come from Plume Nexus in real implementation
    const maxLTV = 0.7; // 70% max Loan-to-Value ratio
    const maxLoanAmount = mockCollateralValue * maxLTV;
    
    // Calculate risk score (0-100, higher is riskier)
    const requestedLTV = requestedAmount / mockCollateralValue;
    const riskScore = Math.min(100, Math.floor(requestedLTV * 100) + Math.floor(Math.random() * 20));
    
    // Check if loan is eligible
    const isEligible = requestedAmount <= maxLoanAmount;
    
    // Determine interest rate based on risk score and loan term
    const baseInterestRate = riskToInterestRate(riskScore);
    
    // Adjust for loan term
    let interestRate = baseInterestRate;
    if (loanTermMonths <= 6) {
      interestRate -= 1.0; // Shorter loans get better rates
    } else if (loanTermMonths > 12) {
      interestRate += 1.0; // Longer loans have higher rates
    }
    
    // Finalize loan parameters
    const loanParams = {
      isEligible,
      maxLoanAmount,
      approvedAmount: isEligible ? requestedAmount : 0,
      riskScore,
      interestRate,
      loanTermMonths,
      collateralValue: mockCollateralValue,
      ltv: requestedLTV * 100, // Convert to percentage
      ltvMax: maxLTV * 100,
      // For convenience, calculate monthly payment
      monthlyPayment: calculateMonthlyPayment(
        isEligible ? requestedAmount : 0, 
        interestRate, 
        loanTermMonths
      ),
      // Mock application ID
      applicationId: 'LOAN-' + Math.floor(Math.random() * 1000000)
    };
    
    // Return the loan eligibility/approval status
    return NextResponse.json({
      message: loanParams.isEligible 
        ? 'Loan application approved' 
        : 'Loan application rejected',
      loanApplication: loanParams
    });
  } catch (error) {
    console.error('Error processing loan application:', error);
    return NextResponse.json(
      { error: 'Error processing loan application' },
      { status: 500 }
    );
  }
}

// Helper function to calculate monthly payment
function calculateMonthlyPayment(loanAmount: number, annualInterestRate: number, termMonths: number): number {
  if (loanAmount === 0 || termMonths === 0) return 0;
  
  const monthlyRate = annualInterestRate / 100 / 12;
  return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
} 