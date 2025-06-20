/**
 * Comprehensive Type Definitions for Sigil Credential System
 * 
 * Defines all types for the advanced ZK-based developer credential system
 * supporting dynamic language proofs, repository context, collaboration verification,
 * and privacy-preserving aggregation across multiple repositories.
 */

// ============= CORE TYPES =============

export interface UserIdentity {
    address: string;                    // Ethereum address
    githubUsername?: string;            // Optional GitHub username
    publicKey: string;                  // Public key for signature verification
}

export interface GitHubRepository {
    name: string;                       // Repository name
    owner: string;                      // Repository owner
    url: string;                        // GitHub URL
    isPrivate: boolean;                 // Private repository flag
    createdAt: string;                  // Creation timestamp
    lastUpdated: string;                // Last update timestamp
}

// ============= REPOSITORY METRICS =============

export interface RepositoryMetrics {
    repository: GitHubRepository;
    commits: number;                    // Total commits by user
    linesOfCode: number;                // Total LOC contributed
    languages: Record<string, number>;  // Language -> LOC mapping
    collaborators: number;              // Number of collaborators
    userContributionPercentage: number; // User's contribution percentage
    ownerHash: string;                  // Hashed owner identity
    commits_timeline: CommitTimeline;   // Time-based commit data
    codeQualityMetrics: CodeQualityMetrics;
}

export interface CommitTimeline {
    commitsByMonth: Record<string, number>; // "YYYY-MM" -> commit count
    consistencyScore: number;               // 0-100 consistency rating
    longestStreak: number;                  // Longest commit streak (days)
    totalActiveMonths: number;              // Months with commits
}

export interface CodeQualityMetrics {
    averageCommitSize: number;          // Average LOC per commit
    testCoverage?: number;              // Test coverage percentage if available
    documentationRatio?: number;        // Documentation/code ratio
    codeComplexity?: number;            // Average code complexity
}

// ============= LANGUAGE ANALYSIS =============

export interface LanguageProficiency {
    language: string;                   // Programming language name
    totalLOC: number;                   // Total lines of code
    proficiencyScore: number;           // 0-100 proficiency rating
    repositoryCount: number;            // Repositories using this language
    averageComplexity?: number;         // Average code complexity
    recentUsage: boolean;               // Used in last 6 months
}

export interface DynamicLanguageProof {
    languageCount: number;              // Number of languages claimed
    languages: LanguageProficiency[];   // Language proficiency details
    diversityScore: number;             // Language diversity rating
    polyglotLevel: 'beginner' | 'intermediate' | 'senior' | 'polyglot';
}

// ============= COLLABORATION ANALYSIS =============

export interface CollaborationMetrics {
    averageTeamSize: number;            // Average collaborators per project
    soloProjectRatio: number;           // Percentage of solo projects
    leadershipScore: number;            // Leadership activity rating
    mentorshipScore: number;            // Mentoring activity rating
    communicationScore: number;         // PR/issue communication rating
    crossTeamCollaboration: number;     // Working with different teams
}

export interface TeamDiversityMetrics {
    uniqueCollaborators: number;        // Total unique collaborators
    organizationDiversity: number;      // Different organizations worked with
    geographicDiversity?: number;       // Geographic distribution score
    experienceLevelDiversity: number;   // Mix of junior/senior collaborators
}

// ============= PRIVACY & PROOF TYPES =============

export interface PrivacySettings {
    differentialPrivacyEpsilon: number; // DP privacy parameter
    kAnonymity: number;                 // k-anonymity level
    hideExactNumbers: boolean;          // Use ranges instead of exact values
    aggregationLevel: 'repository' | 'language' | 'full';
}

export interface ZKProofData {
    circuitName: string;                // Name of the circuit used
    proof: string;                      // ZK proof (hex string)
    publicSignals: string[];            // Public inputs to the circuit
    verificationKey: string;            // Verification key
    proofTimestamp: number;             // When proof was generated
}

export interface RangeProof {
    minValue: number;                   // Minimum claimed value
    maxValue: number;                   // Maximum claimed value
    actualValue?: number;               // Hidden actual value (private)
    proof: ZKProofData;                 // ZK range proof
}

// ============= CREDENTIAL TYPES =============

export interface RepositoryCredential {
    credentialId: string;               // Unique credential identifier
    userAddress: string;                // User's Ethereum address
    repository: GitHubRepository;       // Repository details
    commitProof: RangeProof;            // Commit count proof
    locProof: RangeProof;               // LOC proof
    languageProof: DynamicLanguageProof; // Language usage proof
    collaborationProof: CollaborationProof;
    ownershipProof: OwnershipProof;     // Non-ownership proof
    privacyLevel: PrivacySettings;      // Privacy configuration
    validUntil: string;                 // Expiration date
    credentialHash: string;             // Unique hash
    zkProof: ZKProofData;               // Master ZK proof
}

export interface CollaborationProof {
    isTeamProject: boolean;             // Not a solo project
    collaboratorCount: RangeProof;      // Number of collaborators
    userContributionPercent: RangeProof; // User's contribution percentage
    teamDiversityScore: number;         // Team diversity rating
    collaboratorHashes: string[];       // Anonymous collaborator IDs
    antiGamingProof: AntiGamingProof;   // Gaming prevention proof
}

export interface OwnershipProof {
    isNotOwner: boolean;                // User is not repository owner
    ownerHash: string;                  // Hashed owner identity
    ownershipProof: ZKProofData;        // Cryptographic ownership proof
}

export interface AntiGamingProof {
    repositoryAgeMinimum: number;       // Minimum repository age (days)
    organicGrowthPattern: boolean;      // Natural development pattern
    realCollaboratorProof: boolean;     // Collaborators are real users
    noDuplicateRepos: boolean;          // No duplicate repositories
    diversityRequirementsMet: boolean;  // Meets diversity requirements
}

// ============= AGGREGATED CREDENTIALS =============

export interface AggregatedCredentials {
    userAddress: string;                // User's Ethereum address
    skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
    totalRepositories: number;          // Total repositories analyzed
    totalCommits: number;               // Aggregated commit count (with DP noise)
    totalLOC: number;                   // Aggregated LOC (with DP noise)
    
    // Language Analysis
    languageProficiency: Record<string, number>; // Language -> proficiency score
    primaryLanguages: string[];         // Top 3-5 languages
    languageDiversityScore: number;     // Language diversity rating
    
    // Collaboration Analysis
    collaborationMetrics: CollaborationMetrics;
    teamDiversityMetrics: TeamDiversityMetrics;
    
    // Consistency & Growth
    consistencyScore: number;           // Development consistency rating
    growthTrajectory: 'ascending' | 'stable' | 'declining';
    experienceLevel: ExperienceLevel;
    
    // Privacy & Verification
    privacyLevel: PrivacySettings;      // Applied privacy settings
    verificationStatus: VerificationStatus;
    credentialHash: string;             // Unique credential hash
    aggregationProof: ZKProofData;      // Aggregation proof
    generatedAt: Date;                  // Generation timestamp
    validUntil: Date;                   // Expiration date
}

export interface ExperienceLevel {
    level: 'junior' | 'mid' | 'senior' | 'expert';
    yearsActive: number;                // Years of development activity
    professionalIndicators: ProfessionalIndicators;
    technicalDepth: TechnicalDepth;
}

export interface ProfessionalIndicators {
    codeReviewParticipation: number;    // Code review activity score
    documentationQuality: number;       // Documentation quality score
    issueResolutionRate: number;        // Issue resolution efficiency
    mentorshipActivity: number;         // Mentoring/helping others score
    openSourceContributions: number;    // Open source contribution score
}

export interface TechnicalDepth {
    architecturalContributions: boolean; // Made architectural decisions
    performanceOptimizations: boolean;   // Performance improvement work
    securityImplementations: boolean;    // Security-related contributions
    testingPractices: boolean;          // Testing and QA practices
    devOpsExperience: boolean;          // DevOps/infrastructure work
}

// ============= VERIFICATION & VALIDATION =============

export interface VerificationStatus {
    isVerified: boolean;                // Overall verification status
    githubVerified: boolean;            // GitHub data verified
    zkProofsValid: boolean;             // All ZK proofs valid
    aggregationValid: boolean;          // Aggregation process valid
    antiGamingChecks: boolean;          // Anti-gaming measures passed
    lastVerification: Date;             // Last verification timestamp
    verificationLevel: 'basic' | 'standard' | 'premium';
}

export interface CredentialValidation {
    credentialId: string;               // Credential being validated
    validationChecks: ValidationCheck[]; // Individual validation results
    overallStatus: 'valid' | 'invalid' | 'pending';
    validatedAt: Date;                  // Validation timestamp
    validatedBy: string;                // Validator identity
}

export interface ValidationCheck {
    checkType: string;                  // Type of validation check
    status: 'passed' | 'failed' | 'warning';
    message: string;                    // Validation message
    evidence?: any;                     // Supporting evidence
}

// ============= API & INTEGRATION TYPES =============

export interface CredentialRequest {
    userAddress: string;                // Requester's address
    repositories: string[];             // Repository URLs to analyze
    targetSkillLevel?: 'junior' | 'mid' | 'senior' | 'expert';
    privacySettings: PrivacySettings;   // Desired privacy level
    includedMetrics: string[];          // Metrics to include
    validityPeriod?: number;            // Credential validity (days)
}

export interface CredentialResponse {
    success: boolean;                   // Request success status
    credential?: AggregatedCredentials; // Generated credential
    error?: string;                     // Error message if failed
    estimatedProcessingTime?: number;   // Processing time estimate
    supportingProofs: ZKProofData[];    // Supporting ZK proofs
}

// ============= EXPORT TYPES =============

export interface CredentialExport {
    format: 'json' | 'verifiable-credential' | 'pdf' | 'nft-metadata';
    credential: AggregatedCredentials;  // Credential data
    proofs: ZKProofData[];              // Supporting proofs
    verificationInstructions: string;   // How to verify
    exportedAt: Date;                   // Export timestamp
}

// ============= UTILITY TYPES =============

export type SkillLevel = 'junior' | 'mid' | 'senior' | 'expert';
export type PrivacyLevel = 'minimal' | 'standard' | 'high' | 'maximum';
export type VerificationLevel = 'basic' | 'standard' | 'premium';
export type ProofStatus = 'valid' | 'invalid' | 'pending' | 'expired';

// Helper type for dynamic language proof templates
export type LanguageCredentialTemplate = 
    | 'BeginnerLanguageCredential'      // 2-5 languages
    | 'IntermediateLanguageCredential'  // 4-10 languages  
    | 'SeniorLanguageCredential'        // 5-20 languages
    | 'PolyglotLanguageCredential';     // 10+ languages 