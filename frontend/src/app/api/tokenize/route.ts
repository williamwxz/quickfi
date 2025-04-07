import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { InsurancePolicyTokenABI } from '../../../config/abi';

// Environment variables
const INSURANCE_POLICY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS || "0x8B5CF6696FbFc30B7a8ABCB8E4E1cb73416Ed96b";
const PHAROS_RPC_URL = process.env.PHAROS_RPC_URL || "https://rpc.pharosnet.io";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Extract the necessary data
    const { userAddress, policyMetadata } = data;
    
    if (!userAddress || !policyMetadata) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would use a private key from env
    // For this mock, we'll just simulate the tokenization
    
    // Create a mock token ID
    const tokenId = Math.floor(Math.random() * 1000000);
    
    // Calculate policy expiry timestamp
    const expiryDate = new Date(policyMetadata.expiryDate);
    const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);
    
    // Simulate a blockchain transaction
    const txHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Mock token URI (would point to IPFS in real implementation)
    const tokenURI = `ipfs://Qm${[...Array(44)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    // Mock the response from the smart contract
    const tokenDetails = {
      tokenId,
      owner: userAddress,
      contractAddress: INSURANCE_POLICY_TOKEN_ADDRESS,
      policyValue: policyMetadata.declaredValue,
      expiryTimestamp,
      tokenURI,
      txHash,
      // Custom policy valuation (in a real implementation, this would come from an external source or formula)
      valuation: Math.floor(Number(policyMetadata.declaredValue) * 0.85) // 85% of declared value
    };
    
    // Return the tokenized policy details
    return NextResponse.json({
      message: 'Policy successfully tokenized',
      token: tokenDetails
    });
  } catch (error) {
    console.error('Error tokenizing policy:', error);
    return NextResponse.json(
      { error: 'Error tokenizing policy' },
      { status: 500 }
    );
  }
} 