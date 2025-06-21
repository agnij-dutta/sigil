import { SigilCredential, BaseCredential, ZKProof } from '../types/credentials.js';

/**
 * W3C Verifiable Credentials format handler for Sigil ZK credentials
 * Converts Sigil-native credentials to W3C VC standard format
 */

export interface W3CVerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: W3CIssuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: W3CCredentialSubject;
  proof: W3CProof;
  credentialSchema?: W3CCredentialSchema;
  credentialStatus?: W3CCredentialStatus;
}

export interface W3CIssuer {
  id: string;
  name?: string;
  type?: string;
}

export interface W3CCredentialSubject {
  id: string;
  type: string;
  claims: Record<string, any>;
  zkProof: ZKProofWrapper;
}

export interface ZKProofWrapper {
  type: 'ZKProof';
  proofSystem: string;
  curve: string;
  proof: ZKProof;
  verificationMethod: string;
  publicSignals?: string[];
}

export interface W3CProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue?: string;
  jws?: string;
}

export interface W3CCredentialSchema {
  id: string;
  type: string;
}

export interface W3CCredentialStatus {
  id: string;
  type: string;
}

export class W3CCredentialFormatter {
  private static readonly SIGIL_CONTEXT = 'https://sigil.network/credentials/v1';
  private static readonly W3C_CONTEXT = 'https://www.w3.org/2018/credentials/v1';
  private static readonly ZK_CONTEXT = 'https://w3id.org/security/suites/zk-2023/v1';

  /**
   * Convert Sigil credential to W3C Verifiable Credential format
   */
  static toW3C(sigilCredential: SigilCredential, options: W3CFormatOptions = {}): W3CVerifiableCredential {
    const {
      includeSchema = true,
      includeStatus = false,
      credentialId,
      verificationMethod = 'https://sigil.network/keys/1'
    } = options;

    const w3cCredential: W3CVerifiableCredential = {
      '@context': [
        this.W3C_CONTEXT,
        this.ZK_CONTEXT,
        this.SIGIL_CONTEXT
      ],
      id: credentialId || this.generateCredentialId(sigilCredential),
      type: ['VerifiableCredential', this.mapSigilTypeToW3C(sigilCredential.type)],
      issuer: {
        id: sigilCredential.issuer,
        name: 'Sigil Network',
        type: 'Organization'
      },
      issuanceDate: new Date(sigilCredential.issuedAt).toISOString(),
      credentialSubject: {
        id: sigilCredential.subject,
        type: this.mapSigilTypeToW3C(sigilCredential.type),
        claims: this.sanitizeClaims(sigilCredential.claims),
        zkProof: {
          type: 'ZKProof',
          proofSystem: sigilCredential.proof.protocol,
          curve: sigilCredential.proof.curve,
          proof: sigilCredential.proof,
          verificationMethod: verificationMethod,
          publicSignals: sigilCredential.proof.publicSignals
        }
      },
      proof: {
        type: 'ZKProof2023',
        created: new Date().toISOString(),
        verificationMethod: verificationMethod,
        proofPurpose: 'assertionMethod',
        proofValue: this.encodeZKProof(sigilCredential.proof)
      }
    };

    // Add expiration date if present
    if (sigilCredential.expiresAt) {
      w3cCredential.expirationDate = new Date(sigilCredential.expiresAt).toISOString();
    }

    // Add credential schema if requested
    if (includeSchema) {
      w3cCredential.credentialSchema = {
        id: `https://sigil.network/schemas/${sigilCredential.type}/v${sigilCredential.version}`,
        type: 'JsonSchemaValidator2018'
      };
    }

    // Add credential status if requested
    if (includeStatus) {
      w3cCredential.credentialStatus = {
        id: `https://sigil.network/status/${this.generateCredentialId(sigilCredential)}`,
        type: 'RevocationList2020Status'
      };
    }

    return w3cCredential;
  }

  /**
   * Convert W3C Verifiable Credential back to Sigil format
   */
  static fromW3C(w3cCredential: W3CVerifiableCredential): SigilCredential {
    const sigilType = this.mapW3CTypeToSigil(w3cCredential.credentialSubject.type);
    
    const baseCredential: BaseCredential = {
      type: sigilType,
      version: this.extractVersionFromSchema(w3cCredential.credentialSchema?.id),
      issuer: typeof w3cCredential.issuer === 'string' ? w3cCredential.issuer : w3cCredential.issuer.id,
      subject: w3cCredential.credentialSubject.id,
      issuedAt: new Date(w3cCredential.issuanceDate).getTime(),
      expiresAt: w3cCredential.expirationDate ? new Date(w3cCredential.expirationDate).getTime() : undefined
    };

    return {
      ...baseCredential,
      claims: w3cCredential.credentialSubject.claims,
      proof: w3cCredential.credentialSubject.zkProof.proof
    } as SigilCredential;
  }

  /**
   * Validate W3C credential structure
   */
  static validateW3C(w3cCredential: W3CVerifiableCredential): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required contexts
    if (!w3cCredential['@context']?.includes(this.W3C_CONTEXT)) {
      errors.push('Missing required W3C credentials context');
    }

    if (!w3cCredential['@context']?.includes(this.SIGIL_CONTEXT)) {
      warnings.push('Missing Sigil context, some features may not work');
    }

    // Check required fields
    if (!w3cCredential.id) errors.push('Missing credential ID');
    if (!w3cCredential.issuer) errors.push('Missing issuer');
    if (!w3cCredential.issuanceDate) errors.push('Missing issuance date');
    if (!w3cCredential.credentialSubject) errors.push('Missing credential subject');
    if (!w3cCredential.proof) errors.push('Missing proof');

    // Check ZK proof structure
    if (w3cCredential.credentialSubject?.zkProof) {
      const zkProof = w3cCredential.credentialSubject.zkProof;
      if (!zkProof.proof) errors.push('Missing ZK proof data');
      if (!zkProof.proofSystem) errors.push('Missing proof system specification');
      if (!zkProof.verificationMethod) errors.push('Missing verification method');
    } else {
      errors.push('Missing ZK proof in credential subject');
    }

    // Check expiration
    if (w3cCredential.expirationDate) {
      const expirationDate = new Date(w3cCredential.expirationDate);
      if (expirationDate < new Date()) {
        warnings.push('Credential has expired');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate a unique credential ID
   */
  private static generateCredentialId(credential: SigilCredential): string {
    const hash = this.hashCredential(credential);
    return `https://sigil.network/credentials/${credential.type}/${hash}`;
  }

  /**
   * Map Sigil credential types to W3C types
   */
  private static mapSigilTypeToW3C(sigilType: string): string {
    const typeMap: Record<string, string> = {
      'repository': 'RepositoryCredential',
      'language': 'LanguageCredential',
      'collaboration': 'CollaborationCredential',
      'aggregate': 'AggregateCredential',
      'consistency': 'ConsistencyCredential',
      'diversity': 'DiversityCredential',
      'leadership': 'LeadershipCredential'
    };

    return typeMap[sigilType] || 'SigilCredential';
  }

  /**
   * Map W3C types back to Sigil types
   */
  private static mapW3CTypeToSigil(w3cType: string): string {
    const typeMap: Record<string, string> = {
      'RepositoryCredential': 'repository',
      'LanguageCredential': 'language',
      'CollaborationCredential': 'collaboration',
      'AggregateCredential': 'aggregate',
      'ConsistencyCredential': 'consistency',
      'DiversityCredential': 'diversity',
      'LeadershipCredential': 'leadership'
    };

    return typeMap[w3cType] || 'unknown';
  }

  /**
   * Sanitize claims to remove sensitive internal data
   */
  private static sanitizeClaims(claims: any): any {
    const sanitized = { ...claims };
    
    // Remove actualValue from range proofs to maintain privacy
    const sanitizeRangeProofs = (obj: any): any => {
      if (obj && typeof obj === 'object') {
        if (obj.actualValue !== undefined && obj.min !== undefined && obj.max !== undefined) {
          const { actualValue, ...sanitizedRange } = obj;
          return sanitizedRange;
        }
        
        if (Array.isArray(obj)) {
          return obj.map(sanitizeRangeProofs);
        }
        
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = sanitizeRangeProofs(value);
        }
        return result;
      }
      return obj;
    };

    return sanitizeRangeProofs(sanitized);
  }

  /**
   * Encode ZK proof for W3C format
   */
  private static encodeZKProof(proof: ZKProof): string {
    const proofData = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: proof.protocol,
      curve: proof.curve
    };
    
    return Buffer.from(JSON.stringify(proofData)).toString('base64');
  }

  /**
   * Extract version from schema ID
   */
  private static extractVersionFromSchema(schemaId?: string): string {
    if (!schemaId) return '1.0';
    
    const versionMatch = schemaId.match(/\/v(\d+\.\d+)$/);
    return versionMatch ? versionMatch[1] : '1.0';
  }

  /**
   * Hash credential for ID generation
   */
  private static hashCredential(credential: SigilCredential): string {
    const hashInput = `${credential.type}-${credential.subject}-${credential.issuedAt}`;
    // Simple hash for demo - use proper crypto hash in production
    return Buffer.from(hashInput).toString('base64').substring(0, 16);
  }
}

export interface W3CFormatOptions {
  includeSchema?: boolean;
  includeStatus?: boolean;
  credentialId?: string;
  verificationMethod?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Helper functions for working with W3C credentials
export class W3CCredentialUtils {
  /**
   * Check if a credential is expired
   */
  static isExpired(credential: W3CVerifiableCredential): boolean {
    if (!credential.expirationDate) return false;
    return new Date(credential.expirationDate) < new Date();
  }

  /**
   * Get credential age in days
   */
  static getAge(credential: W3CVerifiableCredential): number {
    const issuanceDate = new Date(credential.issuanceDate);
    const now = new Date();
    return Math.floor((now.getTime() - issuanceDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Extract ZK proof from W3C credential
   */
  static extractZKProof(credential: W3CVerifiableCredential): ZKProof | null {
    return credential.credentialSubject?.zkProof?.proof || null;
  }

  /**
   * Get credential type hierarchy
   */
  static getTypeHierarchy(credential: W3CVerifiableCredential): string[] {
    return credential.type || [];
  }

  /**
   * Check if credential has specific claim
   */
  static hasClaim(credential: W3CVerifiableCredential, claimName: string): boolean {
    return credential.credentialSubject?.claims?.[claimName] !== undefined;
  }
} 