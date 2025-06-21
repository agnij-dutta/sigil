"use client";

import { useWallet } from "../../../web3/wallet/hooks/useWallet";
import { formatWalletAddress } from "../../../web3/utils/wallet";
import { Badge } from "./badge";
import { Button } from "./button";
import { Wallet, Copy, ExternalLink, Shield, Loader2 } from "lucide-react";
import { useState } from "react";

interface WalletStatusProps {
  className?: string;
  showBalance?: boolean;
  showActions?: boolean;
  showCredentials?: boolean;
}

export function WalletStatus({ 
  className = "", 
  showBalance = true, 
  showActions = true,
  showCredentials = false
}: WalletStatusProps) {
  const { 
    walletInfo, 
    hasWallet, 
    isAuthenticated,
    credentials,
    loadingCredentials,
    fetchCredentials,
    registerCredential
  } = useWallet();
  
  const [copied, setCopied] = useState(false);
  const [registering, setRegistering] = useState(false);

  const copyAddress = async () => {
    if (walletInfo.address) {
      await navigator.clipboard.writeText(walletInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openSepoliaScan = () => {
    if (walletInfo.address) {
      window.open(`https://sepolia.etherscan.io/address/${walletInfo.address}`, '_blank');
    }
  };

  const handleRegisterDemoCredential = async () => {
    try {
      setRegistering(true);
      const result = await registerCredential(
        "demo",
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        JSON.stringify({
          type: "demo",
          timestamp: Date.now(),
          description: "Demo credential registration"
        })
      );
      
      if (result.success) {
        console.log("Demo credential registered successfully:", result.hash);
        fetchCredentials(); // Refresh credentials
      } else {
        console.error("Failed to register credential:", result.error);
      }
    } catch (error) {
      console.error("Error registering demo credential:", error);
    } finally {
      setRegistering(false);
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
    <div className={`space-y-3 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium">Wallet Connected</span>
        <Badge variant="secondary" className="text-xs">
          {walletInfo.network || 'Sepolia Testnet'}
        </Badge>
      </div>

      {/* Address with overflow handling */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-mono truncate" title={walletInfo.address || ""}>
            {formatWalletAddress(walletInfo.address, 6)}
          </div>
        </div>
        
        {showActions && (
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-6 w-6 p-0 hover:bg-muted"
              title="Copy address"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openSepoliaScan}
              className="h-6 w-6 p-0 hover:bg-muted"
              title="View on Sepolia Etherscan"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Balance - Sepolia ETH */}
      {showBalance && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Sepolia Balance:</span>{" "}
          {walletInfo.balance ? `${parseFloat(walletInfo.balance).toFixed(4)} ETH` : "Loading..."}
        </div>
      )}

      {/* Credentials Section */}
      {showCredentials && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-medium">Credentials</span>
              <Badge variant="outline" className="text-xs">
                {credentials.length}
              </Badge>
            </div>
            {loadingCredentials && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {credentials.length > 0 ? (
            <div className="space-y-1">
              {credentials.slice(0, 3).map((credential, index) => (
                <div key={index} className="text-xs text-muted-foreground font-mono truncate">
                  {formatWalletAddress(credential, 8)}
                </div>
              ))}
              {credentials.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{credentials.length - 3} more
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No credentials found</div>
          )}
          
          {/* Demo credential registration */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegisterDemoCredential}
            disabled={registering}
            className="w-full h-7 text-xs"
          >
            {registering ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Demo Credential"
            )}
          </Button>
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