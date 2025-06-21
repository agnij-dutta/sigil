/**
 * Main Storage Index for Sigil IPFS Integration
 * Provides unified interface to all storage services
 */

// Export all types
export * from './types'

// Export core services
export { IPFSClient } from './ipfs/client'
export { EncryptionService } from './encryption'
export { PinningService } from './pinning'
export { CacheService } from './cache'
export { RetrievalService } from './retrieval'
export { GarbageCollectionService } from './garbage_collection'

// Export specific interfaces and classes
export type {
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
  PinningServiceConfig,
  CacheConfig,
  RedundancyStatus
} from './types'

export type {
  RetrievalResult
} from './retrieval'

export type {
  PinStatus,
  PinningResult
} from './pinning'

export type {
  GCConfig,
  GCResult,
  RetentionPolicy
} from './garbage_collection'

// Main Storage Manager Class
import { IPFSClient } from './ipfs/client'
import { EncryptionService } from './encryption'
import { PinningService } from './pinning'
import { CacheService } from './cache'
import { RetrievalService } from './retrieval'
import { GarbageCollectionService } from './garbage_collection'
import {
  StorageConfig,
  StorageResult,
  StorageOptions,
  RetrievalOptions,
  ProofContent,
  CredentialContent,
  AggregatedDataContent,
  StorageMetrics,
  StorageError,
  StorageErrorCode
} from './types'
import { CID } from 'multiformats/cid'
import type { GCConfig } from './garbage_collection'

export class SigilStorageManager {
  private ipfsClient: IPFSClient
  private encryptionService: EncryptionService
  private pinningService: PinningService
  private cacheService: CacheService
  private retrievalService: RetrievalService
  private gcService: GarbageCollectionService
  private initialized = false

  constructor(config: StorageConfig, gcConfig?: GCConfig) {
    this.ipfsClient = new IPFSClient(config)
    this.encryptionService = new EncryptionService(config.encryption)
    this.pinningService = new PinningService(config.ipfs.pinningServices)
    this.cacheService = new CacheService(config.cache)
    this.retrievalService = new RetrievalService(
      this.ipfsClient,
      this.cacheService,
      this.encryptionService,
      config.ipfs.gateway
    )
    
    if (gcConfig) {
      this.gcService = new GarbageCollectionService(
        this.ipfsClient,
        this.cacheService,
        this.pinningService,
        gcConfig
      )
    }
  }

  /**
   * Initialize all storage services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      console.log('Initializing Sigil Storage Manager...')

      // Initialize IPFS client first
      await this.ipfsClient.initialize()

      // Start cache cleanup
      this.cacheService.startCleanup()

      // Start GC if configured
      if (this.gcService) {
        this.gcService.startScheduledCleanup()
      }

      this.initialized = true
      console.log('Sigil Storage Manager initialized successfully')

    } catch (error) {
      throw new StorageError(
        'Storage manager initialization failed',
        StorageErrorCode.CONNECTION_FAILED,
        { error }
      )
    }
  }

  /**
   * Store ZK proof with automatic optimization
   */
  async storeProof(
    proofContent: ProofContent,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureInitialized()
    
    // Default to encryption and pinning for proofs
    const enhancedOptions: StorageOptions = {
      encrypt: true,
      pin: true,
      redundancy: 2,
      ...options,
      tags: ['proof', proofContent.circuitType, ...(options.tags || [])]
    }

    return await this.ipfsClient.storeProof(proofContent, enhancedOptions)
  }

  /**
   * Store verifiable credential with automatic optimization
   */
  async storeCredential(
    credentialContent: CredentialContent,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureInitialized()

    // Default to encryption and pinning for credentials
    const enhancedOptions: StorageOptions = {
      encrypt: true,
      pin: true,
      redundancy: 2,
      ...options,
      tags: ['credential', credentialContent.metadata.credentialSchema, ...(options.tags || [])]
    }

    return await this.ipfsClient.storeCredential(credentialContent, enhancedOptions)
  }

  /**
   * Store aggregated data with privacy protection
   */
  async storeAggregatedData(
    aggregatedData: AggregatedDataContent,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureInitialized()

    // Always encrypt aggregated data for privacy
    const enhancedOptions: StorageOptions = {
      encrypt: true,
      pin: true,
      redundancy: 3, // Higher redundancy for aggregated data
      ...options,
      tags: ['aggregated', 'private', ...(options.tags || [])]
    }

    return await this.ipfsClient.storeAggregatedData(aggregatedData, enhancedOptions)
  }

  /**
   * Store raw bytes (circuit files, etc.)
   */
  async storeBytes(
    data: Uint8Array,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    this.ensureInitialized()
    return await this.ipfsClient.storeBytes(data, options)
  }

  /**
   * Retrieve content with automatic optimization
   */
  async retrieve<T = any>(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<T> {
    this.ensureInitialized()
    
    const result = await this.retrievalService.retrieveWithFallback<T>(cid, options)
    return result.content
  }

  /**
   * Retrieve ZK proof with validation
   */
  async retrieveProof(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<ProofContent> {
    this.ensureInitialized()
    
    const result = await this.retrievalService.retrieveProof(cid, options)
    return result.content
  }

  /**
   * Retrieve verifiable credential with validation
   */
  async retrieveCredential(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<CredentialContent> {
    this.ensureInitialized()
    
    const result = await this.retrievalService.retrieveCredential(cid, options)
    return result.content as any // Type assertion for now
  }

  /**
   * Retrieve aggregated data with privacy validation
   */
  async retrieveAggregatedData(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<AggregatedDataContent> {
    this.ensureInitialized()
    
    const result = await this.retrievalService.retrieveAggregatedData(cid, options)
    return result.content
  }

  /**
   * Retrieve raw bytes
   */
  async retrieveBytes(cid: CID | string): Promise<Uint8Array> {
    this.ensureInitialized()
    return await this.ipfsClient.retrieveBytes(cid)
  }

  /**
   * Pin content for persistence
   */
  async pin(cid: CID, redundancyLevel: number = 2): Promise<void> {
    this.ensureInitialized()
    await this.pinningService.pin(cid, redundancyLevel)
  }

  /**
   * Unpin content
   */
  async unpin(cid: CID): Promise<void> {
    this.ensureInitialized()
    await this.pinningService.unpin(cid)
  }

  /**
   * Encrypt data with wallet-derived key
   */
  async encryptWithWallet(
    data: string | Uint8Array,
    walletAddress: string,
    signature: string
  ): Promise<any> {
    return await this.encryptionService.encryptWithWallet(data, walletAddress, signature)
  }

  /**
   * Decrypt data with wallet-derived key
   */
  async decryptWithWallet(
    encryptedData: any,
    walletAddress: string,
    signature: string
  ): Promise<string> {
    return await this.encryptionService.decryptWithWallet(encryptedData, walletAddress, signature)
  }

  /**
   * Get comprehensive storage metrics
   */
  async getMetrics(): Promise<StorageMetrics> {
    this.ensureInitialized()

    const cacheStats = this.cacheService.getStats()
    const redundancyHealth = await this.pinningService.getRedundancyHealth()

    return {
      totalStoredBytes: cacheStats.basic.size,
      totalContentItems: cacheStats.basic.itemCount,
      cacheHitRate: cacheStats.basic.hitRate,
      averageRetrievalTime: 0, // Would be tracked by retrieval service
      redundancyHealth,
      errorRate: 0, // Would be tracked globally
      costMetrics: {
        storageCost: 0,
        bandwidthCost: 0,
        pinningCost: 0
      }
    }
  }

  /**
   * Run garbage collection
   */
  async runGarbageCollection(): Promise<any> {
    this.ensureInitialized()
    
    if (!this.gcService) {
      throw new StorageError(
        'Garbage collection not configured',
        StorageErrorCode.CONNECTION_FAILED
      )
    }

    return await this.gcService.runGC()
  }

  /**
   * Check storage health
   */
  async checkHealth(): Promise<{
    ipfs: boolean
    cache: boolean
    pinning: boolean
    overall: boolean
  }> {
    this.ensureInitialized()

    const ipfsHealth = this.ipfsClient !== null
    const cacheHealth = this.cacheService !== null
    const pinningHealth = await this.checkPinningHealth()

    return {
      ipfs: ipfsHealth,
      cache: cacheHealth,
      pinning: pinningHealth,
      overall: ipfsHealth && cacheHealth && pinningHealth
    }
  }

  /**
   * Clean shutdown of all services
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    console.log('Shutting down Sigil Storage Manager...')

    // Stop scheduled services
    this.cacheService.stopCleanup()
    if (this.gcService) {
      this.gcService.stopScheduledCleanup()
    }

    // Shutdown IPFS client
    await this.ipfsClient.shutdown()

    this.initialized = false
    console.log('Sigil Storage Manager shutdown complete')
  }

  /**
   * Clear user-specific cache
   */
  async clearUserCache(userAddress: string): Promise<void> {
    this.ensureInitialized()
    await this.cacheService.clearUserCache(userAddress)
  }

  /**
   * Batch operations
   */
  async batchStore(
    items: Array<{
      content: ProofContent | CredentialContent | AggregatedDataContent
      options?: StorageOptions
    }>
  ): Promise<StorageResult[]> {
    this.ensureInitialized()

    const storePromises = items.map(async ({ content, options }) => {
      if ('circuitType' in content) {
        return this.storeProof(content as ProofContent, options)
      } else if ('proof' in content && 'metadata' in content) {
        return this.storeCredential(content as CredentialContent, options)
      } else {
        return this.storeAggregatedData(content as AggregatedDataContent, options)
      }
    })

    return await Promise.all(storePromises)
  }

  /**
   * Batch retrieve
   */
  async batchRetrieve<T = any>(
    cids: (CID | string)[],
    options: RetrievalOptions = {}
  ): Promise<T[]> {
    this.ensureInitialized()

    const results = await this.retrievalService.retrieveBatch<T>(cids, options)
    
    // Filter out errors and return only successful results
    return results
      .filter((result): result is any => !(result instanceof Error))
      .map(result => result.content)
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new StorageError(
        'Storage manager not initialized',
        StorageErrorCode.CONNECTION_FAILED
      )
    }
  }

  private async checkPinningHealth(): Promise<boolean> {
    try {
      const health = await this.pinningService.getRedundancyHealth()
      return health.replicationHealth !== 'critical'
    } catch {
      return false
    }
  }

  /**
   * Get individual service instances for advanced usage
   */
  getServices() {
    return {
      ipfs: this.ipfsClient,
      encryption: this.encryptionService,
      pinning: this.pinningService,
      cache: this.cacheService,
      retrieval: this.retrievalService,
      gc: this.gcService
    }
  }
}

// Default export
export default SigilStorageManager

// Factory function for easy initialization
export async function createSigilStorage(
  config: StorageConfig,
  gcConfig?: GCConfig
): Promise<SigilStorageManager> {
  const storage = new SigilStorageManager(config, gcConfig)
  await storage.initialize()
  return storage
} 