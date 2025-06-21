"use client";

import { useWallet } from "../../../web3/wallet/hooks/useWallet";
import { formatWalletAddress } from "../../../web3/utils/wallet";
import { Badge } from "./badge";
import { Wallet, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface WalletStatusProps {
  className?: string;
  showBalance?: boolean;
  showActions?: boolean;
}

export function WalletStatus({ 
  className = "", 
  showBalance = true, 
  showActions = true 
}: WalletStatusProps) {
  const { walletInfo, hasWallet, isAuthenticated } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (walletInfo.address) {
      await navigator.clipboard.writeText(walletInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEtherscan = () => {
    if (walletInfo.address) {
      window.open(`https://etherscan.io/address/${walletInfo.address}`, '_blank');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Not connected</span>
      </div>
    );
  }

  if (!hasWallet) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Wallet className="w-4 h-4 text-yellow-500" />
        <span className="text-sm text-muted-foreground">Wallet not created</span>
        <Badge variant="outline" className="text-xs">
          Pending
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium">Wallet Connected</span>
        <Badge variant="secondary" className="text-xs">
          {walletInfo.network || 'Ethereum'}
        </Badge>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono">
          {formatWalletAddress(walletInfo.address)}
        </span>
        
        {showActions && (
          <div className="flex gap-1">
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Copy address"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={openEtherscan}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Balance */}
      {showBalance && walletInfo.balance && (
        <div className="text-xs text-muted-foreground">
          Balance: {parseFloat(walletInfo.balance).toFixed(4)} ETH
        </div>
      )}

      {/* Copy confirmation */}
      {copied && (
        <div className="text-xs text-green-600">
          Address copied to clipboard!
        </div>
      )}

      {/* Error state */}
      {walletInfo.error && (
        <div className="text-xs text-red-600">
          Error: {walletInfo.error}
        </div>
      )}
    </div>
  );
} 