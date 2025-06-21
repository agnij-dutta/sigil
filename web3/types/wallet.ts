export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  connector?: string;
}

export interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SiweSession {
  address: string;
  chainId: number;
  message: SiweMessage;
  signature: string;
  verified: boolean;
  expiresAt: Date;
}

export interface CivicAuthData {
  did: string;
  address: string;
  verified: boolean;
  gatewayToken?: string;
  proof?: any;
}

export interface WalletState {
  // Wallet connection
  wallet: WalletConnection | null;
  isConnecting: boolean;
  connectionError: string | null;
  
  // SIWE authentication
  siweSession: SiweSession | null;
  isSiweAuthenticating: boolean;
  siweError: string | null;
  
  // Civic Auth
  civicAuth: CivicAuthData | null;
  isCivicAuthenticating: boolean;
  civicError: string | null;
  
  // Combined auth state
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
}

export interface AuthenticatedUser {
  address: string;
  chainId: number;
  civicDid?: string;
  githubId?: string;
  githubUsername?: string;
  isVerified: boolean;
  connectedAt: Date;
}

export interface WalletActions {
  // Wallet connection
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  
  // SIWE authentication
  signInWithEthereum: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Civic Auth
  authenticateWithCivic: () => Promise<void>;
  verifyCivicIdentity: () => Promise<void>;
  
  // Combined actions
  fullAuthenticate: () => Promise<void>;
}

export interface WalletConfig {
  // Network configuration
  supportedChains: number[];
  defaultChain: number;
  
  // SIWE configuration
  siwe: {
    domain: string;
    statement: string;
    version: string;
    ttl: number; // Time to live in seconds
  };
  
  // Civic configuration
  civic: {
    clientId: string;
    gatewayUrl?: string;
    allowedChains?: number[];
  };
  
  // Storage configuration
  storage: {
    sessionKey: string;
    civicKey: string;
    prefix: string;
  };
}

// Wallet provider types
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'injected';

export interface WalletMetadata {
  name: string;
  icon: string;
  description: string;
  downloadUrl?: string;
  deepLink?: string;
}

// Error types
export class WalletError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

export class SiweError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SiweError';
    this.code = code;
  }
}

export class CivicError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'CivicError';
    this.code = code;
  }
}

// Event types
export interface WalletEvent {
  type: 'connect' | 'disconnect' | 'accountChanged' | 'chainChanged';
  data?: any;
}

export interface AuthEvent {
  type: 'siweSuccess' | 'siweError' | 'civicSuccess' | 'civicError' | 'signOut';
  data?: any;
} 