import { VerificationResult, CredentialProof, VerificationContext } from '../types/verification.js';

export interface CredentialVerificationOptions {
  requireRecent?: boolean;
  maxAge?: number; // in days
  minimumTrustLevel?: number;
  allowPartialVerification?: boolean;
}

export class CredentialVerifier {
  async verifyCredential(
    proof: CredentialProof,
    context: VerificationContext,
    options: CredentialVerificationOptions = {}
  ): Promise<VerificationResult> {
    try {
      // Verify proof structure
      const structureValid = await this.verifyProofStructure(proof);
      if (!structureValid.isValid) {
        return structureValid;
      }

      // Verify cryptographic proof
      const cryptoValid = await this.verifyCryptographicProof(proof);
      if (!cryptoValid.isValid) {
        return cryptoValid;
      }

      // Verify metadata consistency
      const metadataValid = await this.verifyMetadata(proof, context);
      if (!metadataValid.isValid) {
        return metadataValid;
      }

      // Verify freshness if required
      if (options.requireRecent) {
        const freshnessValid = await this.verifyFreshness(proof, options.maxAge || 30);
        if (!freshnessValid.isValid) {
          return freshnessValid;
        }
      }

      // Verify trust level
      const trustLevel = await this.calculateTrustLevel(proof, context);
      if (options.minimumTrustLevel && trustLevel < options.minimumTrustLevel) {
        return {
          isValid: false,
          reason: 'Insufficient trust level',
          details: { required: options.minimumTrustLevel, actual: trustLevel }
        };
      }

      return {
        isValid: true,
        trustLevel,
        verifiedAt: new Date(),
        details: {
          proofType: proof.type,
          verificationMethod: 'full',
          claims: proof.claims
        }
      };

    } catch (error) {
      return {
        isValid: false,
        reason: `Verification error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async verifyProofStructure(proof: CredentialProof): Promise<VerificationResult> {
    // Verify required fields
    const requiredFields = ['type', 'issuer', 'subject', 'claims', 'proofData', 'timestamp'];
    const missingFields = requiredFields.filter(field => !proof[field as keyof CredentialProof]);

    if (missingFields.length > 0) {
      return {
        isValid: false,
        reason: 'Missing required fields',
        details: { missingFields }
      };
    }

    // Verify proof data structure
    if (!proof.proofData.zkProof || !proof.proofData.publicInputs) {
      return {
        isValid: false,
        reason: 'Invalid proof data structure',
        details: { missingFields: ['zkProof', 'publicInputs'] }
      };
    }

    return { isValid: true };
  }

  private async verifyCryptographicProof(proof: CredentialProof): Promise<VerificationResult> {
    try {
      // This would integrate with the actual ZK proof verification
      // For now, we simulate the verification process
      
      const publicInputs = proof.proofData.publicInputs;
      const zkProof = proof.proofData.zkProof;

      // Verify that public inputs match the claims
      const claimsHash = this.hashClaims(proof.claims);
      if (publicInputs.claimsHash !== claimsHash) {
        return {
          isValid: false,
          reason: 'Claims hash mismatch',
          details: { expected: claimsHash, actual: publicInputs.claimsHash }
        };
      }

      // Verify ZK proof (simplified - real implementation would use circom/snarkjs)
      const isProofValid = await this.verifyZKProof(zkProof, publicInputs);
      if (!isProofValid) {
        return {
          isValid: false,
          reason: 'Invalid ZK proof',
          details: { proofType: proof.type }
        };
      }

      return { isValid: true };

    } catch (error) {
      return {
        isValid: false,
        reason: `Cryptographic verification failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async verifyMetadata(proof: CredentialProof, context: VerificationContext): Promise<VerificationResult> {
    // Verify issuer is trusted
    if (!context.trustedIssuers.includes(proof.issuer)) {
      return {
        isValid: false,
        reason: 'Untrusted issuer',
        details: { issuer: proof.issuer, trustedIssuers: context.trustedIssuers }
      };
    }

    // Verify subject matches expected identity
    if (context.expectedSubject && proof.subject !== context.expectedSubject) {
      return {
        isValid: false,
        reason: 'Subject mismatch',
        details: { expected: context.expectedSubject, actual: proof.subject }
      };
    }

    // Verify credential type is acceptable
    if (context.acceptableTypes && !context.acceptableTypes.includes(proof.type)) {
      return {
        isValid: false,
        reason: 'Unacceptable credential type',
        details: { type: proof.type, acceptable: context.acceptableTypes }
      };
    }

    return { isValid: true };
  }

  private async verifyFreshness(proof: CredentialProof, maxAgeInDays: number): Promise<VerificationResult> {
    const proofAge = (Date.now() - proof.timestamp) / (1000 * 60 * 60 * 24);
    
    if (proofAge > maxAgeInDays) {
      return {
        isValid: false,
        reason: 'Proof too old',
        details: { ageInDays: proofAge, maxAge: maxAgeInDays }
      };
    }

    return { isValid: true };
  }

  private async calculateTrustLevel(proof: CredentialProof, context: VerificationContext): Promise<number> {
    let trustLevel = 0;

    // Base trust from issuer reputation
    const issuerTrust = context.issuerTrustLevels[proof.issuer] || 50;
    trustLevel += issuerTrust * 0.4;

    // Trust from proof complexity/claims
    const claimsComplexity = this.calculateClaimsComplexity(proof.claims);
    trustLevel += claimsComplexity * 0.3;

    // Trust from freshness
    const ageInDays = (Date.now() - proof.timestamp) / (1000 * 60 * 60 * 24);
    const freshnessFactor = Math.max(0, (30 - ageInDays) / 30);
    trustLevel += freshnessFactor * 20 * 0.3;

    return Math.min(100, Math.max(0, trustLevel));
  }

  private calculateClaimsComplexity(claims: any): number {
    // Calculate complexity based on number and types of claims
    const claimCount = Object.keys(claims).length;
    const hasPrivacyPreserving = claims.privacy_level === 'high';
    const hasMultipleRepos = claims.repository_count > 1;
    
    let complexity = claimCount * 10;
    if (hasPrivacyPreserving) complexity += 20;
    if (hasMultipleRepos) complexity += 15;
    
    return Math.min(50, complexity);
  }

  private hashClaims(claims: any): string {
    // Simple hash implementation - real implementation would use cryptographic hash
    const claimsString = JSON.stringify(claims, Object.keys(claims).sort());
    return Buffer.from(claimsString).toString('hex');
  }

  private async verifyZKProof(zkProof: any, publicInputs: any): Promise<boolean> {
    // Simplified ZK proof verification
    // Real implementation would use snarkjs or similar library
    
    // Check proof structure
    if (!zkProof.pi_a || !zkProof.pi_b || !zkProof.pi_c) {
      return false;
    }

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In real implementation, this would verify against the verification key
    return true;
  }

  async batchVerifyCredentials(
    proofs: CredentialProof[],
    context: VerificationContext,
    options: CredentialVerificationOptions = {}
  ): Promise<VerificationResult[]> {
    const verificationPromises = proofs.map(proof => 
      this.verifyCredential(proof, context, options)
    );

    return Promise.all(verificationPromises);
  }

  async getVerificationSummary(results: VerificationResult[]): Promise<{
    totalVerified: number;
    totalFailed: number;
    averageTrustLevel: number;
    commonFailureReasons: string[];
  }> {
    const valid = results.filter(r => r.isValid);
    const invalid = results.filter(r => !r.isValid);

    const averageTrustLevel = valid.reduce((sum, r) => sum + (r.trustLevel || 0), 0) / valid.length || 0;

    const failureReasons = invalid.map(r => r.reason || 'Unknown error');
    const reasonCounts = failureReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as { [reason: string]: number });

    const commonFailureReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]) => reason);

    return {
      totalVerified: valid.length,
      totalFailed: invalid.length,
      averageTrustLevel,
      commonFailureReasons
    };
  }
} 