// Comprehensive credential type definitions for Sigil ZK credentials
export interface BaseCredential {
  type: string;
  version: string;
  issuer: string;
  subject: string;
  issuedAt: number;
  expiresAt?: number;
  metadata?: CredentialMetadata;
}

export interface CredentialMetadata {
  privacyLevel: 'low' | 'medium' | 'high';
  generationMethod: 'zk-snark' | 'zk-stark' | 'bulletproof';
  circuitHash: string;
  proofSystem: 'groth16' | 'plonk' | 'stark';
  trustedSetupVersion?: string;
  compressionLevel?: number;
}

export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: 'groth16' | 'plonk' | 'stark';
  curve: 'bn128' | 'bls12-381' | 'bls12-377';
  publicSignals?: string[];
}

// Repository Credential Types
export interface RepositoryCredential extends BaseCredential {
  type: 'repository';
  claims: RepositoryClaims;
  proof: ZKProof;
}

export interface RepositoryClaims {
  repositoryHash: string;
  commitCountRange: RangeProof;
  locRange: RangeProof;
  isPrivateRepo: boolean;
  collaboratorCount: number;
  userIsOwner: boolean;
  userIsSoleContributor: boolean;
  repositoryAge: number; // days
  lastActivityAge: number; // days
  primaryLanguage?: string;
  languages: string[];
  qualityScore: number; // 0-100
}

// Language Credential Types
export interface LanguageCredential extends BaseCredential {
  type: 'language';
  claims: LanguageClaims;
  proof: ZKProof;
}

export interface LanguageClaims {
  languagesUsed: string[];
  primaryLanguage: string;
  proficiencyLevels: Record<string, ProficiencyLevel>;
  totalProjects: number;
  experienceYears: number;
  codeComplexity: ComplexityMetrics;
  learningVelocity: number;
  expertiseDepth: Record<string, number>;
}

export interface ProficiencyLevel {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // 0-1
  locWritten: RangeProof;
  projectsCount: number;
  yearsExperience: number;
  complexityHandled: number;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: RangeProof;
  cognitiveComplexity: RangeProof;
  maintainabilityIndex: RangeProof;
  technicalDebt: RangeProof;
}

// Collaboration Credential Types
export interface CollaborationCredential extends BaseCredential {
  type: 'collaboration';
  claims: CollaborationClaims;
  proof: ZKProof;
}

export interface CollaborationClaims {
  teamSizeRange: RangeProof;
  collaborationDuration: RangeProof; // days
  contributionDistribution: ContributionDistribution;
  leadershipRole: boolean;
  mentorshipActivities: MentorshipMetrics;
  codeReviewParticipation: CodeReviewMetrics;
  communicationScore: number; // 0-100
  teamDiversityScore: number; // 0-100
}

export interface ContributionDistribution {
  userContributionPercentage: RangeProof;
  isBalancedTeam: boolean;
  dominanceScore: number; // 0-1, lower is better
  collaborationFrequency: number;
}

export interface MentorshipMetrics {
  menteeCount: RangeProof;
  knowledgeSharing: number; // 0-100
  helpfulnessScore: number; // 0-100
  documentationContributions: number;
}

export interface CodeReviewMetrics {
  reviewsGiven: RangeProof;
  reviewsReceived: RangeProof;
  reviewQuality: number; // 0-100
  responseTime: RangeProof; // hours
  approvalRate: number; // 0-1
}

// Aggregate Credential Types
export interface AggregateCredential extends BaseCredential {
  type: 'aggregate';
  claims: AggregateClaims;
  proof: ZKProof;
  subCredentials: string[]; // Hashes of component credentials
}

export interface AggregateClaims {
  totalRepositories: RangeProof;
  totalCommits: RangeProof;
  totalLOC: RangeProof;
  activeYears: number;
  consistencyScore: number; // 0-100
  diversityScore: number; // 0-100
  qualityScore: number; // 0-100
  collaborationScore: number; // 0-100
  reputationScore: number; // 0-1000
  skillBreadth: SkillBreadthMetrics;
  careerProgression: CareerProgressionMetrics;
}

export interface SkillBreadthMetrics {
  languageCount: number;
  frameworkCount: number;
  domainCount: number;
  complexityRange: RangeProof;
  adaptabilityScore: number; // 0-100
}

export interface CareerProgressionMetrics {
  skillGrowthRate: number;
  responsibilityGrowth: number;
  leadershipProgression: number;
  mentorshipGrowth: number;
  consistencyOverTime: number;
}

// Consistency Credential Types
export interface ConsistencyCredential extends BaseCredential {
  type: 'consistency';
  claims: ConsistencyClaims;
  proof: ZKProof;
}

export interface ConsistencyClaims {
  activityPeriods: ActivityPeriod[];
  consistencyIndex: number; // 0-100
  sustainabilityScore: number; // 0-100
  burnoutResistance: number; // 0-100
  qualityTrend: TrendMetrics;
  velocityTrend: TrendMetrics;
  learningConsistency: number; // 0-100
}

export interface ActivityPeriod {
  startDate: number;
  endDate: number;
  commitFrequency: number;
  qualityMaintained: boolean;
  skillDevelopment: boolean;
}

export interface TrendMetrics {
  direction: 'improving' | 'stable' | 'declining';
  magnitude: number; // 0-1
  confidence: number; // 0-1
  timespan: number; // days
}

// Diversity Credential Types
export interface DiversityCredential extends BaseCredential {
  type: 'diversity';
  claims: DiversityClaims;
  proof: ZKProof;
}

export interface DiversityClaims {
  languageDiversity: DiversityMetrics;
  projectTypeDiversity: DiversityMetrics;
  organizationDiversity: DiversityMetrics;
  roleDiversity: DiversityMetrics;
  adaptabilityScore: number; // 0-100
  learningAgility: number; // 0-100
}

export interface DiversityMetrics {
  count: number;
  distribution: number[]; // Distribution percentages
  shannonEntropy: number; // Diversity index
  giniCoefficient: number; // Inequality measure
}

// Leadership Credential Types
export interface LeadershipCredential extends BaseCredential {
  type: 'leadership';
  claims: LeadershipClaims;
  proof: ZKProof;
}

export interface LeadershipClaims {
  teamLeadExperience: RangeProof; // months
  projectsLed: RangeProof;
  teamSizesManaged: RangeProof[];
  decisionMakingScore: number; // 0-100
  architecturalInfluence: number; // 0-100
  mentorshipImpact: MentorshipImpact;
  technicalVisionScore: number; // 0-100
  stakeholderManagement: number; // 0-100
}

export interface MentorshipImpact {
  developersInfluenced: RangeProof;
  knowledgeTransferScore: number; // 0-100
  careerAdvancementEnabled: number;
  documentationCreated: RangeProof;
  processImprovements: number;
}

// Utility Types
export interface RangeProof {
  min: number;
  max: number;
  actualValue?: number; // Only for internal use, not in proofs
  proofType: 'range' | 'membership' | 'comparison';
}

// Credential Status Types
export type CredentialStatus = 
  | 'pending'
  | 'generating'
  | 'ready'
  | 'expired'
  | 'revoked'
  | 'invalid';

// Credential Request Types
export interface CredentialRequest {
  type: string;
  subjectId: string;
  requestedClaims: string[];
  privacyLevel: 'low' | 'medium' | 'high';
  expirationDays?: number;
  includeMetadata: boolean;
  proofSystem?: 'groth16' | 'plonk' | 'stark';
}

// Credential Response Types
export interface CredentialResponse {
  credential: BaseCredential;
  status: CredentialStatus;
  generationTime: number; // milliseconds
  proofSize: number; // bytes
  verificationKey: string;
  error?: string;
}

// Batch Operations
export interface BatchCredentialRequest {
  requests: CredentialRequest[];
  batchId: string;
  priority: 'low' | 'normal' | 'high';
  parallelGeneration: boolean;
}

export interface BatchCredentialResponse {
  batchId: string;
  credentials: CredentialResponse[];
  overallStatus: 'completed' | 'partial' | 'failed';
  totalGenerationTime: number;
  successCount: number;
  failureCount: number;
}

// Verification Types
export interface VerificationRequest {
  credential: BaseCredential;
  verificationKey: string;
  requiredClaims?: string[];
  acceptableAge?: number; // max age in seconds
}

export interface VerificationResult {
  isValid: boolean;
  claimsVerified: string[];
  claimsFailed: string[];
  trustScore: number; // 0-100
  verificationTime: number; // milliseconds
  error?: string;
}

// Export union types for easier handling
export type SigilCredential = 
  | RepositoryCredential
  | LanguageCredential
  | CollaborationCredential
  | AggregateCredential
  | ConsistencyCredential
  | DiversityCredential
  | LeadershipCredential;

export type SigilClaims = 
  | RepositoryClaims
  | LanguageClaims
  | CollaborationClaims
  | AggregateClaims
  | ConsistencyClaims
  | DiversityClaims
  | LeadershipClaims; 