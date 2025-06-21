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

// Additional types needed by circuits and web3 components
export interface CommitData {
    sha: string;
    author: string;
    message: string;
    timestamp: Date;
    additions: number;
    deletions: number;
    files: string[];
    url?: string;
    authorEmail?: string;
}

export interface CollaboratorData {
    login: string;
    id: number;
    contributions: number;
    role: string;
    permissions: string[];
    joinedAt?: Date;
}

export interface RepositoryData {
    name: string;
    owner: string;
    fullName: string;
    description?: string;
    url: string;
    isPrivate: boolean;
    createdAt: string;
    language?: string;
    languages?: Record<string, number>;
    stargazersCount: number;
    forksCount: number;
    commits?: CommitData[];
    collaborators?: CollaboratorData[];
    totalLOC?: number;
    branches?: string[];
}

export interface LanguageData {
    language: string;
    linesOfCode: number;
    fileCount: number;
    percentage: number;
    proficiencyLevel: number;
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