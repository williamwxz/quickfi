import TokenizedPolicyJSON from './TokenizedPolicy.json';
import LoanOriginationJSON from './LoanOrigination.json';
import RiskEngineJSON from './RiskEngine.json';
import TokenRegistryJSON from './TokenRegistry.json';
import MorphoAdapterJSON from './MorphoAdapter.json';
import MockUSDCJSON from './MockUSDC.json';

// Extract ABIs from JSON files
const TokenizedPolicyABI = TokenizedPolicyJSON.abi;
const LoanOriginationABI = LoanOriginationJSON.abi;
const RiskEngineABI = RiskEngineJSON.abi;
const TokenRegistryABI = TokenRegistryJSON.abi;
const MorphoAdapterABI = MorphoAdapterJSON.abi;
const MockUSDCABI = MockUSDCJSON.abi;

// Export ABIs
export {
  TokenizedPolicyABI,
  LoanOriginationABI,
  RiskEngineABI,
  TokenRegistryABI,
  MorphoAdapterABI,
  MockUSDCABI,
};
