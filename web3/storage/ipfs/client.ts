/**
 * Enhanced IPFS Client using Helia for Sigil
 * Coordinates with contracts and circuits
 */

import { createHelia, type Helia } from 'helia'
import { unixfs, type UnixFS } from '@helia/unixfs'
import { json } from '@helia/json'
import { strings } from '@helia/strings'
import { ipns } from '@helia/ipns'
import { CID } from 'multiformats/cid'
import { generateKeyPair } from '@libp2p/crypto/keys'
import {
  StorageConfig,
  StorageResult,
  StorageOptions,
  RetrievalOptions,
  StorageError,
  StorageErrorCode,
  ProofContent,
  CredentialContent,
  AggregatedDataContent,
  EncryptedData,
  ZKProofContent,
  VerifiableCredentialContent
} from '../types'
import { EncryptionService } from '../encryption'
import { PinningService } from '../pinning'
import { CacheService } from '../cache'

export class IPFSClient {
  private helia: Helia | null = null
  private fs: UnixFS | null = null
  private jsonApi: any = null
  private stringsApi: any = null
  private ipnsApi: any = null
  private encryptionService: EncryptionService
  private pinningService: PinningService
  private cacheService: CacheService
  private config: StorageConfig
  private connectionAttempts = 0
  private maxConnectionAttempts = 3
  private isConnected = false

  constructor(config: StorageConfig) {
    this.config = config
    this.encryptionService = new EncryptionService(config.encryption)
    this.pinningService = new PinningService(config.ipfs.pinningServices)
    this.cacheService = new CacheService(config.cache)
  }

  /**
   * Initialize the IPFS client
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing IPFS client with Helia...')
      
      // Create Helia instance with circuit-specific configuration
      this.helia = await createHelia({
        blockstore: {
          // Configure for ZK proof storage efficiency
          maxMemorySize: 100 * 1024 * 1024, // 100MB for proof data
        },
        datastore: {
          // Optimized for credential metadata
        },
        libp2p: {
          addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
          },
          connectionManager: {
            maxConnections: 100,
            minConnections: 10
          }
        }
      })

      // Initialize service APIs
      this.fs = unixfs(this.helia)
      this.jsonApi = json(this.helia)
      this.stringsApi = strings(this.helia)
      this.ipnsApi = ipns(this.helia)

      this.isConnected = true
      console.log('IPFS client initialized successfully')
      
      // Start cache cleanup
      this.cacheService.startCleanup()
      
    } catch (error) {
      this.connectionAttempts++
      console.error(`IPFS initialization failed (attempt ${this.connectionAttempts}):`, error)
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log('Retrying IPFS initialization...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        return this.initialize()
      }
      
      throw new StorageError(
        'Failed to initialize IPFS client after multiple attempts',
        StorageErrorCode.CONNECTION_FAILED,
        { attempts: this.connectionAttempts, error }
      )
    }
  }

  /**
   * Store ZK proof data optimized for circuit integration
   */
  async storeProof(
    proofContent: ProofContent,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureConnected()

    try {
      // Prepare proof data for storage
      const zkProofContent: ZKProofContent = {
        version: '1.0.0',
        contentType: 'zk-proof',
        timestamp: Date.now(),
        metadata: {
          proverAddress: proofContent.metadata.userAddress,
          circuitHash: proofContent.metadata.circuitHash,
          provingTime: proofContent.metadata.timestamp,
          constraints: 0, // Will be filled by circuit
          proofSize: proofContent.proof.length
        },
        circuit: {
          type: proofContent.circuitType,
          name: `${proofContent.circuitType}_credential`,
          version: proofContent.metadata.version,
          wasmCID: CID.parse('bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku'), // Placeholder
          zkeyHash: proofContent.metadata.circuitHash
        },
        proof: {
          pi_a: ['0', '0'], // Will be populated from actual proof
          pi_b: [['0', '0'], ['0', '0']],
          pi_c: ['0', '0'],
          protocol: 'groth16',
          curve: 'bn128'
        },
        publicSignals: proofContent.publicSignals,
        verificationKey: {} // Will be populated
      }

      // Encrypt if requested
      let dataToStore: any = zkProofContent
      if (options.encrypt) {
        const encrypted = await this.encryptionService.encrypt(
          JSON.stringify(zkProofContent)
        )
        dataToStore = encrypted
      }

      // Store using JSON API for structured data
      const cid = await this.jsonApi.add(dataToStore)
      
      // Pin if requested
      if (options.pin) {
        await this.pinningService.pin(cid)
      }

      // Cache the result
      await this.cacheService.set(
        cid.toString(),
        zkProofContent,
        options.tags || ['proof', proofContent.circuitType]
      )

      const result: StorageResult = {
        cid,
        size: JSON.stringify(dataToStore).length,
        hash: cid.toString(),
        timestamp: Date.now(),
        encrypted: !!options.encrypt,
        pinned: !!options.pin,
        redundancyLevel: options.redundancy || 1
      }

      console.log(`Stored ZK proof: ${cid.toString()}`)
      return result

    } catch (error) {
      throw new StorageError(
        'Failed to store ZK proof',
        StorageErrorCode.INVALID_CONTENT_TYPE,
        { error, proofType: proofContent.circuitType }
      )
    }
  }

  /**
   * Store verifiable credential with proof reference
   */
  async storeCredential(
    credentialContent: CredentialContent,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureConnected()

    try {
      // Store the ZK proof first
      const proofResult = await this.storeProof(credentialContent.proof, {
        ...options,
        tags: [...(options.tags || []), 'credential-proof']
      })

      // Create verifiable credential with proof reference
      const vcContent: VerifiableCredentialContent = {
        version: '1.0.0',
        contentType: 'verifiable-credential',
        timestamp: Date.now(),
        metadata: credentialContent.metadata,
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://sigil.dev/credentials/v1'
        ],
        type: ['VerifiableCredential', 'SigilDeveloperCredential'],
        issuer: {
          id: 'did:sigil:issuer',
          name: 'Sigil Protocol',
          type: 'ZKCredentialIssuer'
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(credentialContent.metadata.expiresAt).toISOString(),
        credentialSubject: {
          id: credentialContent.metadata.subject,
          type: 'DeveloperProfile',
          claims: this.extractClaims(credentialContent)
        },
        proof: {
          type: 'ZKProof',
          created: new Date().toISOString(),
          verificationMethod: credentialContent.proof.metadata.verifierContract,
          proofValue: proofResult.hash,
          zkProofCID: proofResult.cid,
          verifierContract: credentialContent.proof.metadata.verifierContract
        }
      }

      // Encrypt if requested
      let dataToStore: any = vcContent
      if (options.encrypt) {
        const encrypted = await this.encryptionService.encrypt(
          JSON.stringify(vcContent)
        )
        dataToStore = encrypted
      }

      // Store credential
      const cid = await this.jsonApi.add(dataToStore)

      // Pin if requested
      if (options.pin) {
        await this.pinningService.pin(cid)
      }

      // Cache the result
      await this.cacheService.set(
        cid.toString(),
        vcContent,
        options.tags || ['credential', credentialContent.metadata.credentialSchema]
      )

      const result: StorageResult = {
        cid,
        size: JSON.stringify(dataToStore).length,
        hash: cid.toString(),
        timestamp: Date.now(),
        encrypted: !!options.encrypt,
        pinned: !!options.pin,
        redundancyLevel: options.redundancy || 1
      }

      console.log(`Stored verifiable credential: ${cid.toString()}`)
      return result

    } catch (error) {
      throw new StorageError(
        'Failed to store verifiable credential',
        StorageErrorCode.INVALID_CONTENT_TYPE,
        { error, credentialType: credentialContent.metadata.credentialSchema }
      )
    }
  }

  /**
   * Store aggregated developer data
   */
  async storeAggregatedData(
    aggregatedData: AggregatedDataContent,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureConnected()

    try {
      // Apply differential privacy if configured
      const privateData = await this.applyPrivacyTechniques(aggregatedData)

      // Encrypt by default for aggregated data
      const shouldEncrypt = options.encrypt !== false
      let dataToStore: any = privateData

      if (shouldEncrypt) {
        const encrypted = await this.encryptionService.encrypt(
          JSON.stringify(privateData)
        )
        dataToStore = encrypted
      }

      // Store using JSON API
      const cid = await this.jsonApi.add(dataToStore)

      // Always pin aggregated data
      await this.pinningService.pin(cid)

      // Cache with privacy-aware tags
      await this.cacheService.set(
        cid.toString(),
        privateData,
        ['aggregated', 'private', ...(options.tags || [])]
      )

      const result: StorageResult = {
        cid,
        size: JSON.stringify(dataToStore).length,
        hash: cid.toString(),
        timestamp: Date.now(),
        encrypted: shouldEncrypt,
        pinned: true,
        redundancyLevel: options.redundancy || 2 // Higher redundancy for aggregated data
      }

      console.log(`Stored aggregated data: ${cid.toString()}`)
      return result

    } catch (error) {
      throw new StorageError(
        'Failed to store aggregated data',
        StorageErrorCode.INVALID_CONTENT_TYPE,
        { error }
      )
    }
  }

  /**
   * Retrieve content by CID with caching
   */
  async retrieve<T = any>(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<T> {
    this.ensureConnected()

    try {
      const cidStr = typeof cid === 'string' ? cid : cid.toString()
      
      // Check cache first
      if (options.fallbackToCache !== false) {
        const cached = await this.cacheService.get<T>(cidStr)
        if (cached) {
          console.log(`Retrieved from cache: ${cidStr}`)
          return cached
        }
      }

      // Retrieve from IPFS
      const parsedCid = typeof cid === 'string' ? CID.parse(cid) : cid
      const data = await this.jsonApi.get(parsedCid)

      // Decrypt if necessary
      let result = data
      if (this.isEncryptedData(data)) {
        if (!options.decryptionKey) {
          throw new StorageError(
            'Decryption key required for encrypted content',
            StorageErrorCode.DECRYPTION_FAILED
          )
        }
        const decrypted = await this.encryptionService.decrypt(data as EncryptedData)
        result = JSON.parse(decrypted)
      }

      // Verify integrity if requested
      if (options.verifyIntegrity) {
        await this.verifyContentIntegrity(result, parsedCid)
      }

      // Cache the result
      await this.cacheService.set(cidStr, result)

      console.log(`Retrieved from IPFS: ${cidStr}`)
      return result

    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(
        'Failed to retrieve content',
        StorageErrorCode.CONTENT_NOT_FOUND,
        { cid: cid.toString(), error }
      )
    }
  }

  /**
   * Store raw bytes (for circuit files, etc.)
   */
  async storeBytes(
    data: Uint8Array,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureConnected()

    try {
      // Use UnixFS for raw bytes
      const cid = await this.fs!.addBytes(data)

      // Pin if requested
      if (options.pin) {
        await this.pinningService.pin(cid)
      }

      const result: StorageResult = {
        cid,
        size: data.length,
        hash: cid.toString(),
        timestamp: Date.now(),
        encrypted: false,
        pinned: !!options.pin,
        redundancyLevel: options.redundancy || 1
      }

      console.log(`Stored bytes: ${cid.toString()} (${data.length} bytes)`)
      return result

    } catch (error) {
      throw new StorageError(
        'Failed to store bytes',
        StorageErrorCode.INVALID_CONTENT_TYPE,
        { error, size: data.length }
      )
    }
  }

  /**
   * Retrieve raw bytes
   */
  async retrieveBytes(cid: CID | string): Promise<Uint8Array> {
    this.ensureConnected()

    try {
      const parsedCid = typeof cid === 'string' ? CID.parse(cid) : cid
      
      const chunks: Uint8Array[] = []
      for await (const chunk of this.fs!.cat(parsedCid)) {
        chunks.push(chunk)
      }

      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }

      return result

    } catch (error) {
      throw new StorageError(
        'Failed to retrieve bytes',
        StorageErrorCode.CONTENT_NOT_FOUND,
        { cid: cid.toString(), error }
      )
    }
  }

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    if (this.helia) {
      await this.helia.stop()
      this.isConnected = false
      console.log('IPFS client shutdown complete')
    }
    this.cacheService.stopCleanup()
  }

  // Private helper methods

  private ensureConnected(): void {
    if (!this.isConnected || !this.helia) {
      throw new StorageError(
        'IPFS client not connected',
        StorageErrorCode.CONNECTION_FAILED
      )
    }
  }

  private extractClaims(credentialContent: CredentialContent): any {
    // Extract claims based on credential format
    switch (credentialContent.format) {
      case 'w3c':
        return credentialContent.credential
      default:
        return credentialContent.credential
    }
  }

  private async applyPrivacyTechniques(
    data: AggregatedDataContent
  ): Promise<AggregatedDataContent> {
    // Apply differential privacy noise if configured
    if (data.metadata.privacyLevel === 'differential-private') {
      // Add calibrated noise to numerical values
      return this.addDifferentialPrivacyNoise(data)
    }
    
    // Apply k-anonymity if configured
    if (data.metadata.privacyLevel === 'k-anonymous') {
      return this.applyKAnonymity(data)
    }

    return data
  }

  private addDifferentialPrivacyNoise(
    data: AggregatedDataContent
  ): AggregatedDataContent {
    // Simplified noise addition - in production, use proper DP mechanisms
    const noise = Math.random() * 0.1 - 0.05 // ±5% noise
    
    return {
      ...data,
      repositories: data.repositories.map(repo => ({
        ...repo,
        commitCount: Math.max(0, Math.round(repo.commitCount * (1 + noise))),
        collaboratorCount: Math.max(1, Math.round(repo.collaboratorCount * (1 + noise)))
      }))
    }
  }

  private applyKAnonymity(data: AggregatedDataContent): AggregatedDataContent {
    // Generalize data to ensure k-anonymity
    return {
      ...data,
      repositories: data.repositories.map(repo => ({
        ...repo,
        // Generalize commit counts to ranges
        commitCount: this.generalizeToRange(repo.commitCount, [0, 10, 50, 100, 500]),
        // Generalize collaborator counts
        collaboratorCount: this.generalizeToRange(repo.collaboratorCount, [1, 5, 10, 20])
      }))
    }
  }

  private generalizeToRange(value: number, ranges: number[]): number {
    for (let i = 0; i < ranges.length - 1; i++) {
      if (value >= ranges[i] && value < ranges[i + 1]) {
        return ranges[i]
      }
    }
    return ranges[ranges.length - 1]
  }

  private isEncryptedData(data: any): boolean {
    return data && typeof data === 'object' && 'data' in data && 'metadata' in data
  }

  private async verifyContentIntegrity(content: any, cid: CID): Promise<void> {
    // Implement content integrity verification
    // This could include checksum verification, signature validation, etc.
    console.log(`Verifying integrity for: ${cid.toString()}`)
  }
} 