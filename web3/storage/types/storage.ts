/**
 * Storage Types for Sigil IPFS Integration
 * Types that coordinate with contracts and circuits
 */

import { CID } from 'multiformats/cid'

// Core Storage Types
export interface StorageConfig {
  ipfs: IPFSConfig
  encryption: EncryptionConfig
  cache: CacheConfig
  redundancy: RedundancyConfig
}

export interface IPFSConfig {
  nodes: IPFSNodeConfig[]
  defaultTimeout: number
  maxRetries: number
  pinningServices: PinningServiceConfig[]
  gateway: IPFSGatewayConfig
}

export interface IPFSNodeConfig {
  url: string
  timeout: number
  headers?: Record<string, string>
  auth?: {
    username: string
    password: string
  }
}

export interface PinningServiceConfig {
  name: string
  endpoint: string
  accessToken: string
  priority: number
  enabled: boolean
}

export interface IPFSGatewayConfig {
  publicGateways: string[]
  timeout: number
  fallbackEnabled: boolean
}

// Encryption Types
export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305'
  keyDerivation: 'PBKDF2' | 'Argon2id'
  saltLength: number
  iterations: number
}

export interface EncryptionMetadata {
  algorithm: string
  iv: Uint8Array
  salt: Uint8Array
  keyDerivationParams: {
    iterations: number
    memory?: number // for Argon2id
    parallelism?: number // for Argon2id
  }
}

export interface EncryptedData {
  data: Uint8Array
  metadata: EncryptionMetadata
  checksum: string
}

// Cache Types
export interface CacheConfig {
  maxSize: number // in bytes
  ttl: number // time to live in milliseconds
  cleanupInterval: number
  strategy: 'LRU' | 'LFU' | 'FIFO'
}

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  accessCount: number
  size: number
  tags?: string[]
}

// Content Types for Sigil
export interface ProofContent {
  type: 'zk-proof'
  circuitType: 'repository' | 'language' | 'collaboration' | 'aggregate'
  proof: Uint8Array
  publicSignals: string[]
  metadata: ProofMetadata
}

export interface ProofMetadata {
  version: string
  timestamp: number
  expiresAt: number
  circuitHash: string
  verifierContract: string
  userAddress: string
  credentialType: string
}

export interface CredentialContent {
  type: 'credential'
  format: 'w3c' | 'jwt' | 'custom'
  credential: any
  proof: ProofContent
  metadata: CredentialMetadata
}

export interface CredentialMetadata {
  issuer: string
  subject: string
  issuedAt: number
  expiresAt: number
  credentialSchema: string
  tags: string[]
}

export interface AggregatedDataContent {
  type: 'aggregated-data'
  repositories: RepositoryData[]
  languages: LanguageData[]
  collaboration: CollaborationData
  temporal: TemporalData
  metadata: AggregationMetadata
}

export interface RepositoryData {
  repoHash: string // Privacy-preserving repository identifier
  commitCount: number
  locRange: [number, number] // Lines of code range
  languages: string[]
  collaboratorCount: number
  userRole: 'contributor' | 'maintainer' | 'owner'
  activityPeriod: [number, number] // Unix timestamps
}

export interface LanguageData {
  language: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  locCount: number
  projectCount: number
  patterns: string[] // Code patterns/idioms used
  frameworks: string[]
}

export interface CollaborationData {
  teamSizes: number[]
  roles: string[]
  interactionFrequency: number
  mentorshipEvidence: boolean
  leadershipEvidence: boolean
  crossTeamCollaboration: boolean
}

export interface TemporalData {
  contributionPeriods: Array<{
    start: number
    end: number
    intensity: 'low' | 'medium' | 'high'
  }>
  consistencyScore: number
  evolutionEvidence: {
    skillProgression: boolean
    responsibilityGrowth: boolean
    technologyAdoption: boolean
  }
}

export interface AggregationMetadata {
  totalRepositories: number
  totalCommits: number
  dateRange: [number, number]
  privacyLevel: 'k-anonymous' | 'differential-private' | 'zero-knowledge'
  aggregationMethod: string
  noiseParameters?: {
    epsilon: number // for differential privacy
    delta: number
  }
}

// Storage Operation Types
export interface StorageResult {
  cid: CID
  size: number
  hash: string
  timestamp: number
  encrypted: boolean
  pinned: boolean
  redundancyLevel: number
}

export interface RetrievalOptions {
  timeout?: number
  preferredGateway?: string
  verifyIntegrity?: boolean
  decryptionKey?: string
  fallbackToCache?: boolean
}

export interface StorageOptions {
  encrypt?: boolean
  pin?: boolean
  redundancy?: number
  tags?: string[]
  metadata?: Record<string, any>
  compression?: boolean
}

// Redundancy Types
export interface RedundancyConfig {
  minNodes: number
  preferredNodes: number
  replicationStrategy: 'immediate' | 'lazy' | 'on-demand'
  verificationInterval: number
}

export interface RedundancyStatus {
  totalNodes: number
  availableNodes: number
  replicationHealth: 'healthy' | 'degraded' | 'critical'
  lastVerified: number
}

// Error Types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public details?: any
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

export enum StorageErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  INVALID_CID = 'INVALID_CID',
  INSUFFICIENT_REDUNDANCY = 'INSUFFICIENT_REDUNDANCY',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_CONTENT_TYPE = 'INVALID_CONTENT_TYPE',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED'
}

// Content Addressing Types
export interface ContentAddress {
  cid: CID
  multihash: string
  codec: string
  version: number
}

export interface ContentMetadata {
  size: number
  type: string
  encoding?: string
  checksum: string
  created: number
  accessed: number
  tags: string[]
}

// Circuit Integration Types
export interface CircuitProofStorage {
  proofData: Uint8Array
  publicInputs: string[]
  circuitWasm: CID
  circuitZkey: CID
  verificationKey: any
  circuitMetadata: {
    name: string
    version: string
    constraints: number
    variables: number
  }
}

// Contract Integration Types
export interface ContractReference {
  address: string
  network: string
  verifierType: string
  deploymentBlock: number
  abi: any[]
}

export interface OnChainReference {
  transactionHash: string
  blockNumber: number
  contractAddress: string
  eventLogs: any[]
  gasUsed: number
}

// Batch Operations
export interface BatchStorageOperation {
  operations: Array<{
    type: 'store' | 'retrieve' | 'pin' | 'unpin'
    content?: any
    cid?: CID
    options?: StorageOptions | RetrievalOptions
  }>
  batchId: string
  priority: 'low' | 'normal' | 'high'
}

export interface BatchStorageResult {
  batchId: string
  results: Array<{
    success: boolean
    result?: StorageResult | any
    error?: StorageError
  }>
  totalTime: number
  successCount: number
  failureCount: number
}

// Monitoring and Analytics
export interface StorageMetrics {
  totalStoredBytes: number
  totalContentItems: number
  cacheHitRate: number
  averageRetrievalTime: number
  redundancyHealth: RedundancyStatus
  errorRate: number
  costMetrics: {
    storageCost: number
    bandwidthCost: number
    pinningCost: number
  }
}

export interface StorageEvent {
  type: 'stored' | 'retrieved' | 'pinned' | 'unpinned' | 'error'
  timestamp: number
  cid?: CID
  size?: number
  duration?: number
  error?: StorageError
  metadata?: Record<string, any>
} 