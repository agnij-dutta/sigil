/**
 * Aggregation System Types
 * 
 * Comprehensive type definitions for multi-repository data aggregation,
 * privacy-preserving analysis, and credential generation in the Sigil system.
 */

import { RepositoryData, CommitData, LanguageData } from '../../types/index.js';

// ============================================================================
// Core Aggregation Types
// ============================================================================

export interface AggregationConfig {
    minRepositories: number;
    maxRepositories: number;
    privacyLevel: 'low' | 'medium' | 'high';
    differentialPrivacyEpsilon: number;
    kAnonymityK: number;
    timeWindowDays: number;
    enableCaching: boolean;
    validationStrict: boolean;
}

export interface AggregationContext {
    userAddress: string;
    githubUsername: string;
    analysisTimestamp: Date;
    repositories: RepositoryData[];
    config: AggregationConfig;
    sessionId: string;
}

// ============================================================================
// Repository Analysis Types
// ============================================================================

export interface RepositoryAnalysis {
    repositoryId: string;
    name: string;
    owner: string;
    analysis: {
        commits: CommitAnalysis;
        languages: LanguageAnalysis;
        collaboration: CollaborationAnalysis;
        consistency: ConsistencyAnalysis;
        ownership: OwnershipAnalysis;
    };
    privacy: {
        noisyMetrics: Record<string, number>;
        anonymizedData: any;
        privacyScore: number;
    };
    generatedAt: Date;
}

export interface CommitAnalysis {
    totalCommits: number;
    averageCommitsPerWeek: number;
    commitFrequency: number[];
    largestCommit: number;
    averageCommitSize: number;
    commitMessageQuality: number;
    timeDistribution: {
        hourly: number[];
        daily: number[];
        monthly: number[];
    };
}

export interface LanguageAnalysis {
    primaryLanguage: string;
    languageDistribution: Record<string, number>;
    complexityScore: number;
    frameworkUsage: string[];
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    trendinessScore: number;
}

export interface CollaborationAnalysis {
    collaboratorCount: number;
    isOwner: boolean;
    contributionPercentage: number;
    leadershipScore: number;
    mentorshipIndicators: number;
    teamworkScore: number;
    communicationScore: number;
}

export interface ConsistencyAnalysis {
    consistencyScore: number;
    activityPattern: 'regular' | 'sporadic' | 'intensive' | 'declining';
    longestStreak: number;
    averageGapDays: number;
    seasonalityScore: number;
    burnoutRisk: number;
}

export interface OwnershipAnalysis {
    isOwner: boolean;
    ownershipPercentage: number;
    maintenanceScore: number;
    governanceParticipation: number;
    ownershipHash: string;
}

// ============================================================================
// Cross-Repository Aggregation Types
// ============================================================================

export interface CrossRepoAggregation {
    userAddress: string;
    repositoryCount: number;
    aggregatedMetrics: {
        commits: AggregatedCommitMetrics;
        languages: AggregatedLanguageMetrics;
        collaboration: AggregatedCollaborationMetrics;
        consistency: AggregatedConsistencyMetrics;
        diversity: AggregatedDiversityMetrics;
        proficiency: AggregatedProficiencyMetrics;
    };
    privacyMetrics: {
        noiseLevel: number;
        anonymityLevel: number;
        privacyBudgetUsed: number;
    };
    credentialHashes: string[];
    generatedAt: Date;
}

export interface AggregatedCommitMetrics {
    totalCommits: number;
    averageCommitsPerRepo: number;
    commitVelocity: number;
    codeQualityScore: number;
    productivityScore: number;
    impactScore: number;
}

export interface AggregatedLanguageMetrics {
    languageCount: number;
    primaryLanguages: string[];
    languageProficiency: Record<string, number>;
    versatilityScore: number;
    modernityScore: number;
    specializationScore: number;
}

export interface AggregatedCollaborationMetrics {
    totalCollaborators: number;
    averageTeamSize: number;
    leadershipScore: number;
    mentorshipScore: number;
    collaborationEffectiveness: number;
    networkInfluence: number;
}

export interface AggregatedConsistencyMetrics {
    overallConsistency: number;
    reliabilityScore: number;
    commitmentLevel: number;
    professionalismScore: number;
    sustainabilityScore: number;
}

export interface AggregatedDiversityMetrics {
    projectDiversity: number;
    domainDiversity: number;
    technicalBreadth: number;
    innovationScore: number;
    adaptabilityScore: number;
}

export interface AggregatedProficiencyMetrics {
    overallProficiency: number;
    expertiseDepth: number;
    skillGrowthRate: number;
    technicalLeadership: number;
    industryRelevance: number;
}

// ============================================================================
// Privacy-Preserving Types
// ============================================================================

export interface PrivacyPreservingAggregation {
    originalData: any;
    noisyData: any;
    privacyParameters: {
        epsilon: number;
        delta: number;
        sensitivity: number;
        noiseDistribution: 'laplace' | 'gaussian';
    };
    anonymizationLevel: number;
    privacyGuarantees: string[];
}

export interface DifferentialPrivacyConfig {
    epsilon: number;
    delta: number;
    sensitivity: number;
    mechanism: 'laplace' | 'gaussian' | 'exponential';
    clampingBounds: [number, number];
}

export interface KAnonymityConfig {
    k: number;
    quasiIdentifiers: string[];
    sensitiveAttributes: string[];
    suppressionThreshold: number;
    generalizationLevels: Record<string, number>;
}

// ============================================================================
// Validation and Quality Types
// ============================================================================

export interface AggregationValidation {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    qualityScore: number;
    completenessScore: number;
    consistencyScore: number;
}

export interface ValidationError {
    code: string;
    message: string;
    field: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedFix?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    field: string;
    impact: 'minimal' | 'moderate' | 'significant';
    recommendation?: string;
}

// ============================================================================
// Storage and Caching Types
// ============================================================================

export interface AggregationCache {
    key: string;
    data: any;
    metadata: {
        createdAt: Date;
        expiresAt: Date;
        accessCount: number;
        lastAccessed: Date;
        size: number;
        version: string;
    };
    tags: string[];
}

export interface StorageConfig {
    provider: 'memory' | 'redis' | 'ipfs' | 'arweave';
    ttl: number;
    maxSize: number;
    compression: boolean;
    encryption: boolean;
    replication: number;
}

// ============================================================================
// Credential Generation Types
// ============================================================================

export interface CredentialTemplate {
    type: 'repository' | 'language' | 'collaboration' | 'consistency' | 'diversity' | 'proficiency';
    version: string;
    schema: any;
    requiredFields: string[];
    optionalFields: string[];
    validationRules: ValidationRule[];
}

export interface ValidationRule {
    field: string;
    type: 'range' | 'enum' | 'pattern' | 'custom';
    constraint: any;
    errorMessage: string;
}

export interface GeneratedCredential {
    id: string;
    type: string;
    userAddress: string;
    claims: Record<string, any>;
    proof: {
        circuit: string;
        publicInputs: any[];
        proof: any;
        verificationKey: any;
    };
    metadata: {
        issuedAt: Date;
        expiresAt?: Date;
        issuer: string;
        version: string;
        privacyLevel: string;
    };
    signature: string;
}

// ============================================================================
// Event and Monitoring Types
// ============================================================================

export interface AggregationEvent {
    eventId: string;
    type: 'start' | 'progress' | 'complete' | 'error' | 'warning';
    timestamp: Date;
    userAddress: string;
    stage: string;
    data: any;
    duration?: number;
    error?: Error;
}

export interface AggregationMetrics {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    errorRate: number;
    cacheHitRate: number;
    privacyBudgetUsage: number;
    resourceUtilization: {
        cpu: number;
        memory: number;
        storage: number;
    };
}

// ============================================================================
// Export All Types
// ============================================================================

export * from './aggregation.js';
export * from './privacy.js';
export * from './validation.js';
export * from './storage.js'; 