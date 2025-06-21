import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import { 
  SiweMessage as SiweMessageType, 
  SiweSession, 
  SiweError 
} from '../types/wallet';
import { getWalletConfig, getStorageKey } from '../utils/config';

export class SiweAuthenticator {
  private config = getWalletConfig();

  /**
   * Generate a SIWE message for signing
   */
  async generateSiweMessage(
    address: string, 
    chainId: number,
    options?: Partial<SiweMessageType>
  ): Promise<SiweMessage> {
    const nonce = this.generateNonce();
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + this.config.siwe.ttl * 1000).toISOString();

    const siweMessage = new SiweMessage({
      domain: options?.domain || this.config.siwe.domain,
      address,
      statement: options?.statement || this.config.siwe.statement,
      uri: options?.uri || `https://${this.config.siwe.domain}`,
      version: options?.version || this.config.siwe.version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      notBefore: options?.notBefore,
      requestId: options?.requestId,
      resources: options?.resources,
    });

    return siweMessage;
  }

  /**
   * Sign a SIWE message with the user's wallet
   */
  async signSiweMessage(
    message: SiweMessage,
    provider: ethers.providers.Web3Provider
  ): Promise<string> {
    try {
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message.prepareMessage());
      return signature;
    } catch (error) {
      console.error('SIWE signing failed:', error);
      throw new SiweError('Failed to sign message with wallet', 'SIGNING_FAILED');
    }
  }

  /**
   * Verify a SIWE signature
   */
  async verifySiweSignature(
    message: SiweMessage,
    signature: string
  ): Promise<boolean> {
    try {
      const result = await message.verify({ signature });
      return result.success;
    } catch (error) {
      console.error('SIWE verification failed:', error);
      return false;
    }
  }

  /**
   * Create a complete SIWE session
   */
  async createSiweSession(
    address: string,
    chainId: number,
    provider: ethers.providers.Web3Provider,
    options?: Partial<SiweMessageType>
  ): Promise<SiweSession> {
    try {
      // Generate SIWE message
      const message = await this.generateSiweMessage(address, chainId, options);
      
      // Sign the message
      const signature = await this.signSiweMessage(message, provider);
      
      // Verify the signature
      const verified = await this.verifySiweSignature(message, signature);
      
      if (!verified) {
        throw new SiweError('Signature verification failed', 'VERIFICATION_FAILED');
      }

      // Create session object
      const session: SiweSession = {
        address,
        chainId,
        message: {
          domain: message.domain,
          address: message.address,
          statement: message.statement,
          uri: message.uri,
          version: message.version,
          chainId: message.chainId,
          nonce: message.nonce,
          issuedAt: message.issuedAt,
          expirationTime: message.expirationTime,
          notBefore: message.notBefore,
          requestId: message.requestId,
          resources: message.resources,
        },
        signature,
        verified,
        expiresAt: new Date(message.expirationTime!),
      };

      // Store session in localStorage
      this.storeSession(session);

      return session;
    } catch (error) {
      console.error('SIWE session creation failed:', error);
      if (error instanceof SiweError) {
        throw error;
      }
      throw new SiweError('Failed to create SIWE session', 'SESSION_CREATION_FAILED');
    }
  }

  /**
   * Restore a SIWE session from storage
   */
  restoreSession(): SiweSession | null {
    try {
      if (typeof window === 'undefined') return null;

      const stored = localStorage.getItem(getStorageKey(this.config.storage.sessionKey));
      if (!stored) return null;

      const session: SiweSession = JSON.parse(stored);
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to restore SIWE session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: SiweSession): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.setItem(
        getStorageKey(this.config.storage.sessionKey),
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Failed to store SIWE session:', error);
    }
  }

  /**
   * Clear stored session
   */
  clearSession(): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem(getStorageKey(this.config.storage.sessionKey));
    } catch (error) {
      console.error('Failed to clear SIWE session:', error);
    }
  }

  /**
   * Validate if a session is still valid
   */
  isSessionValid(session: SiweSession | null): boolean {
    if (!session) return false;
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    return session.verified && now < expiresAt;
  }

  /**
   * Generate a cryptographically secure nonce
   */
  private generateNonce(): string {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for Node.js environments
      return ethers.utils.hexlify(ethers.utils.randomBytes(16)).slice(2);
    }
  }

  /**
   * Get session info for API calls
   */
  getSessionInfo(session: SiweSession | null): { address: string; chainId: number } | null {
    if (!this.isSessionValid(session)) return null;
    
    return {
      address: session!.address,
      chainId: session!.chainId,
    };
  }

  /**
   * Refresh session if needed (extend expiry)
   */
  async refreshSession(
    session: SiweSession,
    provider: ethers.providers.Web3Provider
  ): Promise<SiweSession> {
    const timeUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
    const shouldRefresh = timeUntilExpiry < (this.config.siwe.ttl * 1000 * 0.1); // Refresh if less than 10% time remaining

    if (!shouldRefresh) {
      return session;
    }

    // Create new session
    return this.createSiweSession(session.address, session.chainId, provider);
  }
}

// Export singleton instance
export const siweAuthenticator = new SiweAuthenticator(); 