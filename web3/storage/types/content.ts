/**
 * Content Type Definitions for Sigil IPFS Storage
 * Specific types for different content formats
 */

import { CID } from 'multiformats/cid'

// Base Content Interface
export interface BaseContent {
  version: string
  contentType: string
  timestamp: number
  metadata: Record<string, any>
}

// ZK Proof Content
export interface ZKProofContent extends BaseContent {
  contentType: 'zk-proof'
  circuit: {
    type: 'repository' | 'language' | 'collaboration' | 'aggregate'
    name: string
    version: string
    wasmCID: CID
    zkeyHash: string
  }
  proof: {
    pi_a: [string, string]
    pi_b: [[string, string], [string, string]]
    pi_c: [string, string]
    protocol: string
    curve: string
  }
  publicSignals: string[]
  verificationKey: any
  metadata: {
    proverAddress: string
    circuitHash: string
    provingTime: number
    constraints: number
    proofSize: number
  }
}

// Verifiable Credential Content
export interface VerifiableCredentialContent extends BaseContent {
  contentType: 'verifiable-credential'
  '@context': string[]
  type: string[]
  issuer: string | {
    id: string
    name?: string
    type?: string
  }
  issuanceDate: string
  expirationDate?: string
  credentialSubject: {
    id: string
    type: string
    claims: CredentialClaims
  }
  proof: CredentialProof
}

export interface CredentialClaims {
  // Repository-related claims
  repositoryContributions?: {
    totalRepositories: number
    commitCountRange: [number, number]
    locRange: [number, number]
    collaborationEvidence: boolean
    ownershipStatus: 'non-owner' | 'contributor' | 'maintainer'
  }
  
  // Language proficiency claims
  programmingLanguages?: Array<{
    language: string
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    yearsOfExperience: number
    projectCount: number
  }>
  
  // Collaboration claims
  teamworkEvidence?: {
    averageTeamSize: number
    leadershipRoles: string[]
    mentorshipEvidence: boolean
    crossFunctionalExperience: boolean
  }
  
  // Temporal consistency claims
  contributionConsistency?: {
    activePeriods: Array<{
      start: string
      end: string
      intensity: 'low' | 'medium' | 'high'
    }>
    consistencyScore: number
    longestActiveStreak: number
  }
}

export interface CredentialProof {
  type: 'ZKProof'
  created: string
  verificationMethod: string
  proofValue: string
  zkProofCID: CID
  verifierContract: string
}

// Aggregated Developer Profile
export interface DeveloperProfileContent extends BaseContent {
  contentType: 'developer-profile'
  subject: string
  profile: {
    identity: {
      walletAddress: string
      pseudonym?: string
      publicKey: string
    }
    reputation: {
      overallScore: number
      components: {
        technical: number
        collaboration: number
        consistency: number
        leadership: number
      }
      endorsements: Endorsement[]
    }
    skills: SkillAssessment[]
    experience: ExperienceRecord[]
    achievements: Achievement[]
    privacyLevel: 'minimal' | 'balanced' | 'maximum'
  }
}

export interface Endorsement {
  issuer: string
  skill: string
  level: number
  timestamp: number
  proofCID?: CID
}

export interface SkillAssessment {
  category: 'programming' | 'framework' | 'tool' | 'domain'
  name: string
  proficiency: 'novice' | 'competent' | 'proficient' | 'expert' | 'master'
  evidence: {
    projectCount: number
    locWritten: number
    yearsActive: number
    certifications: string[]
  }
  lastAssessed: number
}

export interface ExperienceRecord {
  type: 'open-source' | 'commercial' | 'academic' | 'personal'
  role: string
  duration: {
    start: number
    end?: number
  }
  technologies: string[]
  achievements: string[]
  privacyPreserving: boolean
}

export interface Achievement {
  type: 'contribution' | 'collaboration' | 'innovation' | 'leadership'
  title: string
  description: string
  dateAchieved: number
  evidenceCID?: CID
  verificationContract?: string
}

// Circuit Definition Content
export interface CircuitDefinitionContent extends BaseContent {
  contentType: 'circuit-definition'
  circuit: {
    name: string
    version: string
    description: string
    parameters: CircuitParameters
    constraints: number
    variables: number
    outputs: number
  }
  files: {
    source: CID // .circom file
    wasm: CID // compiled WebAssembly
    zkey: CID // proving key
    vkey: any // verification key (JSON)
  }
  security: {
    trustedSetup: TrustedSetupInfo
    auditReports: AuditReport[]
    securityLevel: number
  }
  usage: {
    totalProofs: number
    averageProvingTime: number
    lastUsed: number
  }
}

export interface CircuitParameters {
  maxCommits: number
  maxLanguages: number
  maxCollaborators: number
  merkleTreeDepth: number
  rangeProofBits: number
}

export interface TrustedSetupInfo {
  ceremony: string
  participants: number
  date: number
  coordinator: string
  verification: {
    verified: boolean
    verifierSignature: string
  }
}

export interface AuditReport {
  auditor: string
  date: number
  version: string
  reportCID: CID
  findings: {
    critical: number
    high: number
    medium: number
    low: number
  }
  status: 'passed' | 'failed' | 'conditional'
}

// Repository Metadata (Privacy-Preserving)
export interface RepositoryMetadataContent extends BaseContent {
  contentType: 'repository-metadata'
  repository: {
    hash: string // Privacy-preserving identifier
    metadata: {
      languages: string[]
      framework: string[]
      size: 'small' | 'medium' | 'large' | 'enterprise'
      type: 'library' | 'application' | 'tool' | 'documentation'
      license: string
      maturity: 'experimental' | 'beta' | 'stable' | 'mature'
    }
    collaboration: {
      teamSize: number
      roles: string[]
      contributionDistribution: 'balanced' | 'dominated' | 'concentrated'
      mergeRequestCulture: boolean
      codeReviewProcess: boolean
    }
    timeline: {
      firstCommit: number
      lastCommit: number
      peakActivity: number
      developmentPhases: Array<{
        phase: 'inception' | 'development' | 'maintenance' | 'deprecated'
        start: number
        end?: number
      }>
    }
  }
  privacy: {
    k: number // k-anonymity level
    noiseLevel: number // differential privacy noise
    hashedIdentifiers: string[]
  }
}

// Collaboration Evidence
export interface CollaborationEvidenceContent extends BaseContent {
  contentType: 'collaboration-evidence'
  evidence: {
    multiAuthorCommits: {
      count: number
      coAuthorshipPatterns: string[]
      reviewParticipation: number
    }
    teamInteractions: {
      codeReviews: number
      discussions: number
      issueCollaboration: number
      pairProgrammingEvidence: boolean
    }
    leadershipIndicators: {
      mentoring: boolean
      architecturalDecisions: number
      conflictResolution: number
      projectInitiation: boolean
    }
    knowledgeSharing: {
      documentation: number
      codeComments: number
      tutorialContributions: number
      communityParticipation: number
    }
  }
  anonymization: {
    collaboratorIds: string[] // Hashed
    interactionPatterns: string[]
    temporalMasking: boolean
  }
}

// Privacy-Preserving Analytics
export interface AnalyticsContent extends BaseContent {
  contentType: 'analytics'
  analytics: {
    global: GlobalMetrics
    cohort: CohortMetrics
    trends: TrendAnalysis
    benchmarks: BenchmarkData
  }
  privacy: {
    aggregationLevel: number
    noiseParameters: {
      epsilon: number
      delta: number
      sensitivity: number
    }
    kAnonymity: number
  }
}

export interface GlobalMetrics {
  totalDevelopers: number
  averageExperience: number
  languageDistribution: Record<string, number>
  collaborationPatterns: Record<string, number>
  qualityMetrics: {
    averageCodeQuality: number
    testCoverageRanges: Record<string, number>
    documentationQuality: number
  }
}

export interface CohortMetrics {
  experienceLevel: 'junior' | 'mid' | 'senior' | 'principal'
  cohortSize: number
  skillProgression: SkillProgressionData
  careerTrajectory: CareerTrajectoryData
  retentionMetrics: RetentionData
}

export interface SkillProgressionData {
  averageProgressionRate: number
  commonSkillPaths: string[][]
  specializations: string[]
  crossTrainingEvidence: boolean
}

export interface CareerTrajectoryData {
  averageTenure: number
  promotionPatterns: string[]
  responsibilityGrowth: boolean
  leadershipDevelopment: boolean
}

export interface RetentionData {
  activeContribution: boolean
  communityEngagement: number
  projectLongevity: number
  knowledgeRetention: number
}

export interface TrendAnalysis {
  emergingTechnologies: string[]
  decliningTechnologies: string[]
  skillDemand: Record<string, number>
  collaborationEvolution: {
    remoteCCollaboration: number
    crossTimezoneWork: number
    asynchronousPatterns: number
  }
}

export interface BenchmarkData {
  industryComparisons: Record<string, number>
  skillBenchmarks: Record<string, {
    percentile: number
    category: string
    benchmark: number
  }>
  collaborationBenchmarks: {
    teamEffectiveness: number
    communicationQuality: number
    conflictResolution: number
  }
}

// Content Validation
export interface ContentValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  checksum: string
  signature?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Content Indexing
export interface ContentIndex {
  contentType: string
  tags: string[]
  searchableFields: Record<string, any>
  relationships: ContentRelationship[]
  accessLevel: 'public' | 'private' | 'restricted'
}

export interface ContentRelationship {
  type: 'references' | 'extends' | 'validates' | 'supersedes'
  targetCID: CID
  relationship: string
} 