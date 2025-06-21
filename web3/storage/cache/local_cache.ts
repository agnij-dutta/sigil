/**
 * Local Cache Service for Sigil IPFS Storage
 * Implements LRU/LFU/FIFO caching strategies
 */

import {
  CacheConfig,
  CacheEntry,
  StorageError,
  StorageErrorCode
} from '../types'

export class LocalCacheService {
  private cache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private cleanupInterval: NodeJS.Timeout | null = null
  private currentSize = 0

  constructor(config: CacheConfig) {
    this.config = config
  }

  /**
   * Store item in cache
   */
  async set<T>(
    key: string,
    value: T,
    tags: string[] = []
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      const size = new Blob([serializedValue]).size
      
      // Check if item would exceed max size
      if (size > this.config.maxSize) {
        throw new StorageError(
          'Item too large for cache',
          StorageErrorCode.QUOTA_EXCEEDED,
          { size, maxSize: this.config.maxSize }
        )
      }

      // Evict items if necessary
      await this.evictIfNecessary(size)

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        accessCount: 1,
        size,
        tags
      }

      this.cache.set(key, entry)
      this.currentSize += size

      console.log(`Cached item: ${key} (${size} bytes, ${tags.join(', ')})`)

    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(
        'Failed to cache item',
        StorageErrorCode.QUOTA_EXCEEDED,
        { key, error }
      )
    }
  }

  /**
   * Retrieve item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      this.currentSize -= entry.size
      return null
    }

    // Update access stats for cache strategy
    entry.accessCount++
    entry.timestamp = Date.now() // Update for LRU

    return entry.value as T
  }

  /**
   * Remove item from cache
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    this.cache.delete(key)
    this.currentSize -= entry.size
    
    console.log(`Removed from cache: ${key}`)
    return true
  }

  /**
   * Check if item exists in cache
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      this.currentSize -= entry.size
      return false
    }

    return true
  }

  /**
   * Get items by tags
   */
  async getByTags(tags: string[]): Promise<CacheEntry[]> {
    const results: CacheEntry[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      // Check TTL
      if (Date.now() - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
        this.currentSize -= entry.size
        continue
      }

      // Check if entry has any of the requested tags
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        results.push(entry)
      }
    }

    return results
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<number> {
    let removedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
        this.currentSize -= entry.size
        removedCount++
      }
    }

    console.log(`Cleared ${removedCount} items with tags: ${tags.join(', ')}`)
    return removedCount
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const itemCount = this.cache.size
    this.cache.clear()
    this.currentSize = 0
    
    console.log(`Cleared all cache (${itemCount} items)`)
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    itemCount: number
    hitRate: number
    oldestItem: number
    newestItem: number
  } {
    let totalAccess = 0
    let totalHits = 0
    let oldestTimestamp = Date.now()
    let newestTimestamp = 0

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount
      if (entry.accessCount > 1) {
        totalHits += entry.accessCount - 1
      }
      
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
      }
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp
      }
    }

    return {
      size: this.currentSize,
      maxSize: this.config.maxSize,
      itemCount: this.cache.size,
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    }
  }

  /**
   * Start automatic cleanup
   */
  startCleanup(): void {
    if (this.cleanupInterval) {
      return
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)

    console.log('Cache cleanup started')
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('Cache cleanup stopped')
    }
  }

  /**
   * Manual cleanup of expired items
   */
  async cleanup(): Promise<number> {
    let removedCount = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
        this.currentSize -= entry.size
        removedCount++
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired cache items`)
    }

    return removedCount
  }

  // Private helper methods

  private async evictIfNecessary(newItemSize: number): Promise<void> {
    const availableSpace = this.config.maxSize - this.currentSize
    
    if (newItemSize <= availableSpace) {
      return
    }

    const spaceNeeded = newItemSize - availableSpace
    let spaceFreed = 0
    
    console.log(`Need to free ${spaceNeeded} bytes using ${this.config.strategy} strategy`)

    const sortedEntries = this.getSortedEntriesForEviction()

    for (const [key, entry] of sortedEntries) {
      if (spaceFreed >= spaceNeeded) {
        break
      }

      this.cache.delete(key)
      this.currentSize -= entry.size
      spaceFreed += entry.size
      
      console.log(`Evicted: ${key} (freed ${entry.size} bytes)`)
    }

    if (spaceFreed < spaceNeeded) {
      throw new StorageError(
        'Unable to free enough cache space',
        StorageErrorCode.QUOTA_EXCEEDED,
        { needed: spaceNeeded, freed: spaceFreed }
      )
    }
  }

  private getSortedEntriesForEviction(): [string, CacheEntry][] {
    const entries = Array.from(this.cache.entries())

    switch (this.config.strategy) {
      case 'LRU': // Least Recently Used
        return entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
      
      case 'LFU': // Least Frequently Used
        return entries.sort(([, a], [, b]) => a.accessCount - b.accessCount)
      
      case 'FIFO': // First In, First Out
        return entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
      
      default:
        return entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
    }
  }

  /**
   * Validate cache configuration
   */
  validateConfig(): boolean {
    return (
      this.config.maxSize > 0 &&
      this.config.ttl > 0 &&
      this.config.cleanupInterval > 0 &&
      ['LRU', 'LFU', 'FIFO'].includes(this.config.strategy)
    )
  }

  /**
   * Export cache for backup
   */
  async export(): Promise<{ config: CacheConfig; entries: CacheEntry[] }> {
    return {
      config: this.config,
      entries: Array.from(this.cache.values())
    }
  }

  /**
   * Import cache from backup
   */
  async import(backup: { config: CacheConfig; entries: CacheEntry[] }): Promise<void> {
    this.clear()
    this.config = backup.config

    for (const entry of backup.entries) {
      // Check if entry is still valid
      if (Date.now() - entry.timestamp <= this.config.ttl) {
        this.cache.set(entry.key, entry)
        this.currentSize += entry.size
      }
    }

    console.log(`Imported ${this.cache.size} cache entries`)
  }
} 