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
    
    // Optionally save to a file
    const outputPath = path.join(__dirname, '../fetched-addresses.json');
    fs.writeFileSync(outputPath, JSON.stringify({ [network]: addresses }, null, 2));
    console.log(`Addresses saved to ${outputPath}`);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export the function for use in other scripts
export { fetchContractAddresses };
