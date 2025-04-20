import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function fetchContractAddresses(network: string) {
  try {
    // Fetch the current contract addresses for the specified network
    const { data, error } = await supabase
      .from('contract_addresses')
      .select('contract_name, address')
      .eq('network', network)
      .eq('is_current', true);

    if (error) {
      console.error('Error fetching contract addresses:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`No contract addresses found for network: ${network}`);
      return null;
    }

    // Convert the data to the expected format
    const addresses: Record<string, string> = {};
    data.forEach(item => {
      addresses[item.contract_name] = item.address;
    });

    return addresses;
  } catch (error) {
    console.error('Error fetching contract addresses:', error);
    return null;
  }
}

// Example usage
async function main() {
  const network = process.argv[2] || 'localhost';
  const addresses = await fetchContractAddresses(network);

  if (addresses) {
    console.log(`Contract addresses for network ${network}:`);
    console.log(JSON.stringify(addresses, null, 2));

    // Save to deployed-addresses.json
    const addressesPath = path.join(__dirname, '../deployed-addresses.json');
    let existingAddresses: Record<string, Record<string, string>> = {};

    try {
      if (fs.existsSync(addressesPath)) {
        const fileContent = fs.readFileSync(addressesPath, 'utf8');
        existingAddresses = JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn('Could not read existing addresses file:', error);
    }

    // Update with fetched addresses
    existingAddresses[network] = addresses;

    // Write updated addresses back to file
    fs.writeFileSync(
      addressesPath,
      JSON.stringify(existingAddresses, null, 2),
      'utf8'
    );

    console.log(`Addresses saved to ${addressesPath}`);

    // Update frontend .env.local file
    await updateFrontendEnv(network, addresses);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
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

// Export the function for use in other scripts
export { fetchContractAddresses };
