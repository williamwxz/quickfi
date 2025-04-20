import TokenizedPolicyJSON from './TokenizedPolicy.json';
import LoanOriginationJSON from './LoanOrigination.json';
import MockUSDCJSON from './MockUSDC.json';
import MorphoAdapterJSON from './MorphoAdapter.json';
import RiskEngineJSON from './RiskEngine.json';
import TokenRegistryJSON from './TokenRegistry.json';

// Extract ABIs from JSON files
const TokenizedPolicyABI = TokenizedPolicyJSON.abi;
const LoanOriginationABI = LoanOriginationJSON.abi;
const MockUSDCABI = MockUSDCJSON.abi;
const MorphoAdapterABI = MorphoAdapterJSON.abi;
const RiskEngineABI = RiskEngineJSON.abi;
const TokenRegistryABI = TokenRegistryJSON.abi;

// Export ABIs
export {
  TokenizedPolicyABI,
  LoanOriginationABI,
  MockUSDCABI,
  MorphoAdapterABI,
  RiskEngineABI,
  TokenRegistryABI,
};
