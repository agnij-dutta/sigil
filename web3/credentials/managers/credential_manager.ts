import { 
  SigilCredential, 
  CredentialRequest, 
  CredentialResponse, 
  BatchCredentialRequest,
  BatchCredentialResponse,
  CredentialStatus,
  VerificationRequest,
  VerificationResult
} from '../types/credentials.js';
import { CredentialGenerator } from '../generators/credential_generator.js';
import { W3CCredentialFormatter, W3CVerifiableCredential } from '../formats/w3c_credentials.js';

export interface CredentialStorage {
  store(credential: SigilCredential): Promise<string>;
  retrieve(id: string): Promise<SigilCredential | null>;
  list(subjectId: string): Promise<string[]>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: CredentialStatus): Promise<boolean>;
}

export interface CredentialManagerOptions {
  storage: CredentialStorage;
  generator: CredentialGenerator;
  defaultPrivacyLevel: 'low' | 'medium' | 'high';
  defaultExpirationDays: number;
  enableBatching: boolean;
  maxBatchSize: number;
  verificationTimeout: number; // milliseconds
}

/**
 * Main credential manager that orchestrates the entire credential lifecycle
 */
export class CredentialManager {
  private storage: CredentialStorage;
  private generator: CredentialGenerator;
  private options: CredentialManagerOptions;
  private pendingRequests: Map<string, CredentialRequest> = new Map();
  private batchQueue: Map<string, BatchCredentialRequest> = new Map();

  constructor(options: CredentialManagerOptions) {
    this.storage = options.storage;
    this.generator = options.generator;
    this.options = options;
  }

  /**
   * Generate a single credential
   */
  async generateCredential(request: CredentialRequest): Promise<CredentialResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId(request);

    try {
      // Store pending request
      this.pendingRequests.set(requestId, request);

      // Validate request
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          credential: null as any,
          status: 'invalid',
          generationTime: Date.now() - startTime,
          proofSize: 0,
          verificationKey: '',
          error: validationResult.errors.join(', ')
        };
      }

      // Generate credential based on type
      let credential: SigilCredential;
      switch (request.type) {
        case 'repository':
          credential = await this.generateRepositoryCredential(request);
          break;
        case 'language':
          credential = await this.generateLanguageCredential(request);
          break;
        case 'collaboration':
          credential = await this.generateCollaborationCredential(request);
          break;
        case 'aggregate':
          credential = await this.generateAggregateCredential(request);
          break;
        default:
          throw new Error(`Unsupported credential type: ${request.type}`);
      }

      // Store credential
      const credentialId = await this.storage.store(credential);

      // Generate verification key
      const verificationKey = this.generateVerificationKey(credential);

      // Calculate proof size
      const proofSize = this.calculateProofSize(credential);

      // Clean up pending request
      this.pendingRequests.delete(requestId);

      return {
        credential,
        status: 'ready',
        generationTime: Date.now() - startTime,
        proofSize,
        verificationKey
      };

    } catch (error) {
      this.pendingRequests.delete(requestId);
      return {
        credential: null as any,
        status: 'invalid',
        generationTime: Date.now() - startTime,
        proofSize: 0,
        verificationKey: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple credentials in batch
   */
  async generateBatch(batchRequest: BatchCredentialRequest): Promise<BatchCredentialResponse> {
    const startTime = Date.now();
    
    if (!this.options.enableBatching) {
      throw new Error('Batch processing is disabled');
    }

    if (batchRequest.requests.length > this.options.maxBatchSize) {
      throw new Error(`Batch size exceeds maximum of ${this.options.maxBatchSize}`);
    }

    // Store batch request
    this.batchQueue.set(batchRequest.batchId, batchRequest);

    const credentials: CredentialResponse[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      if (batchRequest.parallelGeneration) {
        // Process in parallel
        const promises = batchRequest.requests.map(request => 
          this.generateCredential(request).catch(error => ({
            credential: null as any,
            status: 'invalid' as CredentialStatus,
            generationTime: 0,
            proofSize: 0,
            verificationKey: '',
            error: error.message
          }))
        );

        const results = await Promise.all(promises);
        credentials.push(...results);
      } else {
        // Process sequentially
        for (const request of batchRequest.requests) {
          try {
            const result = await this.generateCredential(request);
            credentials.push(result);
          } catch (error) {
            credentials.push({
              credential: null as any,
              status: 'invalid',
              generationTime: 0,
              proofSize: 0,
              verificationKey: '',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      // Count successes and failures
      for (const credential of credentials) {
        if (credential.status === 'ready') {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Clean up batch queue
      this.batchQueue.delete(batchRequest.batchId);

      return {
        batchId: batchRequest.batchId,
        credentials,
        overallStatus: failureCount === 0 ? 'completed' : successCount === 0 ? 'failed' : 'partial',
        totalGenerationTime: Date.now() - startTime,
        successCount,
        failureCount
      };

    } catch (error) {
      this.batchQueue.delete(batchRequest.batchId);
      throw error;
    }
  }

  /**
   * Retrieve a credential by ID
   */
  async getCredential(id: string): Promise<SigilCredential | null> {
    return await this.storage.retrieve(id);
  }

  /**
   * List all credentials for a subject
   */
  async listCredentials(subjectId: string): Promise<string[]> {
    return await this.storage.list(subjectId);
  }

  /**
   * Verify a credential
   */
  async verifyCredential(request: VerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      // Check credential age if specified
      if (request.acceptableAge) {
        const age = Date.now() - request.credential.issuedAt;
        if (age > request.acceptableAge * 1000) {
          return {
            isValid: false,
            claimsVerified: [],
            claimsFailed: ['credential_expired'],
            trustScore: 0,
            verificationTime: Date.now() - startTime,
            error: 'Credential has exceeded acceptable age'
          };
        }
      }

      // Check expiration
      if (request.credential.expiresAt && Date.now() > request.credential.expiresAt) {
        return {
          isValid: false,
          claimsVerified: [],
          claimsFailed: ['credential_expired'],
          trustScore: 0,
          verificationTime: Date.now() - startTime,
          error: 'Credential has expired'
        };
      }

      // Verify ZK proof
      const proofValid = await this.verifyZKProof(request.credential, request.verificationKey);
      if (!proofValid) {
        return {
          isValid: false,
          claimsVerified: [],
          claimsFailed: ['invalid_proof'],
          trustScore: 0,
          verificationTime: Date.now() - startTime,
          error: 'ZK proof verification failed'
        };
      }

      // Verify specific claims if requested
      const claimsVerified: string[] = [];
      const claimsFailed: string[] = [];

      if (request.requiredClaims) {
        for (const claimName of request.requiredClaims) {
          if (this.hasValidClaim(request.credential, claimName)) {
            claimsVerified.push(claimName);
          } else {
            claimsFailed.push(claimName);
          }
        }
      } else {
        // Verify all claims
        claimsVerified.push(...this.getAllClaimNames(request.credential));
      }

      // Calculate trust score
      const trustScore = this.calculateTrustScore(request.credential, claimsVerified, claimsFailed);

      return {
        isValid: claimsFailed.length === 0,
        claimsVerified,
        claimsFailed,
        trustScore,
        verificationTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        isValid: false,
        claimsVerified: [],
        claimsFailed: ['verification_error'],
        trustScore: 0,
        verificationTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }

  /**
   * Convert credential to W3C format
   */
  toW3C(credential: SigilCredential): W3CVerifiableCredential {
    return W3CCredentialFormatter.toW3C(credential);
  }

  /**
   * Convert W3C credential to Sigil format
   */
  fromW3C(w3cCredential: W3CVerifiableCredential): SigilCredential {
    return W3CCredentialFormatter.fromW3C(w3cCredential);
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(id: string): Promise<boolean> {
    return await this.storage.updateStatus(id, 'revoked');
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId: string): BatchCredentialRequest | null {
    return this.batchQueue.get(batchId) || null;
  }

  /**
   * Get pending request status
   */
  getRequestStatus(requestId: string): CredentialRequest | null {
    return this.pendingRequests.get(requestId) || null;
  }

  // Private helper methods

  private async generateRepositoryCredential(request: CredentialRequest): Promise<SigilCredential> {
    // This would integrate with the actual repository data processing
    // For now, we'll use the existing generator
    const repositoryData = await this.fetchRepositoryData(request.subjectId);
    const userCommitments = await this.fetchUserCommitments(request.subjectId);
    
    return await this.generator.generateRepositoryCredential(
      repositoryData,
      userCommitments,
      {
        privacyLevel: request.privacyLevel,
        includeMetadata: request.includeMetadata,
        expirationDays: request.expirationDays
      }
    );
  }

  private async generateLanguageCredential(request: CredentialRequest): Promise<SigilCredential> {
    const languageData = await this.fetchLanguageData(request.subjectId);
    const userCommitments = await this.fetchUserCommitments(request.subjectId);
    
    return await this.generator.generateLanguageCredential(
      languageData,
      userCommitments,
      {
        privacyLevel: request.privacyLevel,
        includeMetadata: request.includeMetadata,
        expirationDays: request.expirationDays
      }
    );
  }

  private async generateCollaborationCredential(request: CredentialRequest): Promise<SigilCredential> {
    // Implementation would use collaboration analyzer
    throw new Error('Collaboration credential generation not yet implemented');
  }

  private async generateAggregateCredential(request: CredentialRequest): Promise<SigilCredential> {
    // Implementation would aggregate multiple credentials
    throw new Error('Aggregate credential generation not yet implemented');
  }

  private validateRequest(request: CredentialRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.type) errors.push('Missing credential type');
    if (!request.subjectId) errors.push('Missing subject ID');
    if (!request.requestedClaims || request.requestedClaims.length === 0) {
      errors.push('Missing requested claims');
    }

    const validTypes = ['repository', 'language', 'collaboration', 'aggregate'];
    if (!validTypes.includes(request.type)) {
      errors.push(`Invalid credential type: ${request.type}`);
    }

    const validPrivacyLevels = ['low', 'medium', 'high'];
    if (!validPrivacyLevels.includes(request.privacyLevel)) {
      errors.push(`Invalid privacy level: ${request.privacyLevel}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateRequestId(request: CredentialRequest): string {
    const timestamp = Date.now();
    const hash = Buffer.from(`${request.type}-${request.subjectId}-${timestamp}`).toString('base64');
    return hash.substring(0, 16);
  }

  private generateVerificationKey(credential: SigilCredential): string {
    // This would generate the actual verification key for the ZK proof
    return `vk_${credential.type}_${credential.subject}_${credential.issuedAt}`;
  }

  private calculateProofSize(credential: SigilCredential): number {
    // Calculate the size of the ZK proof in bytes
    const proofJson = JSON.stringify(credential.proof);
    return Buffer.byteLength(proofJson, 'utf8');
  }

  private async verifyZKProof(credential: SigilCredential, verificationKey: string): Promise<boolean> {
    // This would integrate with the actual ZK proof verification
    // For now, we'll do basic validation
    return !!(credential.proof && credential.proof.pi_a && credential.proof.pi_b && credential.proof.pi_c);
  }

  private hasValidClaim(credential: SigilCredential, claimName: string): boolean {
    return credential.claims && (credential.claims as any)[claimName] !== undefined;
  }

  private getAllClaimNames(credential: SigilCredential): string[] {
    return credential.claims ? Object.keys(credential.claims) : [];
  }

  private calculateTrustScore(
    credential: SigilCredential, 
    verified: string[], 
    failed: string[]
  ): number {
    const total = verified.length + failed.length;
    if (total === 0) return 0;

    const baseScore = (verified.length / total) * 100;
    
    // Adjust based on credential metadata
    let adjustment = 0;
    if (credential.metadata) {
      if (credential.metadata.privacyLevel === 'high') adjustment += 10;
      if (credential.metadata.generationMethod === 'zk-snark') adjustment += 5;
    }

    return Math.min(100, Math.max(0, baseScore + adjustment));
  }

  private async fetchRepositoryData(subjectId: string): Promise<any> {
    // This would integrate with GitHub API or cached data
    return {
      owner: 'example-user',
      name: 'example-repo',
      private: false,
      commits: [],
      collaborators: [],
      totalLOC: 1000
    };
  }

  private async fetchLanguageData(subjectId: string): Promise<any> {
    // This would integrate with language analysis
    return {
      languages: ['TypeScript', 'Python', 'Rust'],
      primaryLanguage: 'TypeScript',
      proficiencyLevels: {},
      projectCount: 5,
      experienceYears: 3
    };
  }

  private async fetchUserCommitments(subjectId: string): Promise<any> {
    // This would fetch user's cryptographic commitments
    return {
      userHash: subjectId,
      username: 'example-user'
    };
  }
} 