/**
 * Simplified utility functions for blockchain explorers
 * that leverage the chain configuration
 */
import { mainnet, sepolia } from 'viem/chains';
import { hardhatLocal, pharosDevnet } from '@/config/chains';
import { Chain } from 'viem';

/**
 * Get the chain object by ID
 */
export function getChainById(chainId: number): Chain {
  switch (chainId) {
    case mainnet.id:
      return mainnet;
    case sepolia.id:
      return sepolia;
    case hardhatLocal.id:
      return hardhatLocal;
    case pharosDevnet.id:
    default:
      return pharosDevnet;
  }
}

/**
 * Format an address for display (e.g., 0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Get the explorer URL for a given address and chain
 */
export function getExplorerUrl(address: string, chainId: number = pharosDevnet.id, isToken: boolean = false): string {
  const chain = getChainById(chainId);

  if (!chain.blockExplorers?.default?.url) {
    return '#'; // No explorer available
  }

  const baseUrl = chain.blockExplorers.default.url;
  const path = isToken ? 'token/' : 'address/';

  // Ensure the URL has a trailing slash
  const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return `${formattedBaseUrl}${path}${address}`;
}

/**
 * Get the transaction URL for a given transaction hash and chain
 */
export function getTransactionUrl(txHash: string, chainId: number = pharosDevnet.id): string {
  const chain = getChainById(chainId);

  if (!chain.blockExplorers?.default?.url) {
    return '#'; // No explorer available
  }

  const baseUrl = chain.blockExplorers.default.url;

  // Ensure the URL has a trailing slash
  const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return `${formattedBaseUrl}tx/${txHash}`;
}
