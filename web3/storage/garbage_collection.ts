/**
 * Garbage Collection Service for Sigil IPFS Storage
 * Manages storage cleanup and optimization
 */

import { CID } from 'multiformats/cid'
import {
  StorageError,
  StorageErrorCode,
  StorageMetrics
} from './types'
import { IPFSClient } from './ipfs/client'
import { CacheService } from './cache'
import { PinningService } from './pinning'

export interface GCConfig {
  maxStorageSize: number // bytes
  maxAge: number // milliseconds
  orphanCleanupAge: number // milliseconds
  retentionPolicies: RetentionPolicy[]
  scheduledCleanup: boolean
  cleanupInterval: number // milliseconds
}

export interface RetentionPolicy {
  contentType: string
  maxAge: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  conditions: RetentionCondition[]
}

export interface RetentionCondition {
  type: 'usage' | 'expiration' | 'verification' | 'dependency'
  threshold: number
  action: 'keep' | 'archive' | 'delete'
}

export interface GCResult {
  freedSpace: number
  deletedItems: number
  archivedItems: number
  errors: string[]
  duration: number
}

export interface StorageItem {
  cid: CID
  contentType: string
  size: number
  createdAt: number
  lastAccessed: number
  accessCount: number
  pinned: boolean
  referenced: boolean
  priority: string
}

export class GarbageCollectionService {
  private ipfsClient: IPFSClient
  private cacheService: CacheService
  private pinningService: PinningService
  private config: GCConfig
  private cleanupInterval: NodeJS.Timeout | null = null
  private storageIndex = new Map<string, StorageItem>()
  private isRunning = false

  constructor(
    ipfsClient: IPFSClient,
    cacheService: CacheService,
    pinningService: PinningService,
    config: GCConfig
  ) {
    this.ipfsClient = ipfsClient
    this.cacheService = cacheService
    this.pinningService = pinningService
    this.config = config

    if (config.scheduledCleanup) {
      this.startScheduledCleanup()
    }
  }

  /**
   * Run garbage collection
   */
  async runGC(): Promise<GCResult> {
    if (this.isRunning) {
      throw new StorageError(
        'Garbage collection already running',
        StorageErrorCode.CONNECTION_FAILED
      )
    }

    const startTime = Date.now()
    this.isRunning = true
    let freedSpace = 0
    let deletedItems = 0
    let archivedItems = 0
    const errors: string[] = []

    try {
      console.log('Starting garbage collection...')

      // 1. Update storage index
      await this.updateStorageIndex()

      // 2. Identify items for cleanup
      const itemsToDelete = await this.identifyItemsForDeletion()
      const itemsToArchive = await this.identifyItemsForArchiving()

      console.log(`Found ${itemsToDelete.length} items to delete, ${itemsToArchive.length} items to archive`)

      // 3. Archive items first
      for (const item of itemsToArchive) {
        try {
          await this.archiveItem(item)
          archivedItems++
          freedSpace += item.size
        } catch (error) {
          errors.push(`Archive failed for ${item.cid.toString()}: ${error}`)
        }
      }

      // 4. Delete items
      for (const item of itemsToDelete) {
        try {
          await this.deleteItem(item)
          deletedItems++
          freedSpace += item.size
        } catch (error) {
          errors.push(`Delete failed for ${item.cid.toString()}: ${error}`)
        }
      }

      // 5. Clean up orphaned blocks
      const orphanedSpace = await this.cleanupOrphanedBlocks()
      freedSpace += orphanedSpace

      // 6. Optimize storage
      await this.optimizeStorage()

      // 7. Update cache
      await this.cleanupCache()

      const duration = Date.now() - startTime
      console.log(`Garbage collection completed in ${duration}ms`)
      console.log(`Freed ${freedSpace} bytes, deleted ${deletedItems} items, archived ${archivedItems} items`)

      return {
        freedSpace,
        deletedItems,
        archivedItems,
        errors,
        duration
      }

    } catch (error) {
      errors.push(`GC failed: ${error}`)
      throw new StorageError(
        'Garbage collection failed',
        StorageErrorCode.CONNECTION_FAILED,
        { errors }
      )
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Check if garbage collection is needed
   */
  async needsGC(): Promise<boolean> {
    const metrics = await this.getStorageMetrics()
    
    // Check storage size threshold
    if (metrics.totalStoredBytes > this.config.maxStorageSize * 0.8) {
      return true
    }

    // Check for expired content
    const expiredItems = await this.identifyExpiredItems()
    if (expiredItems.length > 0) {
      return true
    }

    // Check for orphaned blocks
    const orphanedSize = await this.estimateOrphanedSize()
    if (orphanedSize > this.config.maxStorageSize * 0.1) {
      return true
    }

    return false
  }

  /**
   * Force cleanup of specific content type
   */
  async cleanupContentType(
    contentType: string,
    olderThan?: number
  ): Promise<GCResult> {
    const startTime = Date.now()
    let freedSpace = 0
    let deletedItems = 0
    const errors: string[] = []

    try {
      await this.updateStorageIndex()

      const itemsToDelete = Array.from(this.storageIndex.values()).filter(item => {
        if (item.contentType !== contentType) return false
        if (olderThan && Date.now() - item.createdAt < olderThan) return false
        return true
      })

      for (const item of itemsToDelete) {
        try {
          await this.deleteItem(item)
          deletedItems++
          freedSpace += item.size
        } catch (error) {
          errors.push(`Delete failed for ${item.cid.toString()}: ${error}`)
        }
      }

      return {
        freedSpace,
        deletedItems,
        archivedItems: 0,
        errors,
        duration: Date.now() - startTime
      }

    } catch (error) {
      throw new StorageError(
        'Content type cleanup failed',
        StorageErrorCode.CONNECTION_FAILED,
        { contentType, error }
      )
    }
  }

  /**
   * Archive old but valuable content
   */
  async archiveOldContent(olderThan: number): Promise<GCResult> {
    const startTime = Date.now()
    let freedSpace = 0
    let archivedItems = 0
    const errors: string[] = []

    try {
      await this.updateStorageIndex()

      const itemsToArchive = Array.from(this.storageIndex.values()).filter(item => {
        return (
          Date.now() - item.createdAt > olderThan &&
          item.priority !== 'low' &&
          item.accessCount > 0
        )
      })

      for (const item of itemsToArchive) {
        try {
          await this.archiveItem(item)
          archivedItems++
          freedSpace += item.size
        } catch (error) {
          errors.push(`Archive failed for ${item.cid.toString()}: ${error}`)
        }
      }

      return {
        freedSpace,
        deletedItems: 0,
        archivedItems,
        errors,
        duration: Date.now() - startTime
      }

    } catch (error) {
      throw new StorageError(
        'Archive operation failed',
        StorageErrorCode.CONNECTION_FAILED,
        { error }
      )
    }
  }

  /**
   * Start scheduled cleanup
   */
  startScheduledCleanup(): void {
    if (this.cleanupInterval) {
      return
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const needsCleanup = await this.needsGC()
        if (needsCleanup) {
          console.log('Running scheduled garbage collection...')
          await this.runGC()
        }
      } catch (error) {
        console.error('Scheduled GC failed:', error)
      }
    }, this.config.cleanupInterval)

    console.log('Scheduled garbage collection started')
  }

  /**
   * Stop scheduled cleanup
   */
  stopScheduledCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('Scheduled garbage collection stopped')
    }
  }

  // Private helper methods

  private async updateStorageIndex(): Promise<void> {
    // This would typically scan the IPFS repo and update the index
    // For now, we'll simulate with cache information
    console.log('Updating storage index...')
    
    const cacheStats = this.cacheService.getStats()
    // Update index based on cached items
    // In a real implementation, this would scan the IPFS blockstore
  }

  private async identifyItemsForDeletion(): Promise<StorageItem[]> {
    const now = Date.now()
    const itemsToDelete: StorageItem[] = []

    for (const item of this.storageIndex.values()) {
      // Skip pinned items
      if (item.pinned) continue

      // Apply retention policies
      const policy = this.getRetentionPolicy(item.contentType)
      if (!policy) continue

      // Check age
      if (now - item.createdAt > policy.maxAge) {
        // Check conditions
        const shouldDelete = policy.conditions.some(condition => {
          switch (condition.type) {
            case 'usage':
              return item.accessCount < condition.threshold && condition.action === 'delete'
            case 'expiration':
              return now - item.lastAccessed > condition.threshold && condition.action === 'delete'
            default:
              return false
          }
        })

        if (shouldDelete) {
          itemsToDelete.push(item)
        }
      }
    }

    return itemsToDelete
  }

  private async identifyItemsForArchiving(): Promise<StorageItem[]> {
    const now = Date.now()
    const itemsToArchive: StorageItem[] = []

    for (const item of this.storageIndex.values()) {
      if (item.pinned) continue

      const policy = this.getRetentionPolicy(item.contentType)
      if (!policy) continue

      // Check if item should be archived
      const shouldArchive = policy.conditions.some(condition => {
        switch (condition.type) {
          case 'usage':
            return item.accessCount >= condition.threshold && condition.action === 'archive'
          case 'expiration':
            return now - item.lastAccessed > condition.threshold && condition.action === 'archive'
          default:
            return false
        }
      })

      if (shouldArchive) {
        itemsToArchive.push(item)
      }
    }

    return itemsToArchive
  }

  private async identifyExpiredItems(): Promise<StorageItem[]> {
    const now = Date.now()
    return Array.from(this.storageIndex.values()).filter(item => 
      now - item.createdAt > this.config.maxAge
    )
  }

  private getRetentionPolicy(contentType: string): RetentionPolicy | undefined {
    return this.config.retentionPolicies.find(policy => 
      policy.contentType === contentType || policy.contentType === '*'
    )
  }

  private async deleteItem(item: StorageItem): Promise<void> {
    console.log(`Deleting item: ${item.cid.toString()}`)
    
    // Remove from cache
    await this.cacheService.delete(item.cid.toString())
    
    // Unpin if pinned
    if (item.pinned) {
      await this.pinningService.unpin(item.cid)
    }

    // Remove from storage index
    this.storageIndex.delete(item.cid.toString())

    // Note: Actual block deletion would happen here in IPFS
    // For now, we just remove from our tracking
  }

  private async archiveItem(item: StorageItem): Promise<void> {
    console.log(`Archiving item: ${item.cid.toString()}`)
    
    // In a real implementation, this would:
    // 1. Export the item to cold storage
    // 2. Remove from hot storage
    // 3. Keep metadata for retrieval

    // For now, just remove from hot cache
    await this.cacheService.delete(item.cid.toString())
    
    // Update index to mark as archived
    item.priority = 'archived'
  }

  private async cleanupOrphanedBlocks(): Promise<number> {
    console.log('Cleaning up orphaned blocks...')
    
    // This would identify and remove blocks not referenced by any pinned content
    // Return the amount of space freed
    return 0
  }

  private async estimateOrphanedSize(): Promise<number> {
    // Estimate the size of orphaned blocks
    // This would require scanning the blockstore
    return 0
  }

  private async optimizeStorage(): Promise<void> {
    console.log('Optimizing storage...')
    
    // This could include:
    // 1. Defragmenting storage
    // 2. Optimizing block layout
    // 3. Rebuilding indices
  }

  private async cleanupCache(): Promise<void> {
    // Clean up expired cache entries
    await this.cacheService.cleanup()
    
    // Clear expired credentials
    await this.cacheService.clearExpiredCredentials()
  }

  private async getStorageMetrics(): Promise<StorageMetrics> {
    const cacheStats = this.cacheService.getStats()
    
    return {
      totalStoredBytes: cacheStats.basic.size,
      totalContentItems: cacheStats.basic.itemCount,
      cacheHitRate: cacheStats.basic.hitRate,
      averageRetrievalTime: 0, // Would be tracked separately
      redundancyHealth: await this.pinningService.getRedundancyHealth(),
      errorRate: 0, // Would be tracked separately
      costMetrics: {
        storageCost: 0,
        bandwidthCost: 0,
        pinningCost: 0
      }
    }
  }

  /**
   * Get GC statistics
   */
  getStats(): {
    totalItems: number
    scheduledCleanup: boolean
    lastGC: number | null
    nextGC: number | null
    isRunning: boolean
  } {
    return {
      totalItems: this.storageIndex.size,
      scheduledCleanup: !!this.cleanupInterval,
      lastGC: null, // Would track in real implementation
      nextGC: this.cleanupInterval ? Date.now() + this.config.cleanupInterval : null,
      isRunning: this.isRunning
    }
  }

  /**
   * Update retention policies
   */
  updateRetentionPolicies(policies: RetentionPolicy[]): void {
    this.config.retentionPolicies = policies
    console.log(`Updated retention policies: ${policies.length} policies`)
  }

  /**
   * Emergency cleanup - free space quickly
   */
  async emergencyCleanup(targetSize: number): Promise<GCResult> {
    console.log(`Emergency cleanup: need to free ${targetSize} bytes`)
    
    const startTime = Date.now()
    let freedSpace = 0
    let deletedItems = 0
    const errors: string[] = []

    try {
      await this.updateStorageIndex()

      // Sort items by priority and age for emergency deletion
      const itemsToDelete = Array.from(this.storageIndex.values())
        .filter(item => !item.pinned && item.priority === 'low')
        .sort((a, b) => a.lastAccessed - b.lastAccessed)

      for (const item of itemsToDelete) {
        if (freedSpace >= targetSize) break

        try {
          await this.deleteItem(item)
          deletedItems++
          freedSpace += item.size
        } catch (error) {
          errors.push(`Emergency delete failed for ${item.cid.toString()}: ${error}`)
        }
      }

      return {
        freedSpace,
        deletedItems,
        archivedItems: 0,
        errors,
        duration: Date.now() - startTime
      }

    } catch (error) {
      throw new StorageError(
        'Emergency cleanup failed',
        StorageErrorCode.CONNECTION_FAILED,
        { targetSize, error }
      )
    }
  }
} 