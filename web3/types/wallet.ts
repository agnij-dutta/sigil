import { WalletClient } from 'viem';

// Civic Auth Web3 User Context Types
export interface CivicUser {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  updated_at?: Date;
}

export interface CivicEthereumWallet {
  address: string;
  wallet: WalletClient;
}

export interface CivicUserContextWithWallet {
  user: CivicUser;
  ethereum: CivicEthereumWallet;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface CivicUserContextWithoutWallet {
  user: CivicUser;
  createWallet: () => Promise<void>;
  walletCreationInProgress: boolean;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export type CivicUserContext = CivicUserContextWithWallet | CivicUserContextWithoutWallet;

// Wallet Connection States
export enum WalletConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Wallet Information
export interface WalletInfo {
  address: string | null;
  isConnected: boolean;
  connectionState: WalletConnectionState;
  balance?: string;
  network?: string;
  error?: string;
}

// Transaction Types
export interface TransactionRequest {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
}

// Wallet Hook Return Type
export interface UseWalletReturn {
  // User and authentication
  user: CivicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Wallet state
  walletInfo: WalletInfo;
  hasWallet: boolean;
  
  // Actions
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createWallet: () => Promise<void>;
  sendTransaction: (request: TransactionRequest) => Promise<TransactionResult>;
  
  // Error handling
  error: Error | null;
  clearError: () => void;
} 