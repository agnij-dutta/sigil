/**
 * Encryption Service for Sigil IPFS Storage
 * Provides client-side encryption for sensitive data
 */

import { webcrypto } from 'crypto'
import {
  EncryptionConfig,
  EncryptionMetadata,
  EncryptedData,
  StorageError,
  StorageErrorCode
} from './types'

export class EncryptionService {
  private config: EncryptionConfig
  private crypto: Crypto

  constructor(config: EncryptionConfig) {
    this.config = config
    this.crypto = webcrypto as Crypto
  }

  /**
   * Encrypt data using configured algorithm
   */
  async encrypt(
    data: string | Uint8Array,
    password?: string
  ): Promise<EncryptedData> {
    try {
      const dataBytes = typeof data === 'string' ? 
        new TextEncoder().encode(data) : data

      // Generate salt and IV
      const salt = this.crypto.getRandomValues(new Uint8Array(this.config.saltLength))
      const iv = this.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM

      // Derive key from password or generate random key
      const key = password ? 
        await this.deriveKeyFromPassword(password, salt) :
        await this.generateRandomKey()

      // Encrypt the data
      const encryptedData = await this.crypto.subtle.encrypt(
        {
          name: this.config.algorithm === 'AES-256-GCM' ? 'AES-GCM' : 'ChaCha20-Poly1305',
          iv: iv
        },
        key,
        dataBytes
      )

      // Create metadata
      const metadata: EncryptionMetadata = {
        algorithm: this.config.algorithm,
        iv: iv,
        salt: salt,
        keyDerivationParams: {
          iterations: this.config.iterations,
          ...(this.config.keyDerivation === 'Argon2id' && {
            memory: 65536, // 64MB
            parallelism: 4
          })
        }
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(new Uint8Array(encryptedData))

      return {
        data: new Uint8Array(encryptedData),
        metadata,
        checksum
      }

    } catch (error) {
      throw new StorageError(
        'Encryption failed',
        StorageErrorCode.ENCRYPTION_FAILED,
        { error, algorithm: this.config.algorithm }
      )
    }
  }

  /**
   * Decrypt data using metadata
   */
  async decrypt(
    encryptedData: EncryptedData,
    password?: string
  ): Promise<string> {
    try {
      // Verify checksum
      const calculatedChecksum = await this.calculateChecksum(encryptedData.data)
      if (calculatedChecksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed')
      }

      // Derive key
      const key = password ?
        await this.deriveKeyFromPassword(password, encryptedData.metadata.salt) :
        await this.generateRandomKey() // This would need to be stored/retrieved somehow

      // Decrypt the data
      const decryptedData = await this.crypto.subtle.decrypt(
        {
          name: encryptedData.metadata.algorithm === 'AES-256-GCM' ? 'AES-GCM' : 'ChaCha20-Poly1305',
          iv: encryptedData.metadata.iv
        },
        key,
        encryptedData.data
      )

      return new TextDecoder().decode(decryptedData)

    } catch (error) {
      throw new StorageError(
        'Decryption failed',
        StorageErrorCode.DECRYPTION_FAILED,
        { error, algorithm: encryptedData.metadata.algorithm }
      )
    }
  }

  /**
   * Encrypt data specifically for ZK proofs
   * Uses deterministic encryption for proof verification
   */
  async encryptProofData(
    proofData: Uint8Array,
    circuitHash: string
  ): Promise<EncryptedData> {
    try {
      // Use circuit hash as part of key derivation for deterministic encryption
      const salt = new TextEncoder().encode(circuitHash).slice(0, this.config.saltLength)
      const key = await this.deriveKeyFromData(circuitHash, salt)
      
      // Generate IV deterministically but securely
      const iv = await this.generateDeterministicIV(circuitHash)

      const encryptedData = await this.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        proofData
      )

      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        iv: iv,
        salt: salt,
        keyDerivationParams: {
          iterations: this.config.iterations
        }
      }

      const checksum = await this.calculateChecksum(new Uint8Array(encryptedData))

      return {
        data: new Uint8Array(encryptedData),
        metadata,
        checksum
      }

    } catch (error) {
      throw new StorageError(
        'Proof encryption failed',
        StorageErrorCode.ENCRYPTION_FAILED,
        { error, circuitHash }
      )
    }
  }

  /**
   * Generate encryption key for wallet-based encryption
   */
  async generateWalletKey(
    walletAddress: string,
    signature: string
  ): Promise<CryptoKey> {
    try {
      // Combine wallet address and signature for key material
      const keyMaterial = new TextEncoder().encode(walletAddress + signature)
      
      // Import as raw key material
      const baseKey = await this.crypto.subtle.importKey(
        'raw',
        await this.crypto.subtle.digest('SHA-256', keyMaterial),
        'PBKDF2',
        false,
        ['deriveKey']
      )

      // Derive actual encryption key
      const salt = new TextEncoder().encode(walletAddress).slice(0, 16)
      
      return await this.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.config.iterations,
          hash: 'SHA-256'
        },
        baseKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      )

    } catch (error) {
      throw new StorageError(
        'Wallet key generation failed',
        StorageErrorCode.ENCRYPTION_FAILED,
        { error, walletAddress }
      )
    }
  }

  /**
   * Encrypt data with wallet-derived key
   */
  async encryptWithWallet(
    data: string | Uint8Array,
    walletAddress: string,
    signature: string
  ): Promise<EncryptedData> {
    try {
      const dataBytes = typeof data === 'string' ? 
        new TextEncoder().encode(data) : data

      const key = await this.generateWalletKey(walletAddress, signature)
      const iv = this.crypto.getRandomValues(new Uint8Array(12))

      const encryptedData = await this.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBytes
      )

      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        iv: iv,
        salt: new TextEncoder().encode(walletAddress).slice(0, 16),
        keyDerivationParams: {
          iterations: this.config.iterations
        }
      }

      const checksum = await this.calculateChecksum(new Uint8Array(encryptedData))

      return {
        data: new Uint8Array(encryptedData),
        metadata,
        checksum
      }

    } catch (error) {
      throw new StorageError(
        'Wallet encryption failed',
        StorageErrorCode.ENCRYPTION_FAILED,
        { error, walletAddress }
      )
    }
  }

  /**
   * Decrypt data with wallet-derived key
   */
  async decryptWithWallet(
    encryptedData: EncryptedData,
    walletAddress: string,
    signature: string
  ): Promise<string> {
    try {
      // Verify checksum
      const calculatedChecksum = await this.calculateChecksum(encryptedData.data)
      if (calculatedChecksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed')
      }

      const key = await this.generateWalletKey(walletAddress, signature)

      const decryptedData = await this.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: encryptedData.metadata.iv
        },
        key,
        encryptedData.data
      )

      return new TextDecoder().decode(decryptedData)

    } catch (error) {
      throw new StorageError(
        'Wallet decryption failed',
        StorageErrorCode.DECRYPTION_FAILED,
        { error, walletAddress }
      )
    }
  }

  // Private helper methods

  private async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const passwordKey = await this.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    if (this.config.keyDerivation === 'PBKDF2') {
      return await this.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.config.iterations,
          hash: 'SHA-256'
        },
        passwordKey,
        {
          name: this.config.algorithm === 'AES-256-GCM' ? 'AES-GCM' : 'AES-GCM', // Fallback to AES-GCM
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      )
    } else {
      // For Argon2id, we'd need a different implementation
      // For now, fallback to PBKDF2
      return await this.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.config.iterations * 2, // Increase iterations for Argon2id equivalent
          hash: 'SHA-256'
        },
        passwordKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      )
    }
  }

  private async deriveKeyFromData(
    data: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const dataKey = await this.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(data),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return await this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      dataKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private async generateDeterministicIV(seed: string): Promise<Uint8Array> {
    // Generate deterministic IV from seed
    const hash = await this.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(seed)
    )
    return new Uint8Array(hash).slice(0, 12) // 96-bit IV
  }

  private async generateRandomKey(): Promise<CryptoKey> {
    return await this.crypto.subtle.generateKey(
      {
        name: this.config.algorithm === 'AES-256-GCM' ? 'AES-GCM' : 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private async calculateChecksum(data: Uint8Array): Promise<string> {
    const hash = await this.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Create encryption key from contract interaction
   * Useful for encrypting data that will be referenced on-chain
   */
  async createContractKey(
    contractAddress: string,
    userAddress: string,
    signature: string
  ): Promise<CryptoKey> {
    try {
      const keyMaterial = new TextEncoder().encode(
        `${contractAddress}:${userAddress}:${signature}`
      )
      
      const hash = await this.crypto.subtle.digest('SHA-256', keyMaterial)
      
      return await this.crypto.subtle.importKey(
        'raw',
        hash,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
      )

    } catch (error) {
      throw new StorageError(
        'Contract key creation failed',
        StorageErrorCode.ENCRYPTION_FAILED,
        { error, contractAddress, userAddress }
      )
    }
  }

  /**
   * Validate encryption configuration
   */
  validateConfig(): boolean {
    const validAlgorithms = ['AES-256-GCM', 'ChaCha20-Poly1305']
    const validDerivations = ['PBKDF2', 'Argon2id']

    return (
      validAlgorithms.includes(this.config.algorithm) &&
      validDerivations.includes(this.config.keyDerivation) &&
      this.config.saltLength >= 16 &&
      this.config.iterations >= 100000
    )
  }
} 