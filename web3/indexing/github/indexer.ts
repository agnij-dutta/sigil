/**
 * GitHub Data Indexer
 * 
 * Extracts repository data for ZK proof generation
 */

import { RepositoryMetrics } from '../../types';
import { createHash } from 'crypto';

export interface GitHubRepo {
    name: string;
    owner: string;
    full_name: string;
    private: boolean;
    created_at: string;
    size: number;
    html_url: string;
}

export class GitHubIndexer {
    constructor(private githubToken: string) {}

    async indexUserRepositories(githubUsername: string): Promise<RepositoryMetrics[]> {
        console.log(`Indexing repositories for: ${githubUsername}`);
        
        // Mock implementation for demonstration
        // In practice, would use GitHub API
        const mockRepositories: RepositoryMetrics[] = [
            {
                repository: {
                    name: 'awesome-project',
                    owner: githubUsername,
                    url: `https://github.com/${githubUsername}/awesome-project`,
                    isPrivate: false,
                    createdAt: '2023-01-01T00:00:00Z'
                },
                commits: 150,
                linesOfCode: 5000,
                languages: {
                    'TypeScript': 3000,
                    'Python': 1500,
                    'JavaScript': 500
                },
                collaborators: 3,
                userContributionPercentage: 65,
                ownerHash: createHash('sha256').update(githubUsername).digest('hex')
            },
            {
                repository: {
                    name: 'ml-toolkit',
                    owner: 'openai',
                    url: `https://github.com/openai/ml-toolkit`,
                    isPrivate: false,
                    createdAt: '2022-06-15T00:00:00Z'
                },
                commits: 45,
                linesOfCode: 2000,
                languages: {
                    'Python': 1800,
                    'Jupyter Notebook': 200
                },
                collaborators: 12,
                userContributionPercentage: 15,
                ownerHash: createHash('sha256').update('openai').digest('hex')
            },
            {
                repository: {
                    name: 'web3-dapp',
                    owner: githubUsername,
                    url: `https://github.com/${githubUsername}/web3-dapp`,
                    isPrivate: true,
                    createdAt: '2023-08-20T00:00:00Z'
                },
                commits: 89,
                linesOfCode: 3500,
                languages: {
                    'Solidity': 2000,
                    'TypeScript': 1000,
                    'CSS': 500
                },
                collaborators: 2,
                userContributionPercentage: 80,
                ownerHash: createHash('sha256').update(githubUsername).digest('hex')
            }
        ];

        return mockRepositories;
    }

    private validateRepository(repo: GitHubRepo): boolean {
        // Basic validation
        if (!repo.name || !repo.owner) return false;
        if (repo.size === 0) return false;
        
        // Check repository age (prevent gaming)
        const repoAge = Date.now() - new Date(repo.created_at).getTime();
        const minAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        return repoAge >= minAge;
    }
} 