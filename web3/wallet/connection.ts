import { ethers } from 'ethers';
import { 
  WalletConnection, 
  WalletProvider, 
  WalletError,
  WalletEvent 
} from '../types/wallet';
import { 
  getWalletConfig, 
  isChainSupported, 
  WALLET_ERROR_MESSAGES 
} from '../utils/config';

export class WalletConnector {
  private config = getWalletConfig();
  private eventListeners: ((event: WalletEvent) => void)[] = [];

  /**
   * Connect to a wallet provider
   */
  async connectWallet(provider: WalletProvider = 'metamask'): Promise<WalletConnection> {
    try {
      switch (provider) {
        case 'metamask':
          return await this.connectMetaMask();
        case 'injected':
          return await this.connectInjected();
        default:
          throw new WalletError(`Provider ${provider} not yet implemented`, 'PROVIDER_NOT_IMPLEMENTED');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError('Failed to connect wallet', 'CONNECTION_FAILED');
    }
  }

  /**
   * Connect to MetaMask
   */
  private async connectMetaMask(): Promise<WalletConnection> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new WalletError(WALLET_ERROR_MESSAGES.WALLET_NOT_FOUND, 'WALLET_NOT_FOUND');
    }

    // Check if MetaMask is installed
    if (!window.ethereum.isMetaMask) {
      throw new WalletError('MetaMask not detected', 'METAMASK_NOT_FOUND');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new WalletError(WALLET_ERROR_MESSAGES.USER_REJECTED, 'USER_REJECTED');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      const connection: WalletConnection = {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
        connector: 'metamask',
      };

      // Validate chain
      if (!isChainSupported(connection.chainId)) {
        await this.switchToSupportedChain();
        // Update chainId after switch
        const newChainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        connection.chainId = parseInt(newChainId, 16);
      }

      // Set up event listeners
      this.setupMetaMaskListeners();

      // Emit connect event
      this.emitEvent({ type: 'connect', data: connection });

      return connection;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new WalletError(WALLET_ERROR_MESSAGES.USER_REJECTED, 'USER_REJECTED');
      }
      throw new WalletError('MetaMask connection failed', 'METAMASK_CONNECTION_FAILED');
    }
  }

  /**
   * Connect to any injected wallet
   */
  private async connectInjected(): Promise<WalletConnection> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new WalletError(WALLET_ERROR_MESSAGES.WALLET_NOT_FOUND, 'WALLET_NOT_FOUND');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new WalletError(WALLET_ERROR_MESSAGES.USER_REJECTED, 'USER_REJECTED');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      const connection: WalletConnection = {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
        connector: 'injected',
      };

      // Set up event listeners
      this.setupEthereumListeners();

      // Emit connect event
      this.emitEvent({ type: 'connect', data: connection });

      return connection;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new WalletError(WALLET_ERROR_MESSAGES.USER_REJECTED, 'USER_REJECTED');
      }
      throw new WalletError('Wallet connection failed', 'CONNECTION_FAILED');
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      // Remove event listeners
      this.removeEthereumListeners();

      // Emit disconnect event
      this.emitEvent({ type: 'disconnect' });

      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      throw new WalletError('Failed to disconnect wallet', 'DISCONNECTION_FAILED');
    }
  }

  /**
   * Switch to a supported chain
   */
  async switchChain(chainId: number): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new WalletError(WALLET_ERROR_MESSAGES.WALLET_NOT_FOUND, 'WALLET_NOT_FOUND');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      // Emit chain changed event
      this.emitEvent({ type: 'chainChanged', data: { chainId } });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to wallet, try to add it
        await this.addChainToWallet(chainId);
      } else {
        throw new WalletError('Failed to switch chain', 'CHAIN_SWITCH_FAILED');
      }
    }
  }

  /**
   * Switch to the first supported chain
   */
  private async switchToSupportedChain(): Promise<void> {
    const supportedChain = this.config.supportedChains[0];
    await this.switchChain(supportedChain);
  }

  /**
   * Add a chain to the wallet
   */
  private async addChainToWallet(chainId: number): Promise<void> {
    // This would need chain metadata - simplified for now
    throw new WalletError(WALLET_ERROR_MESSAGES.WRONG_NETWORK, 'UNSUPPORTED_CHAIN');
  }

  /**
   * Get Web3 provider
   */
  getProvider(): ethers.providers.Web3Provider | null {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    return new ethers.providers.Web3Provider(window.ethereum);
  }

  /**
   * Get current account info
   */
  async getCurrentAccount(): Promise<WalletConnection | null> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (!accounts || accounts.length === 0) {
        return null;
      }

      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
        connector: window.ethereum.isMetaMask ? 'metamask' : 'injected',
      };
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  /**
   * Check if wallet is connected
   */
  async isConnected(): Promise<boolean> {
    const account = await this.getCurrentAccount();
    return account !== null;
  }

  /**
   * Set up MetaMask specific event listeners
   */
  private setupMetaMaskListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
    window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
  }

  /**
   * Set up generic Ethereum event listeners
   */
  private setupEthereumListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
  }

  /**
   * Remove Ethereum event listeners
   */
  private removeEthereumListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged.bind(this));
    window.ethereum.removeListener('chainChanged', this.handleChainChanged.bind(this));
    window.ethereum.removeListener('disconnect', this.handleDisconnect.bind(this));
  }

  /**
   * Handle account changes
   */
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.emitEvent({ type: 'disconnect' });
    } else {
      this.emitEvent({ 
        type: 'accountChanged', 
        data: { address: accounts[0] } 
      });
    }
  }

  /**
   * Handle chain changes
   */
  private handleChainChanged(chainId: string): void {
    this.emitEvent({ 
      type: 'chainChanged', 
      data: { chainId: parseInt(chainId, 16) } 
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.emitEvent({ type: 'disconnect' });
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: WalletEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: WalletEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: WalletEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }
}

// Global ethereum interface extension
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Export singleton instance
export const walletConnector = new WalletConnector(); 