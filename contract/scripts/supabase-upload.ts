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
  } catch (error) {
    console.error('Error uploading contract addresses:', error);
  }
}

// Run the upload function
uploadContractAddresses();
