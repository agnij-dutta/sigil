/**
 * Main exports for Sigil IPFS Storage Types
 */

// Export all storage types
export * from './storage'
export * from './content'

// Re-export commonly used types for convenience
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
  CacheEntry,
  BatchStorageOperation,
  BatchStorageResult,
  StorageMetrics,
  StorageEvent
} from './storage'

export type {
  BaseContent,
  ZKProofContent,
  VerifiableCredentialContent,
  CredentialClaims,
  CredentialProof,
  ContentValidation,
  ValidationError,
  ValidationWarning
} from './content' 