import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { RepositoryData, CommitData, LanguageData } from '../../types/index.js';

const ThrottledOctokit = Octokit.plugin(throttling);

export interface CrawlerOptions {
    githubToken: string;
    rateLimit?: {
        enabled: boolean;
        maxRequestsPerHour?: number;
    };
    batchSize?: number;
    timeout?: number;
}

export class GitHubCrawler {
    private octokit: Octokit;
    private options: CrawlerOptions;
    private requestQueue: Array<() => Promise<any>> = [];
    private isProcessing = false;

    constructor(options: CrawlerOptions) {
        this.options = {
            rateLimit: { enabled: true, maxRequestsPerHour: 4000 },
            batchSize: 10,
            timeout: 30000,
            ...options
        };

        this.octokit = new ThrottledOctokit({
            auth: options.githubToken,
            throttle: {
                onRateLimit: (retryAfter: number, options: any) => {
                    console.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
                    if (options.request.retryCount === 0) {
                        console.log(`Retrying after ${retryAfter} seconds!`);
                        return true;
                    }
                },
                onSecondaryRateLimit: (retryAfter: number, options: any) => {
                    console.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
                    return true;
                }
            }
        });
    }

    /**
     * Crawl authorized repositories for a user
     */
    public async crawlUserRepositories(username: string, options?: {
        includePrivate?: boolean;
        maxRepos?: number;
        skipForks?: boolean;
    }): Promise<RepositoryData[]> {
        const crawlOptions = {
            includePrivate: false,
            maxRepos: 100,
            skipForks: true,
            ...options
        };

        try {
            const repositories: RepositoryData[] = [];
            let page = 1;
            const perPage = Math.min(100, crawlOptions.maxRepos);

            while (repositories.length < crawlOptions.maxRepos) {
                const { data: repos } = await this.octokit.repos.listForUser({
                    username,
                    type: crawlOptions.includePrivate ? 'all' : 'public',
                    sort: 'updated',
                    per_page: perPage,
                    page
                });

                if (repos.length === 0) break;

                const processedRepos = await this.processRepositoryBatch(
                    repos.filter(repo => !crawlOptions.skipForks || !repo.fork)
                );

                repositories.push(...processedRepos);
                page++;

                if (repositories.length >= crawlOptions.maxRepos) {
                    break;
                }
            }

            return repositories.slice(0, crawlOptions.maxRepos);
        } catch (error) {
            console.error('Failed to crawl user repositories:', error);
            throw error;
        }
    }

    /**
     * Get detailed repository information including commits and languages
     */
    public async getRepositoryDetails(owner: string, repo: string, username: string): Promise<RepositoryData> {
        try {
            // Get basic repository info
            const { data: repoData } = await this.octokit.repos.get({ owner, repo });
            
            // Get commits by user
            const commits = await this.getUserCommits(owner, repo, username);
            
            // Get languages
            const languages = await this.getRepositoryLanguages(owner, repo);
            
            // Get collaborators
            const collaborators = await this.getRepositoryCollaborators(owner, repo);
            
            // Calculate lines of code from commits
            const totalLOC = await this.calculateLinesOfCode(commits);

            return {
                id: repoData.id.toString(),
                name: repoData.name,
                owner: repoData.owner.login,
                fullName: repoData.full_name,
                isPublic: !repoData.private,
                isOwner: repoData.owner.login === username,
                commitCount: commits.length,
                totalLOC,
                languages,
                collaborators,
                createdAt: new Date(repoData.created_at),
                updatedAt: new Date(repoData.updated_at),
                primaryLanguage: repoData.language || 'Unknown',
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                openIssues: repoData.open_issues_count
            };
        } catch (error) {
            console.error(`Failed to get repository details for ${owner}/${repo}:`, error);
            throw error;
        }
    }

    /**
     * Get user's commits in a repository
     */
    private async getUserCommits(owner: string, repo: string, username: string): Promise<CommitData[]> {
        try {
            const commits: CommitData[] = [];
            let page = 1;
            const perPage = 100;

            while (true) {
                const { data: commitList } = await this.octokit.repos.listCommits({
                    owner,
                    repo,
                    author: username,
                    per_page: perPage,
                    page
                });

                if (commitList.length === 0) break;

                for (const commit of commitList) {
                    commits.push({
                        sha: commit.sha,
                        message: commit.commit.message,
                        author: commit.commit.author?.name || username,
                        date: new Date(commit.commit.author?.date || ''),
                        additions: commit.stats?.additions || 0,
                        deletions: commit.stats?.deletions || 0,
                        changedFiles: commit.stats?.total || 0
                    });
                }

                page++;
                
                // Limit to reasonable number of commits per repo
                if (commits.length >= 1000) break;
            }

            return commits;
        } catch (error) {
            console.error(`Failed to get commits for ${owner}/${repo}:`, error);
            return [];
        }
    }

    /**
     * Get repository languages
     */
    private async getRepositoryLanguages(owner: string, repo: string): Promise<LanguageData[]> {
        try {
            const { data: languagesData } = await this.octokit.repos.listLanguages({ owner, repo });
            
            const totalBytes = Object.values(languagesData).reduce((sum: number, bytes) => sum + (bytes as number), 0);
            
            return Object.entries(languagesData).map(([name, bytes]) => ({
                name,
                linesOfCode: Math.round((bytes as number) / 25), // Rough estimation: 25 chars per line
                percentage: totalBytes > 0 ? ((bytes as number) / totalBytes) * 100 : 0,
                bytes: bytes as number
            }));
        } catch (error) {
            console.error(`Failed to get languages for ${owner}/${repo}:`, error);
            return [];
        }
    }

    /**
     * Get repository collaborators
     */
    private async getRepositoryCollaborators(owner: string, repo: string): Promise<any[]> {
        try {
            const { data: collaborators } = await this.octokit.repos.listCollaborators({
                owner,
                repo,
                per_page: 100
            });

            return collaborators.map(collaborator => ({
                id: collaborator.id.toString(),
                username: collaborator.login,
                role: collaborator.permissions?.admin ? 'admin' : 
                      collaborator.permissions?.push ? 'maintainer' : 'contributor',
                avatarUrl: collaborator.avatar_url
            }));
        } catch (error) {
            // This might fail for public repos or due to permissions
            console.warn(`Could not get collaborators for ${owner}/${repo}:`, error);
            return [];
        }
    }

    /**
     * Calculate lines of code from commit statistics
     */
    private async calculateLinesOfCode(commits: CommitData[]): Promise<number> {
        // Sum up additions minus deletions across all commits
        // This gives an approximation of current LOC contributed
        return commits.reduce((total, commit) => {
            return total + (commit.additions || 0) - (commit.deletions || 0);
        }, 0);
    }

    /**
     * Process repository batch with rate limiting
     */
    private async processRepositoryBatch(repos: any[]): Promise<RepositoryData[]> {
        const processed: RepositoryData[] = [];
        
        // Process in smaller batches to respect rate limits
        for (let i = 0; i < repos.length; i += this.options.batchSize!) {
            const batch = repos.slice(i, i + this.options.batchSize!);
            
            const batchPromises = batch.map(async (repo) => {
                try {
                    // For basic repo info, we already have most data
                    return {
                        id: repo.id.toString(),
                        name: repo.name,
                        owner: repo.owner.login,
                        fullName: repo.full_name,
                        isPublic: !repo.private,
                        isOwner: false, // Will be determined later
                        commitCount: 0, // Will be fetched separately if needed
                        totalLOC: 0,
                        languages: [],
                        collaborators: [],
                        createdAt: new Date(repo.created_at),
                        updatedAt: new Date(repo.updated_at),
                        primaryLanguage: repo.language || 'Unknown',
                        stars: repo.stargazers_count,
                        forks: repo.forks_count,
                        openIssues: repo.open_issues_count
                    } as RepositoryData;
                } catch (error) {
                    console.error(`Failed to process repository ${repo.full_name}:`, error);
                    return null;
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    processed.push(result.value);
                }
            });

            // Small delay between batches
            if (i + this.options.batchSize! < repos.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return processed;
    }

    /**
     * Get rate limit status
     */
    public async getRateLimitStatus(): Promise<{
        core: { remaining: number; limit: number; reset: Date };
        search: { remaining: number; limit: number; reset: Date };
    }> {
        const { data } = await this.octokit.rateLimit.get();
        
        return {
            core: {
                remaining: data.rate.remaining,
                limit: data.rate.limit,
                reset: new Date(data.rate.reset * 1000)
            },
            search: {
                remaining: data.search.remaining,
                limit: data.search.limit,
                reset: new Date(data.search.reset * 1000)
            }
        };
    }

    /**
     * Validate GitHub token and permissions
     */
    public async validateToken(): Promise<{
        valid: boolean;
        username?: string;
        scopes?: string[];
        error?: string;
    }> {
        try {
            const { data: user } = await this.octokit.users.getAuthenticated();
            
            return {
                valid: true,
                username: user.login,
                scopes: [] // Would get from headers in real implementation
            };
        } catch (error: any) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
} 