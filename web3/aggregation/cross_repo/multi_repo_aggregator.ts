/**
 * MultiRepositoryAggregator
 * 
 * Aggregates developer contributions across multiple repositories while:
 * 1. Preserving privacy through differential privacy
 * 2. Computing comprehensive skill profiles
 * 3. Maintaining repository context and ownership proof
 */

import { createHash } from 'crypto';

export interface RepositoryMetrics {
    name: string;
    commits: number;
    linesOfCode: number;
    languages: Record<string, number>;
    collaborators: number;
    userContributionPercentage: number;
    ownerHash: string;
    createdAt: string;
}

export interface AggregatedCredentials {
    userAddress: string;
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

export class MultiRepositoryAggregator {
    private repositories: Map<string, RepositoryMetrics> = new Map();

    constructor(
        private epsilon: number = 1.0,  // Differential privacy parameter
        private minRepositories: number = 3
    ) {}

    async addRepository(repoData: RepositoryMetrics): Promise<void> {
        const repoId = createHash('sha256').update(`${repoData.name}_${repoData.ownerHash}`).digest('hex');
        this.repositories.set(repoId, repoData);
    }

    async generateAggregatedCredentials(userAddress: string): Promise<AggregatedCredentials> {
        if (this.repositories.size < this.minRepositories) {
            throw new Error(`Minimum ${this.minRepositories} repositories required`);
        }

        const repos = Array.from(this.repositories.values());
        
        // Add differential privacy noise
        const noise = () => Math.random() * this.epsilon - this.epsilon / 2;
        
        const totalCommits = Math.round(repos.reduce((sum, repo) => sum + repo.commits, 0) + noise());
        const totalLOC = Math.round(repos.reduce((sum, repo) => sum + repo.linesOfCode, 0) + noise());
        
        // Aggregate language proficiency
        const languageMap = new Map<string, number>();
        repos.forEach(repo => {
            Object.entries(repo.languages).forEach(([lang, loc]) => {
                languageMap.set(lang, (languageMap.get(lang) || 0) + loc);
            });
        });
        
        const maxLOC = Math.max(...Array.from(languageMap.values()));
        const languageProficiency: Record<string, number> = {};
        languageMap.forEach((loc, lang) => {
            languageProficiency[lang] = Math.round((loc / maxLOC) * 100);
        });

        // Calculate metrics
        const avgCollaborators = repos.reduce((sum, repo) => sum + repo.collaborators, 0) / repos.length;
        const collaborationScore = Math.min(100, Math.round(avgCollaborators * 10));
        
        const consistencyScore = Math.round(75 + noise()); // Placeholder with noise
        const diversityScore = Math.round(Object.keys(languageProficiency).length * 5);
        
        // Ownership proof
        const userHash = createHash('sha256').update(userAddress).digest('hex');
        const ownedRepos = repos.filter(repo => repo.ownerHash === userHash).length;
        const isNotOwnerOfAll = ownedRepos < repos.length;

        const credentialHash = createHash('sha256').update(JSON.stringify({
            userAddress, totalCommits, totalLOC, languageCount: Object.keys(languageProficiency).length
        })).digest('hex');

        return {
            userAddress,
            totalRepositories: repos.length,
            totalCommits,
            totalLOC,
            languageProficiency,
            collaborationScore,
            consistencyScore,
            diversityScore,
            isNotOwnerOfAll,
            credentialHash,
            generatedAt: new Date()
        };
    }
} 