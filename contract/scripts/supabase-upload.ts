import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadContractAddresses() {
  try {
    // Read the deployed addresses from the JSON file
    const addressesPath = path.join(__dirname, '../deployed-addresses.json');
    const addressesData = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

    // Get the network and addresses
    const networks = Object.keys(addressesData);

    for (const network of networks) {
      const addresses = addressesData[network];
      const timestamp = new Date().toISOString();

      // Upload each contract address to Supabase
      for (const [contractName, address] of Object.entries(addresses)) {
        const { data, error } = await supabase
          .from('contract_addresses')
          .upsert({
            network,
            contract_name: contractName,
            address: address as string,
            deployed_at: timestamp,
            is_current: true
          }, {
            onConflict: 'network,contract_name',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error uploading ${contractName} address:`, error);
        } else {
          console.log(`Successfully uploaded ${contractName} address to Supabase`);
        }
      }
    }

    console.log('All contract addresses uploaded to Supabase');

    // Update frontend .env.local file for each network
    for (const network of networks) {
      try {
        await updateFrontendEnv(network, addressesData[network]);
      } catch (error) {
        console.error(`Error updating frontend .env for ${network}:`, error);
      }
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
