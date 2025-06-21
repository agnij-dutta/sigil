/**
 * Content Retrieval Service for Sigil IPFS Storage
 * Handles efficient retrieval with fallbacks and caching
 */

import { CID } from 'multiformats/cid'
import {
  RetrievalOptions,
  StorageError,
  StorageErrorCode,
  IPFSGatewayConfig,
  ZKProofContent,
  VerifiableCredentialContent,
  AggregatedDataContent
} from './types'
import { IPFSClient } from './ipfs/client'
import { CacheService } from './cache'
import { EncryptionService } from './encryption'

export interface RetrievalResult<T = any> {
  content: T
  source: 'cache' | 'local-node' | 'gateway' | 'pinning-service'
  retrievalTime: number
  size: number
  fromEncrypted: boolean
}

export class RetrievalService {
  private ipfsClient: IPFSClient
  private cacheService: CacheService
  private encryptionService: EncryptionService
  private gatewayConfig: IPFSGatewayConfig
  private fallbackEnabled: boolean

  constructor(
    ipfsClient: IPFSClient,
    cacheService: CacheService,
    encryptionService: EncryptionService,
    gatewayConfig: IPFSGatewayConfig
  ) {
    this.ipfsClient = ipfsClient
    this.cacheService = cacheService
    this.encryptionService = encryptionService
    this.gatewayConfig = gatewayConfig
    this.fallbackEnabled = gatewayConfig.fallbackEnabled
  }

  /**
   * Retrieve ZK proof with circuit validation
   */
  async retrieveProof(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<ZKProofContent>> {
    const startTime = Date.now()
    
    try {
      console.log(`Retrieving ZK proof: ${cid.toString()}`)
      
      // Try multiple retrieval strategies
      const result = await this.retrieveWithFallback<ZKProofContent>(cid, options)
      
      // Validate proof structure
      this.validateProofContent(result.content)
      
      // Cache if retrieved from external source
      if (result.source !== 'cache') {
        await this.cacheService.cacheProof(
          cid.toString(),
          result.content,
          result.content.circuit.type,
          result.content.metadata.proverAddress
        )
      }
      
      const retrievalTime = Date.now() - startTime
      console.log(`Retrieved ZK proof in ${retrievalTime}ms from ${result.source}`)
      
      return {
        ...result,
        retrievalTime
      }
      
    } catch (error) {
      throw new StorageError(
        'Failed to retrieve ZK proof',
        StorageErrorCode.CONTENT_NOT_FOUND,
        { cid: cid.toString(), error }
      )
    }
  }

  /**
   * Retrieve verifiable credential with validation
   */
  async retrieveCredential(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<VerifiableCredentialContent>> {
    const startTime = Date.now()
    
    try {
      console.log(`Retrieving credential: ${cid.toString()}`)
      
      const result = await this.retrieveWithFallback<VerifiableCredentialContent>(cid, options)
      
      // Validate credential structure
      this.validateCredentialContent(result.content)
      
      // Check expiration
      if (result.content.expirationDate) {
        const expirationTime = new Date(result.content.expirationDate).getTime()
        if (Date.now() > expirationTime) {
          throw new StorageError(
            'Credential has expired',
            StorageErrorCode.VERIFICATION_FAILED,
            { cid: cid.toString(), expirationDate: result.content.expirationDate }
          )
        }
      }
      
      // Cache if retrieved from external source
      if (result.source !== 'cache') {
        const expiresAt = result.content.expirationDate ? 
          new Date(result.content.expirationDate).getTime() : 
          Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year default
          
        await this.cacheService.cacheCredential(
          cid.toString(),
          result.content,
          result.content.credentialSubject.type,
          result.content.credentialSubject.id,
          expiresAt
        )
      }
      
      const retrievalTime = Date.now() - startTime
      console.log(`Retrieved credential in ${retrievalTime}ms from ${result.source}`)
      
      return {
        ...result,
        retrievalTime
      }
      
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(
        'Failed to retrieve credential',
        StorageErrorCode.CONTENT_NOT_FOUND,
        { cid: cid.toString(), error }
      )
    }
  }

  /**
   * Retrieve aggregated data with privacy validation
   */
  async retrieveAggregatedData(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<AggregatedDataContent>> {
    const startTime = Date.now()
    
    try {
      console.log(`Retrieving aggregated data: ${cid.toString()}`)
      
      const result = await this.retrieveWithFallback<AggregatedDataContent>(cid, options)
      
      // Validate aggregated data structure
      this.validateAggregatedDataContent(result.content)
      
      // Cache with privacy-aware tags
      if (result.source !== 'cache') {
        await this.cacheService.cacheAggregatedData(
          cid.toString(),
          result.content,
          result.content.metadata.privacyLevel,
          'system' // System-level caching for aggregated data
        )
      }
      
      const retrievalTime = Date.now() - startTime
      console.log(`Retrieved aggregated data in ${retrievalTime}ms from ${result.source}`)
      
      return {
        ...result,
        retrievalTime
      }
      
    } catch (error) {
      throw new StorageError(
        'Failed to retrieve aggregated data',
        StorageErrorCode.CONTENT_NOT_FOUND,
        { cid: cid.toString(), error }
      )
    }
  }

  /**
   * Retrieve raw bytes (for circuit files, etc.)
   */
  async retrieveBytes(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<Uint8Array>> {
    const startTime = Date.now()
    
    try {
      console.log(`Retrieving bytes: ${cid.toString()}`)
      
      // Check cache first
      const cachedBytes = await this.cacheService.get<Uint8Array>(cid.toString())
      if (cachedBytes) {
        return {
          content: cachedBytes,
          source: 'cache',
          retrievalTime: Date.now() - startTime,
          size: cachedBytes.length,
          fromEncrypted: false
        }
      }

      // Retrieve from IPFS
      const bytes = await this.ipfsClient.retrieveBytes(cid)
      
      // Cache the result
      await this.cacheService.set(cid.toString(), bytes, ['bytes', 'raw'])
      
      const retrievalTime = Date.now() - startTime
      console.log(`Retrieved bytes in ${retrievalTime}ms from local node`)
      
      return {
        content: bytes,
        source: 'local-node',
        retrievalTime,
        size: bytes.length,
        fromEncrypted: false
      }
      
    } catch (error) {
      if (this.fallbackEnabled) {
        return await this.retrieveBytesFromGateway(cid, startTime)
      }
      
      throw new StorageError(
        'Failed to retrieve bytes',
        StorageErrorCode.CONTENT_NOT_FOUND,
        { cid: cid.toString(), error }
      )
    }
  }

  /**
   * Batch retrieve multiple items
   */
  async retrieveBatch<T = any>(
    cids: (CID | string)[],
    options: RetrievalOptions = {}
  ): Promise<Array<RetrievalResult<T> | StorageError>> {
    console.log(`Batch retrieving ${cids.length} items`)
    
    const retrievalPromises = cids.map(async (cid) => {
      try {
        return await this.retrieveWithFallback<T>(cid, options)
      } catch (error) {
        return error instanceof StorageError ? error : new StorageError(
          'Batch retrieval failed',
          StorageErrorCode.CONTENT_NOT_FOUND,
          { cid: cid.toString(), error }
        )
      }
    })

    return await Promise.all(retrievalPromises)
  }

  /**
   * Retrieve with proof verification
   */
  async retrieveWithProofVerification(
    cid: CID | string,
    expectedHash: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<any>> {
    const result = await this.retrieveWithFallback(cid, options)
    
    // Verify content hash
    const contentHash = await this.calculateContentHash(result.content)
    if (contentHash !== expectedHash) {
      throw new StorageError(
        'Content verification failed',
        StorageErrorCode.VERIFICATION_FAILED,
        { 
          cid: cid.toString(), 
          expectedHash, 
          actualHash: contentHash 
        }
      )
    }
    
    return result
  }

  // Private helper methods

  private async retrieveWithFallback<T>(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<T>> {
    const cidStr = typeof cid === 'string' ? cid : cid.toString()
    
    // 1. Try cache first
    if (options.fallbackToCache !== false) {
      const cached = await this.cacheService.get<T>(cidStr)
      if (cached) {
        return {
          content: cached,
          source: 'cache',
          retrievalTime: 0,
          size: JSON.stringify(cached).length,
          fromEncrypted: false
        }
      }
    }

    // 2. Try local IPFS node
    try {
      const content = await this.ipfsClient.retrieve<T>(cid, {
        ...options,
        fallbackToCache: false // We already checked cache
      })
      
      return {
        content,
        source: 'local-node',
        retrievalTime: 0, // Will be set by caller
        size: JSON.stringify(content).length,
        fromEncrypted: this.isEncryptedContent(content)
      }
    } catch (error) {
      console.warn(`Local node retrieval failed for ${cidStr}:`, error)
    }

    // 3. Try public gateways if fallback enabled
    if (this.fallbackEnabled) {
      return await this.retrieveFromGateway<T>(cid, options)
    }

    throw new StorageError(
      'All retrieval methods failed',
      StorageErrorCode.CONTENT_NOT_FOUND,
      { cid: cidStr }
    )
  }

  private async retrieveFromGateway<T>(
    cid: CID | string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult<T>> {
    const cidStr = typeof cid === 'string' ? cid : cid.toString()
    const errors: Error[] = []

    for (const gateway of this.gatewayConfig.publicGateways) {
      try {
        console.log(`Trying gateway: ${gateway}`)
        
        const url = `${gateway}/ipfs/${cidStr}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.gatewayConfig.timeout)

        const response = await fetch(url, {
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const content = await response.json() as T
        
        // Cache the retrieved content
        await this.cacheService.set(cidStr, content, ['gateway'])
        
        return {
          content,
          source: 'gateway',
          retrievalTime: 0, // Will be set by caller
          size: JSON.stringify(content).length,
          fromEncrypted: this.isEncryptedContent(content)
        }

      } catch (error) {
        console.warn(`Gateway ${gateway} failed:`, error)
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    throw new StorageError(
      'All gateways failed',
      StorageErrorCode.CONTENT_NOT_FOUND,
      { cid: cidStr, errors: errors.map(e => e.message) }
    )
  }

  private async retrieveBytesFromGateway(
    cid: CID | string,
    startTime: number
  ): Promise<RetrievalResult<Uint8Array>> {
    const cidStr = typeof cid === 'string' ? cid : cid.toString()
    const errors: Error[] = []

    for (const gateway of this.gatewayConfig.publicGateways) {
      try {
        const url = `${gateway}/ipfs/${cidStr}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        
        // Cache the result
        await this.cacheService.set(cidStr, bytes, ['bytes', 'gateway'])
        
        return {
          content: bytes,
          source: 'gateway',
          retrievalTime: Date.now() - startTime,
          size: bytes.length,
          fromEncrypted: false
        }

      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    throw new StorageError(
      'Gateway bytes retrieval failed',
      StorageErrorCode.CONTENT_NOT_FOUND,
      { cid: cidStr, errors: errors.map(e => e.message) }
    )
  }

  private validateProofContent(content: ZKProofContent): void {
    if (!content.contentType || content.contentType !== 'zk-proof') {
      throw new StorageError(
        'Invalid proof content type',
        StorageErrorCode.VERIFICATION_FAILED
      )
    }

    if (!content.circuit || !content.proof || !content.publicSignals) {
      throw new StorageError(
        'Incomplete proof structure',
        StorageErrorCode.VERIFICATION_FAILED
      )
    }
  }

  private validateCredentialContent(content: VerifiableCredentialContent): void {
    if (!content.contentType || content.contentType !== 'verifiable-credential') {
      throw new StorageError(
        'Invalid credential content type',
        StorageErrorCode.VERIFICATION_FAILED
      )
    }

    if (!content['@context'] || !content.type || !content.credentialSubject) {
      throw new StorageError(
        'Incomplete credential structure',
        StorageErrorCode.VERIFICATION_FAILED
      )
    }
  }

  private validateAggregatedDataContent(content: AggregatedDataContent): void {
    if (!content.type || content.type !== 'aggregated-data') {
      throw new StorageError(
        'Invalid aggregated data content type',
        StorageErrorCode.VERIFICATION_FAILED
      )
    }

    if (!content.metadata || !content.repositories) {
      throw new StorageError(
        'Incomplete aggregated data structure',
        StorageErrorCode.VERIFICATION_FAILED
      )
    }
  }

  private isEncryptedContent(content: any): boolean {
    return content && typeof content === 'object' && 'data' in content && 'metadata' in content
  }

  private async calculateContentHash(content: any): Promise<string> {
    const contentString = JSON.stringify(content)
    const encoder = new TextEncoder()
    const data = encoder.encode(contentString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Preload content for performance optimization
   */
  async preload(cids: (CID | string)[]): Promise<void> {
    console.log(`Preloading ${cids.length} items`)
    
    const preloadPromises = cids.map(async (cid) => {
      try {
        await this.retrieveWithFallback(cid, { fallbackToCache: false })
      } catch (error) {
        console.warn(`Preload failed for ${cid.toString()}:`, error)
      }
    })

    await Promise.allSettled(preloadPromises)
  }

  /**
   * Get retrieval statistics
   */
  getStats(): {
    totalRetrievals: number
    cacheHits: number
    gatewayUses: number
    averageRetrievalTime: number
  } {
    // This would be tracked in a real implementation
    return {
      totalRetrievals: 0,
      cacheHits: 0,
      gatewayUses: 0,
      averageRetrievalTime: 0
    }
  }
} 