"use client";

import { useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  UseWalletReturn, 
  WalletInfo, 
  WalletConnectionState, 
  TransactionRequest, 
  TransactionResult 
} from "../../types/wallet";
import { formatEther, createPublicClient, createWalletClient, http, custom } from "viem";
import { sepolia } from "viem/chains";
import { SEPOLIA_RPC_URL, ContractService } from "../../../src/lib/contracts";

export function useWallet(): UseWalletReturn {
  const userContext = useUser();
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState<string | undefined>();
  const [credentials, setCredentials] = useState<string[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Create public client for reading Sepolia blockchain data
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });
  }, []);

  // Create wallet client when user has wallet
  const walletClient = useMemo(() => {
    if (!userHasWallet(userContext)) return null;
    
    try {
      return createWalletClient({
        chain: sepolia,
        transport: custom(userContext.ethereum.wallet),
      });
    } catch {
      return null;
    }
  }, [userContext]);

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user has wallet
  const hasWallet = useMemo(() => {
    return userContext.user ? userHasWallet(userContext) : false;
  }, [userContext]);

  // Get wallet info
  const walletInfo: WalletInfo = useMemo(() => {
    if (!userContext.user) {
      return {
        address: null,
        isConnected: false,
        connectionState: WalletConnectionState.DISCONNECTED,
      };
    }

    if (!hasWallet) {
      return {
        address: null,
        isConnected: false,
        connectionState: WalletConnectionState.DISCONNECTED,
      };
    }

    if (userHasWallet(userContext)) {
      return {
        address: userContext.ethereum.address,
        isConnected: true,
        connectionState: WalletConnectionState.CONNECTED,
        balance,
        network: "Sepolia Testnet", // Updated to show Sepolia
        chainId: 11155111,
        credentials,
      };
    }

    return {
      address: null,
      isConnected: false,
      connectionState: WalletConnectionState.ERROR,
      error: "Invalid wallet state",
    };
  }, [userContext, hasWallet, balance, credentials]);

  // Fetch wallet balance from Sepolia
  const fetchBalance = useCallback(async () => {
    if (!hasWallet || !userHasWallet(userContext)) return;

    try {
      const address = userContext.ethereum.address as `0x${string}`;
      const balanceResult = await publicClient.getBalance({ address });
      const ethBalance = formatEther(balanceResult);
      setBalance(ethBalance);
    } catch (err) {
      console.error("Failed to fetch Sepolia balance:", err);
      setError(err as Error);
    }
  }, [hasWallet, userContext, publicClient]);

  // Fetch user credentials from deployed contracts
  const fetchCredentials = useCallback(async () => {
    if (!hasWallet || !userHasWallet(userContext)) return;

    try {
      setLoadingCredentials(true);
      const address = userContext.ethereum.address as `0x${string}`;
      const userCredentials = await ContractService.getCredentials(address);
      setCredentials(userCredentials);
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
      setError(err as Error);
    } finally {
      setLoadingCredentials(false);
    }
  }, [hasWallet, userContext]);

  // Fetch balance and credentials when wallet is connected
  useEffect(() => {
    if (hasWallet) {
      fetchBalance();
      fetchCredentials();
      
      // Set up periodic balance refresh
      const interval = setInterval(fetchBalance, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [hasWallet, fetchBalance, fetchCredentials]);

  // Sign in handler
  const signIn = useCallback(async () => {
    try {
      setError(null);
      await userContext.signIn();
    } catch (err) {
      const error = err as Error;
      console.error("Sign-in failed:", error);
      setError(error);
      throw error;
    }
  }, [userContext]);

  // Sign out handler
  const signOut = useCallback(async () => {
    try {
      setError(null);
      await userContext.signOut();
      setBalance(undefined);
      setCredentials([]);
    } catch (err) {
      const error = err as Error;
      console.error("Sign-out failed:", error);
      setError(error);
      throw error;
    }
  }, [userContext]);

  // Create wallet handler
  const createWallet = useCallback(async () => {
    if (!userContext.user) {
      throw new Error("User must be signed in to create wallet");
    }

    if (hasWallet) {
      throw new Error("User already has a wallet");
    }

    try {
      setError(null);
      // Type assertion for wallet creation - Civic Auth provides this method
      const userContextWithCreate = userContext as any;
      await userContextWithCreate.createWallet();
      // Fetch balance and credentials after wallet creation
      setTimeout(() => {
        fetchBalance();
        fetchCredentials();
      }, 2000);
    } catch (err) {
      const error = err as Error;
      console.error("Wallet creation failed:", error);
      setError(error);
      throw error;
    }
  }, [userContext, hasWallet, fetchBalance, fetchCredentials]);

  // Send transaction handler for Sepolia
  const sendTransaction = useCallback(async (request: TransactionRequest): Promise<TransactionResult> => {
    if (!hasWallet || !userHasWallet(userContext) || !walletClient) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      
      const hash = await walletClient.sendTransaction({
        account: userContext.ethereum.address as `0x${string}`,
        chain: sepolia,
        to: request.to as `0x${string}`,
        value: request.value || BigInt(0),
        data: request.data as `0x${string}` | undefined,
        gas: request.gasLimit,
      });

      // Refresh balance after transaction
      setTimeout(fetchBalance, 3000);

      return {
        hash,
        success: true,
      };
    } catch (err) {
      const error = err as Error;
      console.error("Transaction failed:", error);
      setError(error);
      return {
        hash: "",
        success: false,
        error: error.message,
      };
    }
  }, [hasWallet, userContext, walletClient, fetchBalance]);

  // Register demo credential on Sepolia
  const registerCredential = useCallback(async (
    credentialType: string,
    credentialHash: string,
    metadata: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> => {
    if (!hasWallet || !userHasWallet(userContext) || !walletClient) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      const address = userContext.ethereum.address as `0x${string}`;
      
      // Use the corrected demo credential registration
      const result = await ContractService.registerDemoCredential(
        walletClient,
        address
      );

      if (result.success) {
        // Refresh credentials after successful registration
        setTimeout(fetchCredentials, 3000);
      }

      return result;
    } catch (err) {
      const error = err as Error;
      console.error("Credential registration failed:", error);
      setError(error);
      return { success: false, error: error.message };
    }
  }, [hasWallet, userContext, walletClient, fetchCredentials]);

  return {
    // User and authentication
    user: userContext.user,
    isAuthenticated: !!userContext.user,
    isLoading: userContext.isLoading,
    
    // Wallet state
    walletInfo,
    hasWallet,
    
    // Actions
    signIn,
    signOut,
    createWallet,
    sendTransaction,
    registerCredential,
    
    // Utilities
    clearError,
    error,
    
    // Contract interactions
    credentials,
    loadingCredentials,
    fetchCredentials,
    fetchBalance,
  };
} 