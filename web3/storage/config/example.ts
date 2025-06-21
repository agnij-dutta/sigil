/**
 * Example Storage Configuration for Sigil IPFS System
 * Shows how to configure the storage system for different environments
 */

import type { StorageConfig } from '../types'
import type { GCConfig } from '../garbage_collection'

/**
 * Development Configuration
 * Optimized for local development and testing
 */
export const developmentConfig: StorageConfig = {
  ipfs: {
    nodes: [
      {
        url: 'http://localhost:5001',
        timeout: 30000
      }
    ],
    defaultTimeout: 30000,
    maxRetries: 3,
    pinningServices: [
      {
        name: 'local',
        endpoint: 'http://localhost:5001/api/v0/pin',
        accessToken: '',
        priority: 1,
        enabled: true
      }
    ],
    gateway: {
      publicGateways: [
        'http://localhost:8080',
        'https://ipfs.io',
        'https://cloudflare-ipfs.com'
      ],
      timeout: 10000,
      fallbackEnabled: true
    }
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    saltLength: 32,
    iterations: 100000
  },
  cache: {
    maxSize: 50 * 1024 * 1024, // 50MB for development
    ttl: 1800000, // 30 minutes
    cleanupInterval: 300000, // 5 minutes
    strategy: 'LRU'
  },
  redundancy: {
    defaultLevel: 1,
    minimumLevel: 1,
    maximumLevel: 2,
    replicationPolicy: {
      proofs: 1,
      credentials: 1,
      aggregatedData: 2
    }
  }
}

/**
 * Testing Configuration
 * Optimized for automated testing
 */
export const testingConfig: StorageConfig = {
  ipfs: {
    nodes: [
      {
        url: 'http://localhost:5001',
        timeout: 10000
      }
    ],
    defaultTimeout: 10000,
    maxRetries: 1,
    pinningServices: [],
    gateway: {
      publicGateways: ['http://localhost:8080'],
      timeout: 5000,
      fallbackEnabled: false
    }
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    saltLength: 16, // Smaller for faster tests
    iterations: 10000 // Fewer iterations for faster tests
  },
  cache: {
    maxSize: 10 * 1024 * 1024, // 10MB for testing
    ttl: 300000, // 5 minutes
    cleanupInterval: 60000, // 1 minute
    strategy: 'FIFO'
  },
  redundancy: {
    defaultLevel: 1,
    minimumLevel: 1,
    maximumLevel: 1,
    replicationPolicy: {
      proofs: 1,
      credentials: 1,
      aggregatedData: 1
    }
  }
}

/**
 * Production Configuration
 * Optimized for production deployment with high availability
 */
export const productionConfig: StorageConfig = {
  ipfs: {
    nodes: [
      {
        url: process.env.IPFS_NODE_URL || 'https://ipfs.sigil.dev',
        timeout: 60000,
        headers: {
          'Authorization': `Bearer ${process.env.IPFS_AUTH_TOKEN}`
        }
      },
      {
        url: process.env.IPFS_BACKUP_NODE_URL || 'https://ipfs-backup.sigil.dev',
        timeout: 60000,
        headers: {
          'Authorization': `Bearer ${process.env.IPFS_BACKUP_AUTH_TOKEN}`
        }
      }
    ],
    defaultTimeout: 60000,
    maxRetries: 5,
    pinningServices: [
      {
        name: 'pinata',
        endpoint: 'https://api.pinata.cloud/psa',
        accessToken: process.env.PINATA_JWT || '',
        priority: 1,
        enabled: !!process.env.PINATA_JWT
      },
      {
        name: 'web3storage',
        endpoint: 'https://api.web3.storage',
        accessToken: process.env.WEB3_STORAGE_TOKEN || '',
        priority: 2,
        enabled: !!process.env.WEB3_STORAGE_TOKEN
      },
      {
        name: 'nftstorage',
        endpoint: 'https://api.nft.storage',
        accessToken: process.env.NFT_STORAGE_TOKEN || '',
        priority: 3,
        enabled: !!process.env.NFT_STORAGE_TOKEN
      }
    ],
    gateway: {
      publicGateways: [
        'https://ipfs.io',
        'https://cloudflare-ipfs.com',
        'https://gateway.pinata.cloud',
        'https://dweb.link'
      ],
      timeout: 30000,
      fallbackEnabled: true
    }
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    saltLength: 32,
    iterations: 210000 // OWASP recommended minimum for 2023
  },
  cache: {
    maxSize: 500 * 1024 * 1024, // 500MB for production
    ttl: 7200000, // 2 hours
    cleanupInterval: 600000, // 10 minutes
    strategy: 'LRU'
  },
  redundancy: {
    defaultLevel: 3,
    minimumLevel: 2,
    maximumLevel: 5,
    replicationPolicy: {
      proofs: 3,
      credentials: 3,
      aggregatedData: 5 // Highest redundancy for aggregated data
    }
  }
}

/**
 * Staging Configuration
 * Similar to production but with reduced redundancy
 */
export const stagingConfig: StorageConfig = {
  ...productionConfig,
  cache: {
    ...productionConfig.cache,
    maxSize: 200 * 1024 * 1024 // 200MB for staging
  },
  redundancy: {
    defaultLevel: 2,
    minimumLevel: 1,
    maximumLevel: 3,
    replicationPolicy: {
      proofs: 2,
      credentials: 2,
      aggregatedData: 3
    }
  }
}

/**
 * Garbage Collection Configuration for Development
 */
export const developmentGCConfig: GCConfig = {
  maxStorageSize: 100 * 1024 * 1024, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  orphanCleanupAge: 24 * 60 * 60 * 1000, // 1 day
  retentionPolicies: [
    {
      contentType: 'zk-proof',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      priority: 'high',
      conditions: [
        {
          type: 'usage',
          threshold: 1,
          action: 'keep'
        },
        {
          type: 'expiration',
          threshold: 7 * 24 * 60 * 60 * 1000, // 7 days
          action: 'delete'
        }
      ]
    },
    {
      contentType: 'verifiable-credential',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      priority: 'medium',
      conditions: [
        {
          type: 'usage',
          threshold: 1,
          action: 'keep'
        },
        {
          type: 'expiration',
          threshold: 30 * 24 * 60 * 60 * 1000, // 30 days
          action: 'archive'
        }
      ]
    },
    {
      contentType: '*',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      priority: 'low',
      conditions: [
        {
          type: 'usage',
          threshold: 0,
          action: 'delete'
        }
      ]
    }
  ],
  scheduledCleanup: true,
  cleanupInterval: 60 * 60 * 1000 // 1 hour
}

/**
 * Garbage Collection Configuration for Production
 */
export const productionGCConfig: GCConfig = {
  maxStorageSize: 10 * 1024 * 1024 * 1024, // 10GB
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  orphanCleanupAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  retentionPolicies: [
    {
      contentType: 'zk-proof',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      priority: 'critical',
      conditions: [
        {
          type: 'usage',
          threshold: 1,
          action: 'keep'
        },
        {
          type: 'verification',
          threshold: 1,
          action: 'keep'
        },
        {
          type: 'expiration',
          threshold: 180 * 24 * 60 * 60 * 1000, // 6 months
          action: 'archive'
        }
      ]
    },
    {
      contentType: 'verifiable-credential',
      maxAge: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      priority: 'high',
      conditions: [
        {
          type: 'usage',
          threshold: 1,
          action: 'keep'
        },
        {
          type: 'expiration',
          threshold: 365 * 24 * 60 * 60 * 1000, // 1 year
          action: 'archive'
        }
      ]
    },
    {
      contentType: 'aggregated-data',
      maxAge: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
      priority: 'critical',
      conditions: [
        {
          type: 'usage',
          threshold: 10,
          action: 'keep'
        },
        {
          type: 'expiration',
          threshold: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
          action: 'archive'
        }
      ]
    },
    {
      contentType: '*',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      priority: 'low',
      conditions: [
        {
          type: 'usage',
          threshold: 0,
          action: 'delete'
        },
        {
          type: 'expiration',
          threshold: 30 * 24 * 60 * 60 * 1000, // 30 days
          action: 'delete'
        }
      ]
    }
  ],
  scheduledCleanup: true,
  cleanupInterval: 6 * 60 * 60 * 1000 // 6 hours
}

/**
 * Configuration Factory
 */
export function getStorageConfig(environment: string = 'development'): StorageConfig {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return productionConfig
    case 'staging':
    case 'stage':
      return stagingConfig
    case 'testing':
    case 'test':
      return testingConfig
    case 'development':
    case 'dev':
    default:
      return developmentConfig
  }
}

/**
 * GC Configuration Factory
 */
export function getGCConfig(environment: string = 'development'): GCConfig {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
    case 'staging':
    case 'stage':
      return productionGCConfig
    case 'testing':
    case 'test':
    case 'development':
    case 'dev':
    default:
      return developmentGCConfig
  }
}

/**
 * Environment-specific optimization
 */
export function optimizeConfigForCircuits(config: StorageConfig): StorageConfig {
  return {
    ...config,
    cache: {
      ...config.cache,
      // Increase cache size for circuit artifacts
      maxSize: config.cache.maxSize * 2,
      // Longer TTL for circuit files
      ttl: config.cache.ttl * 3,
      // LRU is best for circuit caching
      strategy: 'LRU'
    },
    redundancy: {
      ...config.redundancy,
      // Higher redundancy for circuit files
      replicationPolicy: {
        proofs: config.redundancy.replicationPolicy.proofs + 1,
        credentials: config.redundancy.replicationPolicy.credentials,
        aggregatedData: config.redundancy.replicationPolicy.aggregatedData
      }
    }
  }
}

/**
 * Environment-specific optimization for contracts
 */
export function optimizeConfigForContracts(config: StorageConfig): StorageConfig {
  return {
    ...config,
    cache: {
      ...config.cache,
      // Faster cleanup for contract-related data
      cleanupInterval: config.cache.cleanupInterval / 2,
      // LFU is good for frequently accessed contract data
      strategy: 'LFU'
    },
    redundancy: {
      ...config.redundancy,
      // Higher redundancy for contract-verified credentials
      replicationPolicy: {
        proofs: config.redundancy.replicationPolicy.proofs,
        credentials: config.redundancy.replicationPolicy.credentials + 1,
        aggregatedData: config.redundancy.replicationPolicy.aggregatedData
      }
    }
  }
}

/**
 * Configuration validation
 */
export function validateConfig(config: StorageConfig): boolean {
  try {
    // Basic validation
    if (!config.ipfs || !config.encryption || !config.cache || !config.redundancy) {
      return false
    }

    // IPFS validation
    if (!config.ipfs.nodes || config.ipfs.nodes.length === 0) {
      return false
    }

    // Encryption validation
    if (!['AES-256-GCM', 'ChaCha20-Poly1305'].includes(config.encryption.algorithm)) {
      return false
    }

    // Cache validation
    if (config.cache.maxSize <= 0 || config.cache.ttl <= 0) {
      return false
    }

    // Redundancy validation
    if (config.redundancy.minimumLevel > config.redundancy.maximumLevel) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Default export with environment detection
 */
export default function createConfig(): { storage: StorageConfig; gc: GCConfig } {
  const environment = process.env.NODE_ENV || 'development'
  const storage = getStorageConfig(environment)
  const gc = getGCConfig(environment)

  // Apply optimizations based on enabled features
  let optimizedStorage = storage
  
  if (process.env.ENABLE_CIRCUIT_OPTIMIZATION === 'true') {
    optimizedStorage = optimizeConfigForCircuits(optimizedStorage)
  }
  
  if (process.env.ENABLE_CONTRACT_OPTIMIZATION === 'true') {
    optimizedStorage = optimizeConfigForContracts(optimizedStorage)
  }

  // Validate configuration
  if (!validateConfig(optimizedStorage)) {
    console.warn('Invalid storage configuration detected, falling back to development config')
    optimizedStorage = developmentConfig
  }

  return {
    storage: optimizedStorage,
    gc
  }
} 