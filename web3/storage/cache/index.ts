/**
 * Main Cache Service for Sigil IPFS Storage
 * Wrapper around local cache with additional functionality
 */

import { LocalCacheService } from './local_cache'
import {
  CacheConfig,
  CacheEntry,
  StorageError,
  StorageErrorCode
} from '../types'

export class CacheService {
  private localCache: LocalCacheService
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = config
    this.localCache = new LocalCacheService(config)
  }

  /**
   * Cache content with automatic compression
   */
  async set<T>(
    key: string,
    value: T,
    tags: string[] = []
  ): Promise<void> {
    try {
      // Add automatic tags based on content
      const enhancedTags = this.enhanceTags(value, tags)
      
      await this.localCache.set(key, value, enhancedTags)
      
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(
        'Cache set operation failed',
        StorageErrorCode.QUOTA_EXCEEDED,
        { key, error }
      )
    }
  }

  /**
   * Retrieve content from cache
   */
  async get<T>(key: string): Promise<T | null> {
    return await this.localCache.get<T>(key)
  }

  /**
   * Remove content from cache
   */
  async delete(key: string): Promise<boolean> {
    return await this.localCache.delete(key)
  }

  /**
   * Check if content exists in cache
   */
  async has(key: string): Promise<boolean> {
    return await this.localCache.has(key)
  }

  /**
   * Get cached proofs by circuit type
   */
  async getProofsByCircuit(circuitType: string): Promise<CacheEntry[]> {
    return await this.localCache.getByTags(['proof', circuitType])
  }

  /**
   * Get cached credentials by type
   */
  async getCredentialsByType(credentialType: string): Promise<CacheEntry[]> {
    return await this.localCache.getByTags(['credential', credentialType])
  }

  /**
   * Cache ZK proof with circuit-specific tags
   */
  async cacheProof(
    cid: string,
    proof: any,
    circuitType: string,
    userAddress: string
  ): Promise<void> {
    const tags = [
      'proof',
      `circuit:${circuitType}`,
      `user:${userAddress}`,
      'zk-proof'
    ]
    
    await this.set(cid, proof, tags)
  }

  /**
   * Cache credential with metadata tags
   */
  async cacheCredential(
    cid: string,
    credential: any,
    credentialType: string,
    userAddress: string,
    expiresAt: number
  ): Promise<void> {
    const tags = [
      'credential',
      `type:${credentialType}`,
      `user:${userAddress}`,
      `expires:${expiresAt}`
    ]
    
    await this.set(cid, credential, tags)
  }

  /**
   * Cache aggregated data with privacy tags
   */
  async cacheAggregatedData(
    cid: string,
    data: any,
    privacyLevel: string,
    userAddress: string
  ): Promise<void> {
    const tags = [
      'aggregated',
      `privacy:${privacyLevel}`,
      `user:${userAddress}`,
      'private'
    ]
    
    await this.set(cid, data, tags)
  }

  /**
   * Clear expired credentials
   */
  async clearExpiredCredentials(): Promise<number> {
    const now = Date.now()
    let removedCount = 0

    const credentialEntries = await this.localCache.getByTags(['credential'])
    
    for (const entry of credentialEntries) {
      const expiresTag = entry.tags?.find(tag => tag.startsWith('expires:'))
      if (expiresTag) {
        const expiresAt = parseInt(expiresTag.split(':')[1])
        if (now > expiresAt) {
          await this.delete(entry.key)
          removedCount++
        }
      }
    }

    console.log(`Cleared ${removedCount} expired credentials`)
    return removedCount
  }

  /**
   * Clear cache for specific user
   */
  async clearUserCache(userAddress: string): Promise<number> {
    return await this.localCache.clearByTags([`user:${userAddress}`])
  }

  /**
   * Clear cache by circuit type
   */
  async clearCircuitCache(circuitType: string): Promise<number> {
    return await this.localCache.clearByTags([`circuit:${circuitType}`])
  }

  /**
   * Get cache statistics with Sigil-specific metrics
   */
  getStats(): {
    basic: ReturnType<LocalCacheService['getStats']>
    sigil: {
      proofCount: number
      credentialCount: number
      aggregatedCount: number
      privateCount: number
      userCount: number
    }
  } {
    const basicStats = this.localCache.getStats()
    
    // Count Sigil-specific content types
    let proofCount = 0
    let credentialCount = 0
    let aggregatedCount = 0
    let privateCount = 0
    const users = new Set<string>()

    // This is a simplified count - in production, you'd want to implement
    // a more efficient tag-based counting system
    for (const [, entry] of (this.localCache as any).cache.entries()) {
      if (entry.tags) {
        if (entry.tags.includes('proof')) proofCount++
        if (entry.tags.includes('credential')) credentialCount++
        if (entry.tags.includes('aggregated')) aggregatedCount++
        if (entry.tags.includes('private')) privateCount++
        
        const userTag = entry.tags.find((tag: string) => tag.startsWith('user:'))
        if (userTag) {
          users.add(userTag.split(':')[1])
        }
      }
    }

    return {
      basic: basicStats,
      sigil: {
        proofCount,
        credentialCount,
        aggregatedCount,
        privateCount,
        userCount: users.size
      }
    }
  }

  /**
   * Start cache cleanup with Sigil-specific cleanup
   */
  startCleanup(): void {
    this.localCache.startCleanup()
    
    // Additional Sigil-specific cleanup
    setInterval(async () => {
      await this.clearExpiredCredentials()
    }, 3600000) // Every hour
  }

  /**
   * Stop cache cleanup
   */
  stopCleanup(): void {
    this.localCache.stopCleanup()
  }

  /**
   * Warm up cache with frequently accessed content
   */
  async warmup(userAddress: string): Promise<void> {
    // This would typically pre-load user's recent credentials, proofs, etc.
    console.log(`Warming up cache for user: ${userAddress}`)
    
    // Implementation would depend on having access to recent CIDs
    // This is a placeholder for the warmup logic
  }

  /**
   * Optimize cache by promoting frequently accessed items
   */
  async optimize(): Promise<void> {
    // Get cache statistics and optimize based on access patterns
    const stats = this.getStats()
    
    console.log('Optimizing cache based on access patterns')
    console.log(`Current cache: ${stats.basic.itemCount} items, ${stats.basic.size} bytes`)
    
    // Implementation would analyze access patterns and pre-cache
    // related content, e.g., if a credential is accessed, pre-cache its proof
  }

  // Private helper methods

  private enhanceTags<T>(value: T, baseTags: string[]): string[] {
    const enhanced = [...baseTags]
    
    // Add content-type specific tags
    if (typeof value === 'object' && value !== null) {
      const obj = value as any
      
      if (obj.contentType) {
        enhanced.push(`content:${obj.contentType}`)
      }
      
      if (obj.version) {
        enhanced.push(`version:${obj.version}`)
      }
      
      if (obj.circuitType) {
        enhanced.push(`circuit:${obj.circuitType}`)
      }
      
      if (obj.credentialType || obj.type) {
        enhanced.push(`type:${obj.credentialType || obj.type}`)
      }
    }
    
    // Add timestamp-based tags for time-based queries
    const now = new Date()
    enhanced.push(`hour:${now.getHours()}`)
    enhanced.push(`day:${now.getDate()}`)
    enhanced.push(`month:${now.getMonth()}`)
    
    return enhanced
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.localCache.clear()
  }

  /**
   * Manual cleanup
   */
  async cleanup(): Promise<number> {
    return await this.localCache.cleanup()
  }
}

// Export the cache service
export { CacheService as default, LocalCacheService } 