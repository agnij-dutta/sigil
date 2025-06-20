/**
 * Credentials API Routes
 * 
 * Main API endpoints for generating comprehensive ZK-based developer credentials
 * from GitHub data with privacy preservation and anti-gaming measures.
 */

import { Request, Response } from 'express';
import { GitHubIndexer } from '../../indexing/github/indexer';
import { MultiRepositoryAggregator } from '../../aggregation/cross_repo/multi_repo_aggregator';
import { ZKProofGenerator } from '../../utils/crypto/zk_proof_generator';
import { AggregatedCredentials, SkillLevel } from '../../types';

export interface CredentialRequest {
    userAddress: string;
    githubUsername: string;
    targetSkillLevel?: SkillLevel;
    includePrivateRepos?: boolean;
    privacyLevel?: 'minimal' | 'standard' | 'high' | 'maximum';
}

export interface CredentialResponse {
    success: boolean;
    credential?: AggregatedCredentials;
    zkProofs?: any[];
    error?: string;
    processingTimeMs?: number;
}

/**
 * Generate comprehensive developer credentials
 * 
 * This endpoint demonstrates the complete flow:
 * 1. Index GitHub repositories
 * 2. Aggregate multi-repository data with privacy
 * 3. Generate ZK proofs for all claims
 * 4. Return verifiable credentials
 */
export async function generateCredentials(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
        const {
            userAddress,
            githubUsername,
            targetSkillLevel = 'mid',
            includePrivateRepos = false,
            privacyLevel = 'standard'
        }: CredentialRequest = req.body;

        // Validate inputs
        if (!userAddress || !githubUsername) {
            res.status(400).json({
                success: false,
                error: 'userAddress and githubUsername are required'
            } as CredentialResponse);
            return;
        }

        console.log(`Generating credentials for ${githubUsername} (${userAddress})`);

        // Step 1: Index GitHub repositories
        const indexer = new GitHubIndexer(process.env.GITHUB_TOKEN || '');
        const repositories = await indexer.indexUserRepositories(githubUsername);

        if (repositories.length === 0) {
            res.status(404).json({
                success: false,
                error: 'No valid repositories found for user'
            } as CredentialResponse);
            return;
        }

        // Step 2: Aggregate multi-repository data with privacy
        const aggregator = new MultiRepositoryAggregator(
            getPrivacyEpsilon(privacyLevel),
            3 // Minimum repositories required
        );

        // Add repositories to aggregator
        for (const repo of repositories) {
            await aggregator.addRepository(repo);
        }

        // Generate aggregated credentials
        const aggregatedCredentials = await aggregator.generateAggregatedCredentials(userAddress);

        // Step 3: Generate ZK proofs (simplified for demo)
        const zkProofs = await generateZKProofs(repositories, aggregatedCredentials, targetSkillLevel);

        const processingTime = Date.now() - startTime;
        
        console.log(`✅ Generated credentials for ${githubUsername} in ${processingTime}ms`);
        console.log(`📊 Analyzed ${repositories.length} repositories`);
        console.log(`🔢 Total commits: ${aggregatedCredentials.totalCommits}`);
        console.log(`📝 Total LOC: ${aggregatedCredentials.totalLOC}`);
        console.log(`💻 Languages: ${Object.keys(aggregatedCredentials.languageProficiency).join(', ')}`);
        console.log(`🤝 Collaboration score: ${aggregatedCredentials.collaborationScore}`);
        console.log(`🎯 Diversity score: ${aggregatedCredentials.diversityScore}`);
        console.log(`🔒 Not owner of all repos: ${aggregatedCredentials.isNotOwnerOfAll}`);

        res.json({
            success: true,
            credential: aggregatedCredentials,
            zkProofs,
            processingTimeMs: processingTime
        } as CredentialResponse);

    } catch (error) {
        console.error('Error generating credentials:', error);
        
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
            processingTimeMs: Date.now() - startTime
        } as CredentialResponse);
    }
}

/**
 * Verify existing ZK credentials
 */
export async function verifyCredentials(req: Request, res: Response): Promise<void> {
    try {
        const { credentialHash, zkProofs } = req.body;

        if (!credentialHash || !zkProofs) {
            res.status(400).json({
                success: false,
                error: 'credentialHash and zkProofs are required'
            });
            return;
        }

        // Verify ZK proofs (simplified for demo)
        const isValid = await verifyZKProofs(zkProofs);

        res.json({
            success: true,
            isValid,
            verifiedAt: new Date()
        });

    } catch (error) {
        console.error('Error verifying credentials:', error);
        
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Verification failed'
        });
    }
}

/**
 * Get credential statistics for analysis
 */
export async function getCredentialStats(req: Request, res: Response): Promise<void> {
    try {
        // Mock statistics for demo
        const stats = {
            totalCredentialsGenerated: 1247,
            averageRepositoriesPerUser: 4.2,
            mostCommonLanguages: ['TypeScript', 'Python', 'JavaScript', 'Go', 'Rust'],
            averageCollaborationScore: 72,
            privacyLevelsUsed: {
                minimal: 15,
                standard: 60,
                high: 20,
                maximum: 5
            },
            skillLevelDistribution: {
                junior: 25,
                mid: 45,
                senior: 25,
                expert: 5
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Error getting stats:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics'
        });
    }
}

// Helper functions

function getPrivacyEpsilon(level: string): number {
    switch (level) {
        case 'minimal': return 10.0;   // Low privacy, high accuracy
        case 'standard': return 1.0;   // Balanced
        case 'high': return 0.1;       // High privacy, lower accuracy
        case 'maximum': return 0.01;   // Maximum privacy
        default: return 1.0;
    }
}

async function generateZKProofs(
    repositories: any[],
    credentials: AggregatedCredentials,
    skillLevel: SkillLevel
): Promise<any[]> {
    // Simplified ZK proof generation for demo
    // In practice, would use actual ZK circuit compilation and proving
    
    const proofs = [
        {
            type: 'repository_credential',
            circuitName: 'RepositoryCredential',
            repositoryCount: repositories.length,
            claimsProven: [
                'commit_count_in_range',
                'loc_in_range',
                'languages_used',
                'collaboration_verified',
                'not_repository_owner'
            ],
            proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            publicSignals: [
                credentials.userAddress.slice(2), // Remove 0x
                credentials.totalRepositories.toString(),
                skillLevel
            ],
            generatedAt: new Date()
        },
        {
            type: 'language_proficiency',
            circuitName: 'DynamicLanguageCredential',
            languageCount: Object.keys(credentials.languageProficiency).length,
            languagesProven: Object.keys(credentials.languageProficiency),
            proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            publicSignals: [
                Object.keys(credentials.languageProficiency).length.toString()
            ],
            generatedAt: new Date()
        },
        {
            type: 'collaboration_proof',
            circuitName: 'CollaborationCredential',
            teamProjectsVerified: true,
            collaborationScore: credentials.collaborationScore,
            proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            publicSignals: [
                credentials.collaborationScore.toString()
            ],
            generatedAt: new Date()
        }
    ];

    return proofs;
}

async function verifyZKProofs(proofs: any[]): Promise<boolean> {
    // Simplified verification for demo
    // In practice, would verify actual ZK proofs using verification keys
    
    for (const proof of proofs) {
        if (!proof.proof || !proof.publicSignals || !proof.circuitName) {
            return false;
        }
    }
    
    return true;
} 