import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client if credentials are available
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Interface for contract addresses
 */
export interface ContractAddresses {
  TokenRegistry: string;
  TokenizedPolicy: string;
  RiskEngine: string;
  LoanOrigination: string;
  MorphoAdapter: string;
  USDC: string;
  USDT: string;
  [key: string]: string;
}

/**
 * Get contract addresses for a specific network
 * @param networkName The name of the network (e.g., 'localhost', 'pharosDevnet')
 * @returns An object containing contract addresses
 */
export async function getContractAddresses(networkName: string): Promise<ContractAddresses | null> {
  try {
    // First try to get addresses from Supabase if available
    if (supabase) {
      console.log(`Fetching contract addresses for network ${networkName} from Supabase...`);
      
      // Get chain ID for the network
      let chainId: number;
      switch (networkName) {
        case 'localhost':
          chainId = 1337;
          break;
        case 'pharosDevnet':
          chainId = 50002;
          break;
        default:
          chainId = 1337; // Default to localhost
      }
      
      const { data, error } = await supabase
        .from('contract_addresses')
        .select('contract_name, address')
        .eq('chain_id', chainId)
        .eq('is_current', true);

      if (!error && data && data.length > 0) {
        console.log(`Found ${data.length} contract addresses in Supabase`);
        
        // Convert to the expected format
        const addresses: ContractAddresses = {} as ContractAddresses;
        data.forEach((item: { contract_name: string; address: string }) => {
          addresses[item.contract_name] = item.address;
        });
        
        return addresses;
      }
      
      console.log('No addresses found in Supabase or error occurred, falling back to local file');
    }
    
    // Fallback to local deployed-addresses.json file
    const addressesPath = path.join(__dirname, '../deployed-addresses.json');
    
    if (!fs.existsSync(addressesPath)) {
      console.error('deployed-addresses.json file not found');
      return null;
    }
    
    const addressesJson = fs.readFileSync(addressesPath, 'utf8');
    const addresses = JSON.parse(addressesJson);
    
    if (addresses[networkName]) {
      console.log(`Using addresses from local file for network: ${networkName}`);
      return addresses[networkName] as ContractAddresses;
    } else {
      console.error(`No addresses found for network: ${networkName}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting contract addresses:', error);
    return null;
  }
}
