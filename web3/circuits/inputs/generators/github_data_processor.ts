import { RepositoryData, CommitData, LanguageData, CollaborationData } from '../../../types/index.js';
import { createHash } from 'crypto';

export class GitHubDataProcessor {
    private readonly maxRepositories = 50;
    private readonly maxCollaborators = 100;
    private readonly maxLanguages = 20;

    /**
     * Process repository data for circuit inputs
     */
    public async processRepositoryData(repos: RepositoryData[]): Promise<{
        repositoryHashes: string[];
        commitCounts: number[];
        locCounts: number[];
        validRepos: number;
    }> {
        const processed = {
            repositoryHashes: new Array(this.maxRepositories).fill('0'),
            commitCounts: new Array(this.maxRepositories).fill(0),
            locCounts: new Array(this.maxRepositories).fill(0),
            validRepos: Math.min(repos.length, this.maxRepositories)
        };

        for (let i = 0; i < processed.validRepos; i++) {
            const repo = repos[i];
            
            // Create privacy-preserving repository hash
            processed.repositoryHashes[i] = this.hashRepository(repo);
            processed.commitCounts[i] = repo.commitCount;
            processed.locCounts[i] = repo.totalLOC;
        }

        return processed;
    }

    /**
     * Process collaboration data for team verification
     */
    public async processCollaborationData(repos: RepositoryData[]): Promise<{
        collaboratorCounts: number[];
        ownershipFlags: number[];
        teamInteractionHashes: string[];
        avgTeamSize: number;
    }> {
        const processed = {
            collaboratorCounts: new Array(this.maxRepositories).fill(0),
            ownershipFlags: new Array(this.maxRepositories).fill(0),
            teamInteractionHashes: new Array(this.maxRepositories).fill('0'),
            avgTeamSize: 0
        };

        let totalCollaborators = 0;
        let validRepoCount = 0;

        for (let i = 0; i < Math.min(repos.length, this.maxRepositories); i++) {
            const repo = repos[i];
            
            processed.collaboratorCounts[i] = repo.collaborators?.length || 0;
            processed.ownershipFlags[i] = repo.isOwner ? 1 : 0;
            processed.teamInteractionHashes[i] = this.hashTeamInteractions(repo.collaborators || []);
            
            if (processed.collaboratorCounts[i] > 0) {
                totalCollaborators += processed.collaboratorCounts[i];
                validRepoCount++;
            }
        }

        processed.avgTeamSize = validRepoCount > 0 ? Math.floor(totalCollaborators / validRepoCount) : 0;

        return processed;
    }

    /**
     * Process programming language data
     */
    public async processLanguageData(repos: RepositoryData[]): Promise<{
        languages: string[];
        languageUsageCounts: number[];
        languageLOCCounts: number[];
        languageCount: number;
        proficiencyScores: number[];
    }> {
        const languageMap = new Map<string, { usage: number; loc: number }>();

        // Aggregate language usage across repositories
        repos.forEach(repo => {
            repo.languages?.forEach(lang => {
                const existing = languageMap.get(lang.name) || { usage: 0, loc: 0 };
                languageMap.set(lang.name, {
                    usage: existing.usage + 1,
                    loc: existing.loc + lang.linesOfCode
                });
            });
        });

        // Sort by usage and take top languages
        const sortedLanguages = Array.from(languageMap.entries())
            .sort(([,a], [,b]) => b.usage - a.usage)
            .slice(0, this.maxLanguages);

        const processed = {
            languages: new Array(this.maxLanguages).fill(''),
            languageUsageCounts: new Array(this.maxLanguages).fill(0),
            languageLOCCounts: new Array(this.maxLanguages).fill(0),
            languageCount: sortedLanguages.length,
            proficiencyScores: new Array(this.maxLanguages).fill(0)
        };

        sortedLanguages.forEach(([name, data], index) => {
            processed.languages[index] = name;
            processed.languageUsageCounts[index] = data.usage;
            processed.languageLOCCounts[index] = data.loc;
            processed.proficiencyScores[index] = this.calculateProficiencyScore(data.usage, data.loc);
        });

        return processed;
    }

    /**
     * Generate differential privacy noise
     */
    public generateDPNoise(epsilon: number, sensitivity: number, count: number): number[] {
        const scale = sensitivity / epsilon;
        const noise: number[] = [];
        
        for (let i = 0; i < count; i++) {
            // Generate Laplace noise: -scale * sign(u) * ln(1 - |u|) where u is uniform random
            const u = Math.random() * 2 - 1; // [-1, 1]
            const sign = u >= 0 ? 1 : -1;
            const laplace = -scale * sign * Math.log(1 - Math.abs(u));
            noise.push(Math.round(laplace));
        }
        
        return noise;
    }

    /**
     * Validate circuit inputs for consistency
     */
    public validateInputs(inputs: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate array lengths
        if (inputs.repositoryHashes?.length !== this.maxRepositories) {
            errors.push(`Repository hashes array must have ${this.maxRepositories} elements`);
        }

        if (inputs.commitCounts?.length !== this.maxRepositories) {
            errors.push(`Commit counts array must have ${this.maxRepositories} elements`);
        }

        // Validate ranges
        inputs.commitCounts?.forEach((count: number, index: number) => {
            if (count < 0 || count > 1000000) {
                errors.push(`Commit count at index ${index} out of range: ${count}`);
            }
        });

        inputs.locCounts?.forEach((count: number, index: number) => {
            if (count < 0 || count > 10000000) {
                errors.push(`LOC count at index ${index} out of range: ${count}`);
            }
        });

        // Validate collaboration data
        if (inputs.collaboratorCounts) {
            inputs.collaboratorCounts.forEach((count: number, index: number) => {
                if (count < 0 || count > this.maxCollaborators) {
                    errors.push(`Collaborator count at index ${index} out of range: ${count}`);
                }
            });
        }

        // Validate language data
        if (inputs.languageCount && inputs.languageCount > this.maxLanguages) {
            errors.push(`Language count exceeds maximum: ${inputs.languageCount} > ${this.maxLanguages}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Create privacy-preserving repository hash
     */
    private hashRepository(repo: RepositoryData): string {
        const data = {
            // Use only non-identifying information
            commitCount: repo.commitCount,
            totalLOC: repo.totalLOC,
            languageCount: repo.languages?.length || 0,
            collaboratorCount: repo.collaborators?.length || 0,
            isPublic: repo.isPublic,
            // Add some randomness while maintaining determinism for same input
            salt: createHash('sha256').update(repo.name + repo.owner).digest('hex').slice(0, 8)
        };
        
        return createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    /**
     * Hash team interaction patterns without revealing identities
     */
    private hashTeamInteractions(collaborators: any[]): string {
        // Sort collaborators by a deterministic property to ensure consistent hash
        const sortedRoles = collaborators
            .map(c => c.role || 'contributor')
            .sort();
        
        const interactionData = {
            teamSize: collaborators.length,
            roleDistribution: sortedRoles,
            hasOwner: collaborators.some(c => c.role === 'owner'),
            hasAdmin: collaborators.some(c => c.role === 'admin')
        };
        
        return createHash('sha256').update(JSON.stringify(interactionData)).digest('hex');
    }

    /**
     * Calculate proficiency score based on usage and LOC
     */
    private calculateProficiencyScore(usage: number, loc: number): number {
        // Simple proficiency metric: log scale based on LOC and repository count
        const locScore = Math.min(100, Math.log10(loc + 1) * 10);
        const usageScore = Math.min(100, usage * 5);
        return Math.floor((locScore + usageScore) / 2);
    }

    /**
     * Generate sample inputs for testing
     */
    public generateSampleInputs(): any {
        return {
            // Repository data
            repositoryHashes: Array.from({ length: this.maxRepositories }, (_, i) => 
                i < 5 ? createHash('sha256').update(`repo_${i}`).digest('hex') : '0'
            ),
            commitCounts: Array.from({ length: this.maxRepositories }, (_, i) => 
                i < 5 ? Math.floor(Math.random() * 1000) + 10 : 0
            ),
            locCounts: Array.from({ length: this.maxRepositories }, (_, i) => 
                i < 5 ? Math.floor(Math.random() * 50000) + 1000 : 0
            ),
            validRepos: 5,

            // Collaboration data
            collaboratorCounts: Array.from({ length: this.maxRepositories }, (_, i) => 
                i < 5 ? Math.floor(Math.random() * 10) + 2 : 0
            ),
            ownershipFlags: Array.from({ length: this.maxRepositories }, (_, i) => 
                i < 5 ? (Math.random() > 0.7 ? 1 : 0) : 0
            ),

            // Language data
            languages: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', ...Array(15).fill('')],
            languageUsageCounts: [5, 4, 3, 2, 1, ...Array(15).fill(0)],
            languageLOCCounts: [25000, 20000, 15000, 10000, 5000, ...Array(15).fill(0)],
            languageCount: 5,

            // Privacy parameters
            epsilon: 100, // Scaled by 100 for integer arithmetic
            sensitivity: 1,
            noiseValues: this.generateDPNoise(1.0, 1, 10)
        };
    }
} 