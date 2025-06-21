'use client';

import { useState, useEffect, useCallback } from 'react';
// Note: Civic Auth hook import - will be available after proper Civic setup
// import { useCivicAuth } from '@civic/auth-web3/react';
import { walletConnector } from '../connection';
import { siweAuthenticator } from '../siwe';
import { 
  WalletState, 
  WalletActions, 
  WalletProvider,
  AuthenticatedUser,
  WalletEvent,
  CivicAuthData
} from '../../types/wallet';
import { clearWalletStorage } from '../../utils/config';

export function useWallet(): WalletState & WalletActions {
  const [state, setState] = useState<WalletState>({
    wallet: null,
    isConnecting: false,
    connectionError: null,
    siweSession: null,
    isSiweAuthenticating: false,
    siweError: null,
    civicAuth: null,
    isCivicAuthenticating: false,
    civicError: null,
    isAuthenticated: false,
    user: null,
  });

  // Mock Civic Auth for now - will be replaced with actual Civic implementation
  const civicUser = null;
  const civicLogin = async () => console.log('Civic login not yet implemented');
  const civicLogout = async () => console.log('Civic logout not yet implemented');
  const isCivicLoading = false;

  // Initialize wallet connection on mount
  useEffect(() => {
    initializeWallet();
    setupWalletEventListeners();

    return () => {
      walletConnector.removeEventListener(handleWalletEvent);
    };
  }, []);

  // Monitor Civic Auth state
  useEffect(() => {
    // Mock implementation - will be replaced with actual Civic Auth logic
    setState(prev => ({
      ...prev,
      civicAuth: null,
      isCivicAuthenticating: isCivicLoading,
    }));
  }, [civicUser, isCivicLoading]);

  // Update authentication status when wallet or sessions change
  useEffect(() => {
    updateAuthenticationStatus();
  }, [state.wallet, state.siweSession, state.civicAuth]);

  /**
   * Initialize wallet connection if previously connected
   */
  const initializeWallet = useCallback(async () => {
    try {
      const isConnected = await walletConnector.isConnected();
      if (isConnected) {
        const connection = await walletConnector.getCurrentAccount();
        if (connection) {
          setState(prev => ({ ...prev, wallet: connection }));
          
          // Try to restore SIWE session
          const session = siweAuthenticator.restoreSession();
          if (session && siweAuthenticator.isSessionValid(session)) {
            setState(prev => ({ ...prev, siweSession: session }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  }, []);

  /**
   * Set up wallet event listeners
   */
  const setupWalletEventListeners = useCallback(() => {
    walletConnector.addEventListener(handleWalletEvent);
  }, []);

  /**
   * Handle wallet events
   */
  const handleWalletEvent = useCallback((event: WalletEvent) => {
    switch (event.type) {
      case 'connect':
        setState(prev => ({ 
          ...prev, 
          wallet: event.data,
          isConnecting: false,
          connectionError: null 
        }));
        break;
      case 'disconnect':
        setState(prev => ({ 
          ...prev, 
          wallet: null,
          siweSession: null,
          isAuthenticated: false,
          user: null 
        }));
        siweAuthenticator.clearSession();
        break;
      case 'accountChanged':
        setState(prev => ({ 
          ...prev, 
          wallet: prev.wallet ? { ...prev.wallet, address: event.data.address } : null,
          siweSession: null,
          isAuthenticated: false,
          user: null 
        }));
        siweAuthenticator.clearSession();
        break;
      case 'chainChanged':
        setState(prev => ({ 
          ...prev, 
          wallet: prev.wallet ? { ...prev.wallet, chainId: event.data.chainId } : null 
        }));
        break;
    }
  }, []);

  /**
   * Update authentication status based on current state
   */
  const updateAuthenticationStatus = useCallback(() => {
    setState(prev => {
      const isWalletConnected = !!prev.wallet?.isConnected;
      const isSiweValid = siweAuthenticator.isSessionValid(prev.siweSession);
      const isCivicValid = !!prev.civicAuth?.verified;
      
      const isAuthenticated = isWalletConnected && (isSiweValid || isCivicValid);
      
      let user: AuthenticatedUser | null = null;
      if (isAuthenticated && prev.wallet) {
        user = {
          address: prev.wallet.address,
          chainId: prev.wallet.chainId,
          civicDid: prev.civicAuth?.did,
          isVerified: isCivicValid,
          connectedAt: new Date(),
        };
      }

      return {
        ...prev,
        isAuthenticated,
        user,
      };
    });
  }, []);

  /**
   * Connect wallet
   */
  const connectWallet = useCallback(async (provider: WalletProvider = 'metamask') => {
    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      connectionError: null 
    }));

    try {
      const connection = await walletConnector.connectWallet(provider);
      setState(prev => ({ 
        ...prev, 
        wallet: connection,
        isConnecting: false 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        connectionError: error.message 
      }));
      throw error;
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    try {
      await walletConnector.disconnectWallet();
      siweAuthenticator.clearSession();
      if (civicUser) {
        await civicLogout();
      }
      clearWalletStorage();
      
      setState({
        wallet: null,
        isConnecting: false,
        connectionError: null,
        siweSession: null,
        isSiweAuthenticating: false,
        siweError: null,
        civicAuth: null,
        isCivicAuthenticating: false,
        civicError: null,
        isAuthenticated: false,
        user: null,
      });
    } catch (error: any) {
      console.error('Disconnect failed:', error);
    }
  }, [civicUser, civicLogout]);

  /**
   * Switch to a different chain
   */
  const switchChain = useCallback(async (chainId: number) => {
    if (!state.wallet) {
      throw new Error('No wallet connected');
    }

    try {
      await walletConnector.switchChain(chainId);
    } catch (error: any) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }, [state.wallet]);

  /**
   * Sign in with Ethereum (SIWE)
   */
  const signInWithEthereum = useCallback(async () => {
    if (!state.wallet) {
      throw new Error('No wallet connected');
    }

    setState(prev => ({ 
      ...prev, 
      isSiweAuthenticating: true, 
      siweError: null 
    }));

    try {
      const provider = walletConnector.getProvider();
      if (!provider) {
        throw new Error('No Web3 provider available');
      }

      const session = await siweAuthenticator.createSiweSession(
        state.wallet.address,
        state.wallet.chainId,
        provider
      );

      setState(prev => ({ 
        ...prev, 
        siweSession: session,
        isSiweAuthenticating: false 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isSiweAuthenticating: false,
        siweError: error.message 
      }));
      throw error;
    }
  }, [state.wallet]);

  /**
   * Sign out (clear SIWE session)
   */
  const signOut = useCallback(async () => {
    siweAuthenticator.clearSession();
    setState(prev => ({ 
      ...prev, 
      siweSession: null,
      isAuthenticated: false,
      user: null 
    }));
  }, []);

  /**
   * Authenticate with Civic
   */
  const authenticateWithCivic = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      isCivicAuthenticating: true, 
      civicError: null 
    }));

    try {
      await civicLogin();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isCivicAuthenticating: false,
        civicError: error.message 
      }));
      throw error;
    }
  }, [civicLogin]);

  /**
   * Verify Civic identity
   */
  const verifyCivicIdentity = useCallback(async () => {
    if (!state.civicAuth) {
      throw new Error('No Civic authentication data');
    }

    // Additional verification logic would go here
    console.log('Civic identity verified:', state.civicAuth.did);
  }, [state.civicAuth]);

  /**
   * Full authentication flow (wallet + SIWE + Civic)
   */
  const fullAuthenticate = useCallback(async () => {
    try {
      // Step 1: Connect wallet if not connected
      if (!state.wallet) {
        await connectWallet();
      }

      // Step 2: Sign in with Ethereum
      if (!state.siweSession) {
        await signInWithEthereum();
      }

      // Step 3: Authenticate with Civic (optional)
      if (!state.civicAuth) {
        await authenticateWithCivic();
      }
    } catch (error) {
      console.error('Full authentication failed:', error);
      throw error;
    }
  }, [state.wallet, state.siweSession, state.civicAuth, connectWallet, signInWithEthereum, authenticateWithCivic]);

  return {
    // State
    ...state,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchChain,
    signInWithEthereum,
    signOut,
    authenticateWithCivic,
    verifyCivicIdentity,
    fullAuthenticate,
  };
} 