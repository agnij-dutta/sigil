import { userHasWallet } from "@civic/auth-web3";
import { CivicUserContext } from "../types/wallet";

/**
 * Utility functions for Civic Auth wallet integration
 */

// Check if user has a wallet
export function checkUserHasWallet(userContext: any): boolean {
  return userContext.user ? userHasWallet(userContext) : false;
}

// Get wallet address safely
export function getWalletAddress(userContext: any): string | null {
  if (!userContext.user || !userHasWallet(userContext)) {
    return null;
  }
  return userContext.ethereum?.address || null;
}

// Format wallet address for display
export function formatWalletAddress(address: string | null, chars: number = 6): string {
  if (!address) return "Not connected";
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Validate Ethereum address
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Convert Wei to Ether string
export function weiToEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(6);
}

// Convert Ether to Wei
export function etherToWei(ether: string): bigint {
  return BigInt(Math.floor(parseFloat(ether) * 1e18));
}

// Get network name from chain ID
export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: "Ethereum Mainnet",
    5: "Goerli Testnet",
    11155111: "Sepolia Testnet",
    137: "Polygon Mainnet",
    80001: "Polygon Mumbai",
  };
  return networks[chainId] || `Unknown Network (${chainId})`;
}

// Error handling utilities
export class WalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "WalletError";
  }
}

export function handleWalletError(error: unknown): WalletError {
  if (error instanceof WalletError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new WalletError(error.message);
  }
  
  return new WalletError("Unknown wallet error");
}

// Wallet connection state helpers
export const WALLET_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting", 
  CONNECTED: "connected",
  ERROR: "error",
} as const;

export type WalletState = typeof WALLET_STATES[keyof typeof WALLET_STATES];

// Local storage keys for wallet data
export const STORAGE_KEYS = {
  WALLET_ADDRESS: "civic_wallet_address",
  USER_PREFERENCES: "civic_user_preferences",
  LAST_CONNECTED: "civic_last_connected",
} as const; 