// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider: any;
  signer?: any;
}

export interface AuthenticationState {
  wallet: WalletConnection | null;
  user: {
    address: string;
    ensName?: string;
    avatar?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export class WalletAuthProvider {
  private state: AuthenticationState = {
    wallet: null,
    user: null,
    isAuthenticated: false,
    isLoading: false
  };

  private listeners: ((state: AuthenticationState) => void)[] = [];

  async connectWallet(providerType: 'metamask' | 'walletconnect' | 'coinbase'): Promise<WalletConnection> {
    this.setState({ isLoading: true, error: undefined });

    try {
      let provider: any;
      
      switch (providerType) {
        case 'metamask':
          provider = await this.connectMetaMask();
          break;
        case 'walletconnect':
          provider = await this.connectWalletConnect();
          break;
        case 'coinbase':
          provider = await this.connectCoinbase();
          break;
        default:
          throw new Error(`Unsupported provider: ${providerType}`);
      }

      const accounts = await provider.request({ method: 'eth_accounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const wallet: WalletConnection = {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
        provider
      };

      // Create user profile
      const user = {
        address: accounts[0],
        ensName: await this.resolveENS(accounts[0]),
        avatar: await this.getAvatarURL(accounts[0])
      };

      this.setState({
        wallet,
        user,
        isAuthenticated: true,
        isLoading: false
      });

      // Setup event listeners
      this.setupProviderListeners(provider);

      return wallet;
    } catch (error) {
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.setState({
      wallet: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: undefined
    });
  }

  async signMessage(message: string): Promise<string> {
    if (!this.state.wallet?.provider) {
      throw new Error('No wallet connected');
    }

    try {
      const signature = await this.state.wallet.provider.request({
        method: 'personal_sign',
        params: [message, this.state.wallet.address]
      });

      return signature;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.state.wallet?.provider) {
      throw new Error('No wallet connected');
    }

    try {
      await this.state.wallet.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });

      this.setState({
        wallet: this.state.wallet ? {
          ...this.state.wallet,
          chainId
        } : null
      });
    } catch (error) {
      throw new Error(`Failed to switch network: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async connectMetaMask(): Promise<any> {
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return window.ethereum;
    }
    throw new Error('MetaMask not installed');
  }

  private async connectWalletConnect(): Promise<any> {
    // WalletConnect integration would go here
    throw new Error('WalletConnect not implemented yet');
  }

  private async connectCoinbase(): Promise<any> {
    // Coinbase Wallet integration would go here
    throw new Error('Coinbase Wallet not implemented yet');
  }

  private async resolveENS(address: string): Promise<string | undefined> {
    try {
      // ENS resolution logic would go here
      return undefined;
    } catch {
      return undefined;
    }
  }

  private async getAvatarURL(address: string): Promise<string | undefined> {
    try {
      // Avatar resolution logic would go here
      return undefined;
    } catch {
      return undefined;
    }
  }

  private setupProviderListeners(provider: any): void {
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.setState({
          wallet: this.state.wallet ? {
            ...this.state.wallet,
            address: accounts[0]
          } : null,
          user: this.state.user ? {
            ...this.state.user,
            address: accounts[0]
          } : null
        });
      }
    });

    provider.on('chainChanged', (chainId: string) => {
      this.setState({
        wallet: this.state.wallet ? {
          ...this.state.wallet,
          chainId: parseInt(chainId, 16)
        } : null
      });
    });

    provider.on('disconnect', () => {
      this.disconnectWallet();
    });
  }

  private setState(updates: Partial<AuthenticationState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthenticationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): AuthenticationState {
    return { ...this.state };
  }
} 