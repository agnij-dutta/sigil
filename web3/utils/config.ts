import { WalletConfig, WalletMetadata, WalletProvider } from '../types/wallet';

// Supported blockchain networks
export const SUPPORTED_CHAINS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
} as const;

export const CHAIN_METADATA = {
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
  },
  [SUPPORTED_CHAINS.ETHEREUM_SEPOLIA]: {
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.sepolia.dev',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: {
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon.llamarpc.com',
    blockExplorer: 'https://polygonscan.com',
  },
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: {
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://rpc.ankr.com/polygon_mumbai',
    blockExplorer: 'https://mumbai.polygonscan.com',
  },
} as const;

// Wallet provider metadata
export const WALLET_METADATA: Record<WalletProvider, WalletMetadata> = {
  metamask: {
    name: 'MetaMask',
    icon: '/icons/metamask.svg',
    description: 'Popular Ethereum wallet with browser extension',
    downloadUrl: 'https://metamask.io/download.html',
  },
  walletconnect: {
    name: 'WalletConnect',
    icon: '/icons/walletconnect.svg',
    description: 'Connect with 200+ wallets via QR code',
    downloadUrl: 'https://walletconnect.com',
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.svg',
    description: 'User-friendly wallet by Coinbase',
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  injected: {
    name: 'Browser Wallet',
    icon: '/icons/wallet.svg',
    description: 'Use any injected Ethereum wallet',
  },
};

// Default wallet configuration
export const DEFAULT_WALLET_CONFIG: WalletConfig = {
  supportedChains: [
    SUPPORTED_CHAINS.ETHEREUM_MAINNET,
    SUPPORTED_CHAINS.ETHEREUM_SEPOLIA,
    SUPPORTED_CHAINS.POLYGON_MAINNET,
  ],
  defaultChain: SUPPORTED_CHAINS.ETHEREUM_MAINNET,
  
  siwe: {
    domain: typeof window !== 'undefined' ? window.location.host : 'sigil.dev',
    statement: 'Sign in to Sigil to prove your developer credentials securely.',
    version: '1',
    ttl: 24 * 60 * 60, // 24 hours
  },
  
  civic: {
    clientId: process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID || '5d40dfe1-7677-4fbf-9391-f7b36b7e6575',
    gatewayUrl: 'https://prod.gwy.civic.com',
    allowedChains: [
      SUPPORTED_CHAINS.ETHEREUM_MAINNET,
      SUPPORTED_CHAINS.POLYGON_MAINNET,
    ],
  },
  
  storage: {
    sessionKey: 'sigil_siwe_session',
    civicKey: 'sigil_civic_auth',
    prefix: 'sigil_',
  },
};

// Environment-specific configurations
export const getWalletConfig = (): WalletConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...DEFAULT_WALLET_CONFIG,
    supportedChains: isProduction 
      ? [SUPPORTED_CHAINS.ETHEREUM_MAINNET, SUPPORTED_CHAINS.POLYGON_MAINNET]
      : [SUPPORTED_CHAINS.ETHEREUM_SEPOLIA, SUPPORTED_CHAINS.POLYGON_MUMBAI],
    defaultChain: isProduction 
      ? SUPPORTED_CHAINS.ETHEREUM_MAINNET 
      : SUPPORTED_CHAINS.ETHEREUM_SEPOLIA,
  };
};

// Helper functions
export const getChainName = (chainId: number): string => {
  return CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA]?.name || `Chain ${chainId}`;
};

export const getChainSymbol = (chainId: number): string => {
  return CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA]?.symbol || 'ETH';
};

export const isChainSupported = (chainId: number): boolean => {
  return Object.keys(CHAIN_METADATA).includes(chainId.toString());
};

export const getBlockExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string => {
  const explorer = CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA]?.blockExplorer;
  if (!explorer) return '#';
  
  return `${explorer}/${type}/${hash}`;
};

// Storage utilities
export const getStorageKey = (key: string): string => {
  return `${DEFAULT_WALLET_CONFIG.storage.prefix}${key}`;
};

export const clearWalletStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(DEFAULT_WALLET_CONFIG.storage.prefix)) {
      localStorage.removeItem(key);
    }
  });
};

// Error messages
export const WALLET_ERROR_MESSAGES = {
  USER_REJECTED: 'User rejected the wallet connection request',
  WALLET_NOT_FOUND: 'No wallet found. Please install a Web3 wallet like MetaMask',
  WRONG_NETWORK: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for transaction',
  TRANSACTION_FAILED: 'Transaction failed to execute',
  SIWE_FAILED: 'Sign-In with Ethereum failed',
  CIVIC_FAILED: 'Civic authentication failed',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  ALREADY_CONNECTED: 'Wallet is already connected',
} as const; 