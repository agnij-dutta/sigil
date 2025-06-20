/**
 * Core Types for Sigil Credential System
 */

export interface GitHubRepository {
    name: string;
    owner: string;
    url: string;
    isPrivate: boolean;
    createdAt: string;
}

export interface RepositoryMetrics {
    repository: GitHubRepository;
    commits: number;
    linesOfCode: number;
    languages: Record<string, number>;
    collaborators: number;
    userContributionPercentage: number;
    ownerHash: string;
}

export interface LanguageProficiency {
    language: string;
    totalLOC: number;
    proficiencyScore: number;
    repositoryCount: number;
}

export interface ZKProofData {
    circuitName: string;
    proof: string;
    publicSignals: string[];
    verificationKey: string;
    proofTimestamp: number;
}

export interface RangeProof {
    minValue: number;
    maxValue: number;
    proof: ZKProofData;
}

export interface AggregatedCredentials {
    userAddress: string;
    skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
    totalRepositories: number;
    totalCommits: number;
    totalLOC: number;
    languageProficiency: Record<string, number>;
    collaborationScore: number;
    consistencyScore: number;
    diversityScore: number;
    isNotOwnerOfAll: boolean;
    credentialHash: string;
    generatedAt: Date;
}

export type SkillLevel = 'junior' | 'mid' | 'senior' | 'expert';
export type PrivacyLevel = 'minimal' | 'standard' | 'high' | 'maximum'; 