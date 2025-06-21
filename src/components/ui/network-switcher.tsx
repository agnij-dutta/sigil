'use client';

import { Badge } from './badge';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';

export function NetworkSwitcher() {
  const { walletInfo, hasWallet } = useWallet();

  const SEPOLIA_CHAIN_ID = 11155111;
  
  const getNetworkName = (chainId?: number): string => {
    const networkNames: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      84532: 'Base Sepolia',
      8453: 'Base Mainnet',
      137: 'Polygon',
      80001: 'Polygon Mumbai',
    };
    return networkNames[chainId || 0] || `Unknown Network (${chainId})`;
  };

  if (!hasWallet || !walletInfo.isConnected) {
    return null;
  }

  const isCorrectNetwork = walletInfo.chainId === SEPOLIA_CHAIN_ID;
  const networkName = getNetworkName(walletInfo.chainId);

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Network:</span>
        <Badge 
          variant={isCorrectNetwork ? "default" : "destructive"}
          className="text-xs"
        >
          {networkName}
        </Badge>
      </div>
      
      {!isCorrectNetwork && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-orange-600">
            ⚠️ Please switch to Sepolia Testnet in your wallet to use Sigil contracts
          </span>
        </div>
      )}
      
      {isCorrectNetwork && (
        <span className="text-sm text-green-600">
          ✓ Connected to correct network
        </span>
      )}
    </div>
  );
} 