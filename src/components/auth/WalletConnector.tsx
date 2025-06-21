'use client';

import { useState } from 'react';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';
import { WalletProvider } from '../../../web3/types/wallet';
import { getChainName } from '../../../web3/utils/config';

interface WalletConnectorProps {
  className?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  showCivicAuth?: boolean;
}

export default function WalletConnector({
  className = '',
  onSuccess,
  onError,
  showCivicAuth = true
}: WalletConnectorProps) {
  const {
    wallet,
    siweSession,
    civicAuth,
    isConnecting,
    isSiweAuthenticating,
    isCivicAuthenticating,
    connectionError,
    siweError,
    civicError,
    isAuthenticated,
    user,
    connectWallet,
    signInWithEthereum,
    authenticateWithCivic,
    disconnectWallet,
    fullAuthenticate
  } = useWallet();

  const [selectedProvider, setSelectedProvider] = useState<WalletProvider>('metamask');
  const [showProviders, setShowProviders] = useState(false);

  const handleConnect = async (provider: WalletProvider = selectedProvider) => {
    try {
      await connectWallet();
      setShowProviders(false);
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  const handleSiweAuth = async () => {
    try {
      await signInWithEthereum();
      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (error: any) {
      console.error('SIWE authentication failed:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  const handleCivicAuth = async () => {
    try {
      await authenticateWithCivic();
      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (error: any) {
      console.error('Civic authentication failed:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  const handleFullAuth = async () => {
    try {
      await fullAuthenticate();
      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (error: any) {
      console.error('Full authentication failed:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Show wallet provider selection
  if (!wallet && showProviders) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Choose Wallet</h3>
        
        <div className="grid gap-3">
          <button
            onClick={() => handleConnect('metamask')}
            disabled={isConnecting}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-foreground">MetaMask</div>
                <div className="text-sm text-muted-foreground">Popular Ethereum wallet</div>
              </div>
            </div>
            {isConnecting && selectedProvider === 'metamask' && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          <button
            onClick={() => handleConnect('injected')}
            disabled={isConnecting}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-foreground">Browser Wallet</div>
                <div className="text-sm text-muted-foreground">Any injected wallet</div>
              </div>
            </div>
            {isConnecting && selectedProvider === 'injected' && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </div>

        <button
          onClick={() => setShowProviders(false)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Show wallet connection button
  if (!wallet) {
    return (
      <button
        onClick={() => setShowProviders(true)}
        disabled={isConnecting}
        className={`
          inline-flex items-center justify-center px-6 py-3
          bg-primary text-primary-foreground font-medium rounded-lg
          hover:bg-primary/90 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isConnecting ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Connect Wallet</span>
          </div>
        )}
      </button>
    );
  }

  // Show authentication steps
  if (wallet && !isAuthenticated) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Wallet Connected Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div>
              <div className="font-medium text-foreground">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </div>
              <div className="text-sm text-muted-foreground">
                {getChainName(wallet.chainId)}
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Disconnect
          </button>
        </div>

        {/* SIWE Authentication */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Sign Message</h4>
            {siweSession && (
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            )}
          </div>
          
          {!siweSession && (
            <button
              onClick={handleSiweAuth}
              disabled={isSiweAuthenticating}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSiweAuthenticating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing...</span>
                </div>
              ) : (
                <span>Sign In with Ethereum</span>
              )}
            </button>
          )}
          
          {siweError && (
            <p className="text-sm text-red-500">{siweError}</p>
          )}
        </div>

        {/* Civic Authentication (Optional) */}
        {showCivicAuth && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Civic Verification</h4>
              {civicAuth?.verified && (
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              )}
            </div>
            
            {!civicAuth?.verified && (
              <button
                onClick={handleCivicAuth}
                disabled={isCivicAuthenticating}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isCivicAuthenticating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <span>Verify with Civic</span>
                )}
              </button>
            )}
            
            {civicError && (
              <p className="text-sm text-red-500">{civicError}</p>
            )}
          </div>
        )}

        {/* Quick Full Authentication Button */}
        <button
          onClick={handleFullAuth}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
        >
          Complete All Steps Automatically
        </button>

        {/* Error Messages */}
        {connectionError && (
          <p className="text-sm text-red-500">{connectionError}</p>
        )}
      </div>
    );
  }

  // Show authenticated state
  if (isAuthenticated && user) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div>
              <div className="font-medium text-green-900">Authenticated</div>
              <div className="text-sm text-green-700">
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
                {user.isVerified && ' • Verified'}
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-green-700 hover:text-green-900 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return null;
} 