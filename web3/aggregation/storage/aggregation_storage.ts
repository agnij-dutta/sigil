/**
 * Aggregation Storage System
 * 
 * Provides caching, persistence, and retrieval of aggregated data with support
 * for multiple storage backends including IPFS, Arweave, and local caching.
 */

import { createHash } from 'crypto';
import { 
    AggregationCache,
    StorageConfig,
    CrossRepoAggregation,
    AggregationContext
} from '../types/index.js';

export interface StorageMetrics {
    totalSize: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    storageUtilization: number;
    averageRetrievalTime: number;
    compressionRatio: number;
}

export interface StorageOperation {
    operationId: string;
    type: 'store' | 'retrieve' | 'update' | 'delete' | 'evict';
    key: string;
    size: number;
    duration: number;
    success: boolean;
    timestamp: Date;
    backend: string;
    metadata?: any;
}

export class AggregationStorage {
    private config: StorageConfig;
    private memoryCache: Map<string, AggregationCache> = new Map();
    private accessHistory: Map<string, Date[]> = new Map();
    private operationLog: StorageOperation[] = [];
    private metrics: StorageMetrics;
    
    // Storage backends
    private ipfsClient: any = null;
    private arweaveClient: any = null;
    private redisClient: any = null;

    constructor(config: Partial<StorageConfig> = {}) {
        this.config = {
            provider: 'memory',
            ttl: 3600000, // 1 hour
            maxSize: 100 * 1024 * 1024, // 100MB
            compression: true,
            encryption: false,
            replication: 1,
            ...config
        };

        this.metrics = {
            totalSize: 0,
            itemCount: 0,
            hitRate: 0,
            missRate: 0,
            evictionCount: 0,
            storageUtilization: 0,
            averageRetrievalTime: 0,
            compressionRatio: 1.0
        };

        this.initializeStorageBackends();
    }

    /**
     * Store aggregated data with automatic backend selection
     */
    async store(
        key: string,
        data: any,
        context: AggregationContext,
        options: {
            ttl?: number;
            tags?: string[];
            priority?: 'low' | 'medium' | 'high';
            replicate?: boolean;
        } = {}
    ): Promise<string> {
        const startTime = Date.now();
        const operationId = this.generateOperationId();

        try {
            // Prepare data for storage
            const serializedData = await this.serializeData(data);
            const compressedData = this.config.compression 
                ? await this.compressData(serializedData)
                : serializedData;
            const encryptedData = this.config.encryption 
                ? await this.encryptData(compressedData, context.userAddress)
                : compressedData;

            // Create cache entry
            const cacheEntry: AggregationCache = {
                key,
                data: encryptedData,
                metadata: {
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + (options.ttl || this.config.ttl)),
                    accessCount: 0,
                    lastAccessed: new Date(),
                    size: encryptedData.length,
                    version: '1.0'
                },
                tags: options.tags || []
            };

            // Store in primary backend
            const storageKey = await this.storeInBackend(cacheEntry, this.config.provider);
            
            // Store in memory cache for quick access
            this.memoryCache.set(key, cacheEntry);
            
            // Replicate if configured
            if (options.replicate && this.config.replication > 1) {
                await this.replicateData(cacheEntry);
            }

            // Update metrics
            this.updateStorageMetrics('store', encryptedData.length, Date.now() - startTime);
            
            // Log operation
            await this.logOperation({
                operationId,
                type: 'store',
                key,
                size: encryptedData.length,
                duration: Date.now() - startTime,
                success: true,
                timestamp: new Date(),
                backend: this.config.provider,
                metadata: { tags: options.tags, ttl: options.ttl }
            });

            return storageKey;

        } catch (error) {
            await this.logOperation({
                operationId,
                type: 'store',
                key,
                size: 0,
                duration: Date.now() - startTime,
                success: false,
                timestamp: new Date(),
                backend: this.config.provider,
                metadata: { error: error.message }
            });
            throw error;
        }
    }

    /**
     * Retrieve aggregated data with cache optimization
     */
    async retrieve(
        key: string,
        context: AggregationContext
    ): Promise<any | null> {
        const startTime = Date.now();
        const operationId = this.generateOperationId();

        try {
            // Check memory cache first
            let cacheEntry = this.memoryCache.get(key);
            let fromCache = true;

            if (!cacheEntry || this.isExpired(cacheEntry)) {
                // Cache miss - retrieve from backend
                cacheEntry = await this.retrieveFromBackend(key, this.config.provider);
                fromCache = false;

                if (!cacheEntry) {
                    this.updateStorageMetrics('miss', 0, Date.now() - startTime);
                    await this.logOperation({
                        operationId,
                        type: 'retrieve',
                        key,
                        size: 0,
                        duration: Date.now() - startTime,
                        success: false,
                        timestamp: new Date(),
                        backend: this.config.provider,
                        metadata: { reason: 'not_found' }
                    });
                    return null;
                }

                // Store in memory cache for future access
                this.memoryCache.set(key, cacheEntry);
            }

            // Update access metadata
            cacheEntry.metadata.accessCount++;
            cacheEntry.metadata.lastAccessed = new Date();
            this.updateAccessHistory(key);

            // Decrypt and decompress data
            let data = cacheEntry.data;
            if (this.config.encryption) {
                data = await this.decryptData(data, context.userAddress);
            }
            if (this.config.compression) {
                data = await this.decompressData(data);
            }

            // Deserialize data
            const deserializedData = await this.deserializeData(data);

            // Update metrics
            this.updateStorageMetrics(fromCache ? 'hit' : 'miss', cacheEntry.metadata.size, Date.now() - startTime);

            // Log operation
            await this.logOperation({
                operationId,
                type: 'retrieve',
                key,
                size: cacheEntry.metadata.size,
                duration: Date.now() - startTime,
                success: true,
                timestamp: new Date(),
                backend: this.config.provider,
                metadata: { fromCache, accessCount: cacheEntry.metadata.accessCount }
            });

            return deserializedData;

        } catch (error) {
            await this.logOperation({
                operationId,
                type: 'retrieve',
                key,
                size: 0,
                duration: Date.now() - startTime,
                success: false,
                timestamp: new Date(),
                backend: this.config.provider,
                metadata: { error: error.message }
            });
            throw error;
        }
    }

    /**
     * Update existing cached data
     */
    async update(
        key: string,
        data: any,
        context: AggregationContext
    ): Promise<boolean> {
        const startTime = Date.now();
        const operationId = this.generateOperationId();

        try {
            // Check if entry exists
            const existingEntry = await this.retrieve(key, context);
            if (!existingEntry) {
                return false;
            }

            // Store updated data
            await this.store(key, data, context);

            await this.logOperation({
                operationId,
                type: 'update',
                key,
                size: JSON.stringify(data).length,
                duration: Date.now() - startTime,
                success: true,
                timestamp: new Date(),
                backend: this.config.provider
            });

            return true;

        } catch (error) {
            await this.logOperation({
                operationId,
                type: 'update',
                key,
                size: 0,
                duration: Date.now() - startTime,
                success: false,
                timestamp: new Date(),
                backend: this.config.provider,
                metadata: { error: error.message }
            });
            return false;
        }
    }

    /**
     * Delete cached data
     */
    async delete(key: string): Promise<boolean> {
        const startTime = Date.now();
        const operationId = this.generateOperationId();

        try {
            // Remove from memory cache
            const memoryEntry = this.memoryCache.get(key);
            if (memoryEntry) {
                this.memoryCache.delete(key);
                this.metrics.totalSize -= memoryEntry.metadata.size;
                this.metrics.itemCount--;
            }

            // Remove from backend storage
            const success = await this.deleteFromBackend(key, this.config.provider);

            // Clean up access history
            this.accessHistory.delete(key);

            await this.logOperation({
                operationId,
                type: 'delete',
                key,
                size: memoryEntry?.metadata.size || 0,
                duration: Date.now() - startTime,
                success,
                timestamp: new Date(),
                backend: this.config.provider
            });

            return success;

        } catch (error) {
            await this.logOperation({
                operationId,
                type: 'delete',
                key,
                size: 0,
                duration: Date.now() - startTime,
                success: false,
                timestamp: new Date(),
                backend: this.config.provider,
                metadata: { error: error.message }
            });
            return false;
        }
    }

    /**
     * Search cached data by tags or patterns
     */
    async search(
        query: {
            tags?: string[];
            pattern?: string;
            userAddress?: string;
            createdAfter?: Date;
            createdBefore?: Date;
        }
    ): Promise<string[]> {
        const matchingKeys: string[] = [];

        for (const [key, entry] of this.memoryCache.entries()) {
            let matches = true;

            // Check tags
            if (query.tags && query.tags.length > 0) {
                const hasAllTags = query.tags.every(tag => entry.tags.includes(tag));
                if (!hasAllTags) matches = false;
            }

            // Check pattern
            if (query.pattern && !key.includes(query.pattern)) {
                matches = false;
            }

            // Check date range
            if (query.createdAfter && entry.metadata.createdAt < query.createdAfter) {
                matches = false;
            }
            if (query.createdBefore && entry.metadata.createdAt > query.createdBefore) {
                matches = false;
            }

            // Check if not expired
            if (this.isExpired(entry)) {
                matches = false;
            }

            if (matches) {
                matchingKeys.push(key);
            }
        }

        return matchingKeys;
    }

    /**
     * Clean up expired entries and manage cache size
     */
    async cleanup(): Promise<{
        expiredRemoved: number;
        evictedForSpace: number;
        totalFreed: number;
    }> {
        let expiredRemoved = 0;
        let evictedForSpace = 0;
        let totalFreed = 0;

        // Remove expired entries
        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry)) {
                await this.delete(key);
                expiredRemoved++;
                totalFreed += entry.metadata.size;
            }
        }

        // Evict entries if over size limit
        while (this.metrics.totalSize > this.config.maxSize && this.memoryCache.size > 0) {
            const keyToEvict = this.selectEvictionCandidate();
            if (keyToEvict) {
                const entry = this.memoryCache.get(keyToEvict);
                await this.delete(keyToEvict);
                evictedForSpace++;
                totalFreed += entry?.metadata.size || 0;
                this.metrics.evictionCount++;
            } else {
                break;
            }
        }

        return { expiredRemoved, evictedForSpace, totalFreed };
    }

    /**
     * Get storage statistics and metrics
     */
    getMetrics(): StorageMetrics {
        // Update storage utilization
        this.metrics.storageUtilization = (this.metrics.totalSize / this.config.maxSize) * 100;
        
        // Calculate hit/miss rates
        const totalOperations = this.operationLog.filter(op => 
            op.type === 'retrieve' && op.success
        ).length;
        
        if (totalOperations > 0) {
            const hits = this.operationLog.filter(op => 
                op.type === 'retrieve' && op.success && op.metadata?.fromCache
            ).length;
            
            this.metrics.hitRate = (hits / totalOperations) * 100;
            this.metrics.missRate = 100 - this.metrics.hitRate;
        }

        // Calculate average retrieval time
        const retrievalOps = this.operationLog.filter(op => op.type === 'retrieve' && op.success);
        if (retrievalOps.length > 0) {
            this.metrics.averageRetrievalTime = retrievalOps.reduce((sum, op) => sum + op.duration, 0) / retrievalOps.length;
        }

        return { ...this.metrics };
    }

    /**
     * Private helper methods
     */
    private async initializeStorageBackends(): Promise<void> {
        switch (this.config.provider) {
            case 'ipfs':
                // Initialize IPFS client
                break;
            case 'arweave':
                // Initialize Arweave client
                break;
            case 'redis':
                // Initialize Redis client
                break;
            default:
                // Use memory storage
                break;
        }
    }

    private async storeInBackend(entry: AggregationCache, backend: string): Promise<string> {
        switch (backend) {
            case 'ipfs':
                return await this.storeInIPFS(entry);
            case 'arweave':
                return await this.storeInArweave(entry);
            case 'redis':
                return await this.storeInRedis(entry);
            default:
                return entry.key;
        }
    }

    private async retrieveFromBackend(key: string, backend: string): Promise<AggregationCache | null> {
        switch (backend) {
            case 'ipfs':
                return await this.retrieveFromIPFS(key);
            case 'arweave':
                return await this.retrieveFromArweave(key);
            case 'redis':
                return await this.retrieveFromRedis(key);
            default:
                return this.memoryCache.get(key) || null;
        }
    }

    private async deleteFromBackend(key: string, backend: string): Promise<boolean> {
        switch (backend) {
            case 'ipfs':
                return await this.deleteFromIPFS(key);
            case 'arweave':
                return await this.deleteFromArweave(key);
            case 'redis':
                return await this.deleteFromRedis(key);
            default:
                return true;
        }
    }

    // Backend-specific implementations (simplified)
    private async storeInIPFS(entry: AggregationCache): Promise<string> {
        // Simplified IPFS storage
        return `ipfs_${entry.key}`;
    }

    private async retrieveFromIPFS(key: string): Promise<AggregationCache | null> {
        // Simplified IPFS retrieval
        return null;
    }

    private async deleteFromIPFS(key: string): Promise<boolean> {
        // IPFS doesn't support deletion
        return true;
    }

    private async storeInArweave(entry: AggregationCache): Promise<string> {
        // Simplified Arweave storage
        return `arweave_${entry.key}`;
    }

    private async retrieveFromArweave(key: string): Promise<AggregationCache | null> {
        // Simplified Arweave retrieval
        return null;
    }

    private async deleteFromArweave(key: string): Promise<boolean> {
        // Arweave doesn't support deletion
        return true;
    }

    private async storeInRedis(entry: AggregationCache): Promise<string> {
        // Simplified Redis storage
        return entry.key;
    }

    private async retrieveFromRedis(key: string): Promise<AggregationCache | null> {
        // Simplified Redis retrieval
        return null;
    }

    private async deleteFromRedis(key: string): Promise<boolean> {
        // Simplified Redis deletion
        return true;
    }

    private async replicateData(entry: AggregationCache): Promise<void> {
        // Implement replication logic
        const replicationBackends = ['ipfs', 'arweave'];
        
        for (const backend of replicationBackends) {
            if (backend !== this.config.provider) {
                try {
                    await this.storeInBackend(entry, backend);
                } catch (error) {
                    console.warn(`Replication to ${backend} failed:`, error);
                }
            }
        }
    }

    private async serializeData(data: any): Promise<string> {
        return JSON.stringify(data);
    }

    private async deserializeData(data: string): Promise<any> {
        return JSON.parse(data);
    }

    private async compressData(data: string): Promise<string> {
        // Simplified compression - in practice, use a proper compression library
        return Buffer.from(data).toString('base64');
    }

    private async decompressData(data: string): Promise<string> {
        // Simplified decompression
        return Buffer.from(data, 'base64').toString();
    }

    private async encryptData(data: string, userAddress: string): Promise<string> {
        // Simplified encryption - in practice, use proper encryption
        const key = createHash('sha256').update(userAddress).digest('hex');
        return Buffer.from(data + key).toString('base64');
    }

    private async decryptData(data: string, userAddress: string): Promise<string> {
        // Simplified decryption
        const key = createHash('sha256').update(userAddress).digest('hex');
        const decrypted = Buffer.from(data, 'base64').toString();
        return decrypted.replace(key, '');
    }

    private isExpired(entry: AggregationCache): boolean {
        return new Date() > entry.metadata.expiresAt;
    }

    private selectEvictionCandidate(): string | null {
        // LRU eviction strategy
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.metadata.lastAccessed.getTime() < oldestTime) {
                oldestTime = entry.metadata.lastAccessed.getTime();
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    private updateAccessHistory(key: string): void {
        const history = this.accessHistory.get(key) || [];
        history.push(new Date());
        
        // Keep only last 10 accesses
        if (history.length > 10) {
            history.shift();
        }
        
        this.accessHistory.set(key, history);
    }

    private updateStorageMetrics(operation: string, size: number, duration: number): void {
        if (operation === 'store') {
            this.metrics.totalSize += size;
            this.metrics.itemCount++;
        } else if (operation === 'hit') {
            // Hit rate calculated in getMetrics()
        } else if (operation === 'miss') {
            // Miss rate calculated in getMetrics()
        }
    }

    private async logOperation(operation: StorageOperation): Promise<void> {
        this.operationLog.push(operation);
        
        // Keep only last 1000 operations
        if (this.operationLog.length > 1000) {
            this.operationLog.shift();
        }
    }

    private generateOperationId(): string {
        return `storage_op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    /**
     * Public API methods for cache management
     */
    public async warmCache(keys: string[], context: AggregationContext): Promise<number> {
        let warmedCount = 0;
        
        for (const key of keys) {
            try {
                await this.retrieve(key, context);
                warmedCount++;
            } catch (error) {
                console.warn(`Failed to warm cache for key ${key}:`, error);
            }
        }
        
        return warmedCount;
    }

    public async invalidateByTags(tags: string[]): Promise<number> {
        let invalidatedCount = 0;
        
        for (const [key, entry] of this.memoryCache.entries()) {
            const hasAnyTag = tags.some(tag => entry.tags.includes(tag));
            if (hasAnyTag) {
                await this.delete(key);
                invalidatedCount++;
            }
        }
        
        return invalidatedCount;
    }

    public async exportCache(): Promise<any> {
        const cacheData: any = {};
        
        for (const [key, entry] of this.memoryCache.entries()) {
            if (!this.isExpired(entry)) {
                cacheData[key] = {
                    data: entry.data,
                    metadata: entry.metadata,
                    tags: entry.tags
                };
            }
        }
        
        return cacheData;
    }

    public async importCache(cacheData: any): Promise<number> {
        let importedCount = 0;
        
        for (const [key, entryData] of Object.entries(cacheData)) {
            try {
                const entry: AggregationCache = {
                    key,
                    data: entryData.data,
                    metadata: entryData.metadata,
                    tags: entryData.tags || []
                };
                
                this.memoryCache.set(key, entry);
                importedCount++;
            } catch (error) {
                console.warn(`Failed to import cache entry ${key}:`, error);
            }
        }
        
        return importedCount;
    }
} 