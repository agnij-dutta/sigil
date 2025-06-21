export interface VerificationResult {
  isValid: boolean;
  reason?: string;
  trustLevel?: number;
  verifiedAt?: Date;
  details?: any;
}

export interface CredentialProof {
  type: 'repository' | 'language' | 'collaboration' | 'aggregate';
  issuer: string;
  subject: string;
  claims: CredentialClaims;
  proofData: {
    zkProof: ZKProof;
    publicInputs: PublicInputs;
    verificationKey?: string;
  };
  timestamp: number;
  expiresAt?: number;
  metadata?: ProofMetadata;
}

export interface CredentialClaims {
  // Repository claims
  repository_name?: string;
  repository_owner?: string;
  commit_count?: number;
  lines_of_code_range?: {
    min: number;
    max: number;
  };
  
  // Language claims
  languages_used?: string[];
  primary_language?: string;
  language_proficiency?: { [language: string]: number };
  
  // Collaboration claims
  is_sole_contributor?: boolean;
  is_repository_owner?: boolean;
  collaborator_count?: number;
  collaboration_score?: number;
  
  // Privacy claims
  privacy_level?: 'low' | 'medium' | 'high';
  anonymization_method?: string;
  
  // Aggregate claims
  total_repositories?: number;
  total_commits?: number;
  total_lines_of_code?: number;
  active_period?: {
    start: number;
    end: number;
  };
}

export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface PublicInputs {
  claimsHash: string;
  repositoryHash?: string;
  userCommitment?: string;
  timestampRange?: {
    start: number;
    end: number;
  };
  privacyParameters?: {
    epsilon?: number;
    delta?: number;
    k_anonymity?: number;
  };
}

export interface ProofMetadata {
  circuitType: string;
  proofSystem: 'groth16' | 'plonk' | 'stark';
  securityLevel: number;
  trustedSetupHash?: string;
  generationTime?: number;
  proofSize?: number;
}

export interface VerificationContext {
  trustedIssuers: string[];
  expectedSubject?: string;
  acceptableTypes?: string[];
  issuerTrustLevels: { [issuer: string]: number };
  verificationTime: number;
  networkId?: string;
  requirements?: VerificationRequirements;
}

export interface VerificationRequirements {
  minimumCommits?: number;
  minimumLinesOfCode?: number;
  requiredLanguages?: string[];
  mustBeCollaborative?: boolean;
  mustNotBeOwner?: boolean;
  maxRepositoryAge?: number; // days
  minPrivacyLevel?: 'low' | 'medium' | 'high';
}

export interface BatchVerificationResult {
  results: VerificationResult[];
  summary: {
    totalVerified: number;
    totalFailed: number;
    averageTrustLevel: number;
    verificationTime: number;
  };
  failures: {
    reason: string;
    count: number;
    examples: string[];
  }[];
}

export interface VerificationCache {
  credentialHash: string;
  result: VerificationResult;
  cachedAt: number;
  expiresAt: number;
  contextHash: string;
}

export interface TrustScore {
  overall: number;
  components: {
    issuerTrust: number;
    proofComplexity: number;
    freshness: number;
    consistencyScore: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

export interface VerificationAuditLog {
  verificationId: string;
  timestamp: number;
  credentialHash: string;
  verifierAddress: string;
  result: VerificationResult;
  context: VerificationContext;
  computationTime: number;
  gasUsed?: number;
} 