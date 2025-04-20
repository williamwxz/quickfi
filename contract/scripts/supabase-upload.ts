import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ethers } from 'hardhat';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadContractAddresses() {
  try {
    // Get the current network's chain ID
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    // Read the deployed addresses from the JSON file
    const addressesPath = path.join(__dirname, '../deployed-addresses.json');
    const addressesData = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

    // Get the current network's addresses
    const networkName = network.name;
    const addresses = addressesData[networkName];
    if (!addresses) {
      console.error(`No addresses found for network: ${networkName}`);
      return;
    }

    const timestamp = new Date().toISOString();

    // First, mark all existing addresses for this chain_id as not current
    const { error: updateError } = await supabase
      .from('contract_addresses')
      .update({ is_current: false })
      .eq('chain_id', chainId);

    if (updateError) {
      console.error("Error updating existing addresses:", updateError);
    }

    // Upload each contract address to Supabase
    for (const [contractName, address] of Object.entries(addresses)) {
      const { error } = await supabase
        .from('contract_addresses')
        .upsert({
          contract_name: contractName,
          address: address as string,
          chain_id: chainId,
          is_current: true,
          created_at: timestamp,
          updated_at: timestamp
        }, {
          onConflict: 'chain_id,contract_name',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Error uploading ${contractName} address:`, error);
      } else {
        console.log(`Successfully uploaded ${contractName} address to Supabase`);
      }
    }

    console.log('All contract addresses uploaded to Supabase');

    // Update frontend .env.local file
    try {
      await updateFrontendEnv(networkName, addresses);
    } catch (error) {
      console.error(`Error updating frontend .env for ${networkName}:`, error);
    }
  } catch (error) {
    console.error('Error uploading contract addresses:', error);
  }
}

/**
 * Updates the frontend .env.local file with contract addresses
 */
async function updateFrontendEnv(network: string, addresses: Record<string, string>) {
  // Only update frontend for specific networks
  const allowedNetworks = ['localhost', 'pharosDevnet', 'sepolia'];
  if (!allowedNetworks.includes(network)) {
    console.log(`Skipping frontend .env update for network: ${network}`);
    return;
  }

  // Path to frontend .env.local file
  const envPath = path.join(__dirname, '../../frontend/.env.local');
  let envContent = '';

  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
  } catch (error) {
    console.warn('Could not read .env.local file:', error);
  }

  // Map contract names to environment variable names
  const contractToEnvMap: Record<string, string> = {
    'TokenizedPolicy': 'NEXT_PUBLIC_INSURANCE_POLICY_TOKEN_ADDRESS',
    'RiskEngine': 'NEXT_PUBLIC_RISK_ENGINE_ADDRESS',
    'LoanOrigination': 'NEXT_PUBLIC_LOAN_ORIGINATION_ADDRESS',
    'MorphoAdapter': 'NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS',
    'USDC': 'NEXT_PUBLIC_USDC_ADDRESS',
    'USDT': 'NEXT_PUBLIC_USDT_ADDRESS'
  };

  // Update environment variables
  let newEnvContent = envContent;

  for (const [contractName, address] of Object.entries(addresses)) {
    const envName = contractToEnvMap[contractName];
    if (envName) {
      // Check if the variable already exists in the file
      const regex = new RegExp(`^${envName}=.*$`, 'm');

      if (regex.test(newEnvContent)) {
        // Replace existing variable
        newEnvContent = newEnvContent.replace(regex, `${envName}=${address}`);
      } else {
        // Add new variable
        newEnvContent += `\n${envName}=${address}`;
      }
    }
  }

  // Write updated .env.local file
  fs.writeFileSync(envPath, newEnvContent, 'utf8');
  console.log(`Frontend environment variables updated in ${envPath}`);
}

// Run the upload function
uploadContractAddresses();
