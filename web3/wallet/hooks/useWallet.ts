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
import { formatEther, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export function useWallet(): UseWalletReturn {
  const userContext = useUser();
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState<string | undefined>();

  // Create public client for reading blockchain data
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: mainnet,
      transport: http(),
    });
  }, []);

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
        network: "ethereum", // Civic Auth uses Ethereum by default
      };
    }

    return {
      address: null,
      isConnected: false,
      connectionState: WalletConnectionState.ERROR,
      error: "Invalid wallet state",
    };
  }, [userContext, hasWallet, balance]);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!hasWallet || !userHasWallet(userContext)) return;

    try {
      const address = userContext.ethereum.address as `0x${string}`;
      const balanceResult = await publicClient.getBalance({ address });
      setBalance(formatEther(balanceResult));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setError(err as Error);
    }
  }, [hasWallet, userContext, publicClient]);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (hasWallet) {
      fetchBalance();
    }
  }, [hasWallet, fetchBalance]);

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
      // Fetch balance after wallet creation
      setTimeout(fetchBalance, 1000);
    } catch (err) {
      const error = err as Error;
      console.error("Wallet creation failed:", error);
      setError(error);
      throw error;
    }
  }, [userContext, hasWallet, fetchBalance]);

  // Send transaction handler
  const sendTransaction = useCallback(async (request: TransactionRequest): Promise<TransactionResult> => {
    if (!hasWallet || !userHasWallet(userContext)) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      const { wallet } = userContext.ethereum;
      
      const hash = await wallet.sendTransaction({
        account: userContext.ethereum.address as `0x${string}`,
        chain: mainnet,
        to: request.to as `0x${string}`,
        value: request.value || BigInt(0),
        data: request.data as `0x${string}` | undefined,
        gas: request.gasLimit,
      });

      // Refresh balance after transaction
      setTimeout(fetchBalance, 2000);

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
  }, [hasWallet, userContext, fetchBalance]);

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
    
    // Error handling
    error,
    clearError,
  };
} 