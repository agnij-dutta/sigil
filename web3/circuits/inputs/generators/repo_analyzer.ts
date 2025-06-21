import { createHash } from 'crypto';
import { RepositoryData, AnalysisResult, CommitData, CollaboratorData } from '../../../types/index.js';

/**
 * Repository Analyzer
 * 
 * Analyzes repository structure and extracts data compatible with ZK circuits.
 * Processes repository metadata, commit patterns, and collaboration structures
 * while preserving privacy requirements.
 */

export interface RepositoryAnalysisConfig {
    maxCommits: number;
    maxCollaborators: number;
    maxLanguages: number;
    privacyLevel: 'basic' | 'enhanced' | 'maximum';
    timeWindowMonths: number;
}

export interface RepositoryMetrics {
    totalCommits: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
    activeDays: number;
    collaboratorCount: number;
    languageCount: number;
    repositoryAge: number;
    avgCommitSize: number;
    commitFrequency: number;
    codeQualityScore: number;
}

export interface CollaborationPattern {
    isOwner: boolean;
    isSoleContributor: boolean;
    contributionPercentage: number;
    collaborationScore: number;
    teamDiversityIndex: number;
    leadershipIndicators: string[];
    mentorshipEvidence: boolean;
}

export interface LanguageProficiency {
    language: string;
    linesOfCode: number;
    commitCount: number;
    proficiencyScore: number;
    complexityLevel: number;
    frameworksUsed: string[];
    yearsOfExperience: number;
}

export class RepositoryAnalyzer {
    private config: RepositoryAnalysisConfig;
    private hashSalt: string;

    constructor(config: RepositoryAnalysisConfig) {
        this.config = config;
        this.hashSalt = process.env.HASH_SALT || 'sigil_default_salt_2024';
    }

    /**
     * Analyze a repository and extract circuit-compatible data
     */
    async analyzeRepository(repoData: RepositoryData): Promise<AnalysisResult> {
        try {
            // 1. Basic repository metrics
            const metrics = this.calculateRepositoryMetrics(repoData);
            
            // 2. Collaboration analysis
            const collaboration = this.analyzeCollaboration(repoData);
            
            // 3. Language proficiency analysis
            const languages = this.analyzeLanguageProficiency(repoData);
            
            // 4. Temporal consistency analysis
            const temporal = this.analyzeTemporalPatterns(repoData);
            
            // 5. Privacy-preserving transformations
            const privacyData = this.applyPrivacyTransformations(repoData, metrics);
            
            // 6. Generate circuit inputs
            const circuitInputs = this.generateCircuitInputs({
                metrics,
                collaboration,
                languages,
                temporal,
                privacyData
            });

            return {
                repositoryId: this.hashRepositoryId(repoData.name),
                metrics,
                collaboration,
                languages,
                temporal,
                circuitInputs,
                analysisTimestamp: Date.now(),
                privacyLevel: this.config.privacyLevel
            };

        } catch (error) {
            throw new Error(`Repository analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate basic repository metrics
     */
    private calculateRepositoryMetrics(repoData: RepositoryData): RepositoryMetrics {
        const commits = repoData.commits || [];
        const collaborators = repoData.collaborators || [];
        
        // Calculate total lines of code changes
        let totalLinesAdded = 0;
        let totalLinesDeleted = 0;
        let activeDays = new Set<string>();
        
        commits.forEach(commit => {
            totalLinesAdded += commit.additions || 0;
            totalLinesDeleted += commit.deletions || 0;
            activeDays.add(new Date(commit.timestamp).toDateString());
        });

        // Calculate repository age in days
        const firstCommit = commits.length > 0 ? 
            Math.min(...commits.map(c => new Date(c.timestamp).getTime())) : 
            Date.now();
        const repositoryAge = Math.floor((Date.now() - firstCommit) / (1000 * 60 * 60 * 24));

        // Calculate average commit size and frequency
        const avgCommitSize = commits.length > 0 ? 
            (totalLinesAdded + totalLinesDeleted) / commits.length : 0;
        const commitFrequency = repositoryAge > 0 ? commits.length / repositoryAge : 0;

        // Calculate code quality score (0-100)
        const codeQualityScore = this.calculateCodeQualityScore(commits, repoData);

        // Count unique languages
        const languages = new Set<string>();
        commits.forEach(commit => {
            commit.files?.forEach(file => {
                const extension = file.filename.split('.').pop()?.toLowerCase();
                if (extension) {
                    const language = this.getLanguageFromExtension(extension);
                    if (language) languages.add(language);
                }
            });
        });

        return {
            totalCommits: commits.length,
            totalLinesAdded,
            totalLinesDeleted,
            activeDays: activeDays.size,
            collaboratorCount: collaborators.length,
            languageCount: languages.size,
            repositoryAge,
            avgCommitSize: Math.round(avgCommitSize),
            commitFrequency: parseFloat(commitFrequency.toFixed(4)),
            codeQualityScore: Math.round(codeQualityScore)
        };
    }

    /**
     * Analyze collaboration patterns
     */
    private analyzeCollaboration(repoData: RepositoryData): CollaborationPattern {
        const commits = repoData.commits || [];
        const collaborators = repoData.collaborators || [];
        const userCommits = commits.filter(c => c.author === repoData.userAddress);
        
        // Check if user is repository owner
        const isOwner = repoData.owner === repoData.userAddress;
        
        // Check if user is sole contributor
        const uniqueAuthors = new Set(commits.map(c => c.author));
        const isSoleContributor = uniqueAuthors.size === 1 && uniqueAuthors.has(repoData.userAddress);
        
        // Calculate contribution percentage
        const contributionPercentage = commits.length > 0 ? 
            (userCommits.length / commits.length) * 100 : 0;
        
        // Calculate collaboration score (0-100)
        const collaborationScore = this.calculateCollaborationScore(
            collaborators.length,
            contributionPercentage,
            isOwner,
            isSoleContributor
        );
        
        // Calculate team diversity index
        const teamDiversityIndex = this.calculateTeamDiversityIndex(collaborators);
        
        // Identify leadership indicators
        const leadershipIndicators = this.identifyLeadershipIndicators(repoData, userCommits);
        
        // Check for mentorship evidence
        const mentorshipEvidence = this.detectMentorshipEvidence(repoData, userCommits);

        return {
            isOwner,
            isSoleContributor,
            contributionPercentage: parseFloat(contributionPercentage.toFixed(2)),
            collaborationScore: Math.round(collaborationScore),
            teamDiversityIndex: parseFloat(teamDiversityIndex.toFixed(2)),
            leadershipIndicators,
            mentorshipEvidence
        };
    }

    /**
     * Analyze language proficiency
     */
    private analyzeLanguageProficiency(repoData: RepositoryData): LanguageProficiency[] {
        const commits = repoData.commits || [];
        const userCommits = commits.filter(c => c.author === repoData.userAddress);
        
        // Group commits by language
        const languageStats = new Map<string, {
            commits: CommitData[],
            linesOfCode: number,
            files: string[]
        }>();

        userCommits.forEach(commit => {
            commit.files?.forEach(file => {
                const extension = file.filename.split('.').pop()?.toLowerCase();
                const language = this.getLanguageFromExtension(extension);
                
                if (language) {
                    if (!languageStats.has(language)) {
                        languageStats.set(language, {
                            commits: [],
                            linesOfCode: 0,
                            files: []
                        });
                    }
                    
                    const stats = languageStats.get(language)!;
                    stats.commits.push(commit);
                    stats.linesOfCode += (file.additions || 0);
                    stats.files.push(file.filename);
                }
            });
        });

        // Convert to proficiency analysis
        return Array.from(languageStats.entries()).map(([language, stats]) => {
            const proficiencyScore = this.calculateLanguageProficiency(language, stats);
            const complexityLevel = this.assessComplexityLevel(language, stats.files);
            const frameworksUsed = this.identifyFrameworks(language, stats.files);
            const yearsOfExperience = this.estimateExperience(stats.commits);

            return {
                language,
                linesOfCode: stats.linesOfCode,
                commitCount: stats.commits.length,
                proficiencyScore: Math.round(proficiencyScore),
                complexityLevel: Math.round(complexityLevel),
                frameworksUsed,
                yearsOfExperience: parseFloat(yearsOfExperience.toFixed(1))
            };
        }).sort((a, b) => b.proficiencyScore - a.proficiencyScore);
    }

    /**
     * Analyze temporal patterns
     */
    private analyzeTemporalPatterns(repoData: RepositoryData) {
        const commits = repoData.commits || [];
        const userCommits = commits.filter(c => c.author === repoData.userAddress);
        
        if (userCommits.length === 0) {
            return {
                consistencyScore: 0,
                activityPattern: 'inactive',
                peakProductivityHours: [],
                weeklyDistribution: [],
                monthlyTrends: [],
                burnoutRisk: 0
            };
        }

        // Sort commits by timestamp
        const sortedCommits = userCommits.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Calculate consistency score
        const consistencyScore = this.calculateConsistencyScore(sortedCommits);
        
        // Analyze activity patterns
        const activityPattern = this.analyzeActivityPattern(sortedCommits);
        
        // Find peak productivity hours
        const peakProductivityHours = this.findPeakHours(sortedCommits);
        
        // Calculate weekly distribution
        const weeklyDistribution = this.calculateWeeklyDistribution(sortedCommits);
        
        // Analyze monthly trends
        const monthlyTrends = this.analyzeMonthlyTrends(sortedCommits);
        
        // Assess burnout risk
        const burnoutRisk = this.assessBurnoutRisk(sortedCommits);

        return {
            consistencyScore: Math.round(consistencyScore),
            activityPattern,
            peakProductivityHours,
            weeklyDistribution,
            monthlyTrends,
            burnoutRisk: Math.round(burnoutRisk)
        };
    }

    /**
     * Apply privacy-preserving transformations
     */
    private applyPrivacyTransformations(repoData: RepositoryData, metrics: RepositoryMetrics) {
        // Hash sensitive identifiers
        const hashedRepoId = this.hashRepositoryId(repoData.name);
        const hashedCollaborators = (repoData.collaborators || []).map(c => 
            this.hashCollaboratorId(c.login)
        );

        // Apply differential privacy noise to sensitive metrics
        const noisyMetrics = {
            totalCommits: this.addDifferentialPrivacyNoise(metrics.totalCommits, 1, 1.0),
            totalLinesAdded: this.addDifferentialPrivacyNoise(metrics.totalLinesAdded, 10, 1.0),
            collaboratorCount: this.addDifferentialPrivacyNoise(metrics.collaboratorCount, 1, 1.0)
        };

        // Create ranges instead of exact values
        const commitRange = this.createRange(noisyMetrics.totalCommits, 10);
        const locRange = this.createRange(noisyMetrics.totalLinesAdded, 100);

        return {
            hashedRepoId,
            hashedCollaborators,
            noisyMetrics,
            commitRange,
            locRange,
            privacyBudgetUsed: 3.0 // ε = 1.0 for each of 3 queries
        };
    }

    /**
     * Generate circuit-compatible inputs
     */
    private generateCircuitInputs(analysisData: any) {
        const { metrics, collaboration, languages, temporal, privacyData } = analysisData;

        return {
            // Repository credential inputs
            repositoryCredential: {
                repoCommitment: privacyData.hashedRepoId,
                commitCountRange: privacyData.commitRange,
                locRange: privacyData.locRange,
                collaboratorCount: privacyData.noisyMetrics.collaboratorCount,
                isOwner: collaboration.isOwner ? 1 : 0,
                isSoleContributor: collaboration.isSoleContributor ? 1 : 0
            },

            // Language credential inputs
            languageCredential: {
                languageCount: Math.min(languages.length, this.config.maxLanguages),
                languageHashes: languages.slice(0, this.config.maxLanguages).map(l => 
                    this.hashString(l.language)
                ),
                proficiencyScores: languages.slice(0, this.config.maxLanguages).map(l => 
                    l.proficiencyScore
                ),
                locPerLanguage: languages.slice(0, this.config.maxLanguages).map(l => 
                    l.linesOfCode
                )
            },

            // Collaboration credential inputs
            collaborationCredential: {
                collaboratorHashes: privacyData.hashedCollaborators.slice(0, this.config.maxCollaborators),
                contributionPercentage: Math.round(collaboration.contributionPercentage),
                teamDiversityScore: Math.round(collaboration.teamDiversityIndex * 100),
                collaborationScore: collaboration.collaborationScore
            },

            // Consistency credential inputs
            consistencyCredential: {
                consistencyScore: temporal.consistencyScore,
                activityDays: metrics.activeDays,
                repositoryAge: metrics.repositoryAge,
                commitFrequency: Math.round(temporal.consistencyScore * 100)
            },

            // Privacy parameters
            privacyParameters: {
                epsilon: 1.0,
                k: Math.min(5, privacyData.noisyMetrics.collaboratorCount),
                privacyBudget: privacyData.privacyBudgetUsed
            }
        };
    }

    // Helper methods
    private hashRepositoryId(repoName: string): string {
        return createHash('sha256').update(repoName + this.hashSalt).digest('hex');
    }

    private hashCollaboratorId(login: string): string {
        return createHash('sha256').update(login + this.hashSalt).digest('hex');
    }

    private hashString(input: string): string {
        return createHash('sha256').update(input + this.hashSalt).digest('hex');
    }

    private getLanguageFromExtension(extension: string): string | null {
        const languageMap: { [key: string]: string } = {
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'rs': 'Rust',
            'go': 'Go',
            'php': 'PHP',
            'rb': 'Ruby',
            'swift': 'Swift',
            'kt': 'Kotlin',
            'dart': 'Dart',
            'sol': 'Solidity'
        };
        return languageMap[extension] || null;
    }

    private calculateCodeQualityScore(commits: CommitData[], repoData: RepositoryData): number {
        // Simplified quality scoring based on commit patterns
        let score = 50; // Base score
        
        // Bonus for consistent commit sizes
        const avgSize = commits.reduce((sum, c) => sum + (c.additions || 0) + (c.deletions || 0), 0) / commits.length;
        if (avgSize > 10 && avgSize < 500) score += 20;
        
        // Bonus for meaningful commit messages
        const meaningfulCommits = commits.filter(c => c.message && c.message.length > 10).length;
        score += (meaningfulCommits / commits.length) * 20;
        
        // Bonus for test files
        const testFiles = commits.reduce((count, c) => {
            return count + (c.files?.filter(f => 
                f.filename.includes('test') || f.filename.includes('spec')
            ).length || 0);
        }, 0);
        if (testFiles > 0) score += 10;
        
        return Math.min(100, Math.max(0, score));
    }

    private calculateCollaborationScore(
        collaboratorCount: number, 
        contributionPercentage: number, 
        isOwner: boolean, 
        isSoleContributor: boolean
    ): number {
        let score = 0;
        
        // Penalty for sole contribution or ownership
        if (isSoleContributor) return 0;
        if (isOwner) score -= 20;
        
        // Score based on team size
        if (collaboratorCount >= 5) score += 40;
        else if (collaboratorCount >= 3) score += 30;
        else if (collaboratorCount >= 2) score += 20;
        
        // Score based on balanced contribution
        if (contributionPercentage <= 70 && contributionPercentage >= 10) score += 40;
        else if (contributionPercentage <= 80) score += 20;
        
        // Bonus for meaningful collaboration
        if (collaboratorCount >= 3 && contributionPercentage <= 50) score += 20;
        
        return Math.min(100, Math.max(0, score));
    }

    private calculateTeamDiversityIndex(collaborators: CollaboratorData[]): number {
        if (collaborators.length <= 1) return 0;
        
        // Simplified diversity calculation based on collaborator activity patterns
        const activityLevels = collaborators.map(c => c.contributions || 0);
        const maxActivity = Math.max(...activityLevels);
        const avgActivity = activityLevels.reduce((sum, a) => sum + a, 0) / activityLevels.length;
        
        // Calculate coefficient of variation (lower = more diverse)
        const variance = activityLevels.reduce((sum, a) => sum + Math.pow(a - avgActivity, 2), 0) / activityLevels.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = avgActivity > 0 ? stdDev / avgActivity : 0;
        
        // Convert to diversity index (0-1, higher = more diverse)
        return Math.min(1, 1 / (1 + coefficientOfVariation));
    }

    private identifyLeadershipIndicators(repoData: RepositoryData, userCommits: CommitData[]): string[] {
        const indicators: string[] = [];
        
        // Check for architecture-related commits
        const archCommits = userCommits.filter(c => 
            c.message?.toLowerCase().includes('architecture') ||
            c.message?.toLowerCase().includes('design') ||
            c.message?.toLowerCase().includes('refactor')
        );
        if (archCommits.length >= 3) indicators.push('architectural_leadership');
        
        // Check for documentation commits
        const docCommits = userCommits.filter(c =>
            c.files?.some(f => f.filename.toLowerCase().includes('readme') ||
                              f.filename.toLowerCase().includes('doc'))
        );
        if (docCommits.length >= 2) indicators.push('documentation_leadership');
        
        // Check for CI/CD setup
        const ciCommits = userCommits.filter(c =>
            c.files?.some(f => f.filename.includes('.github') ||
                              f.filename.includes('docker') ||
                              f.filename.includes('ci'))
        );
        if (ciCommits.length >= 1) indicators.push('devops_leadership');
        
        return indicators;
    }

    private detectMentorshipEvidence(repoData: RepositoryData, userCommits: CommitData[]): boolean {
        // Look for code review comments, help commits, etc.
        const helpCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('help') ||
            c.message?.toLowerCase().includes('fix') ||
            c.message?.toLowerCase().includes('guide')
        );
        
        return helpCommits.length >= 3;
    }

    private calculateLanguageProficiency(language: string, stats: any): number {
        let score = 0;
        
        // Base score from lines of code
        if (stats.linesOfCode >= 1000) score += 40;
        else if (stats.linesOfCode >= 500) score += 30;
        else if (stats.linesOfCode >= 100) score += 20;
        else score += 10;
        
        // Score from commit frequency
        if (stats.commits.length >= 20) score += 30;
        else if (stats.commits.length >= 10) score += 20;
        else if (stats.commits.length >= 5) score += 10;
        
        // Score from file diversity
        const uniqueFiles = new Set(stats.files).size;
        if (uniqueFiles >= 10) score += 20;
        else if (uniqueFiles >= 5) score += 15;
        else if (uniqueFiles >= 2) score += 10;
        
        // Language-specific bonuses
        const complexLanguages = ['C++', 'Rust', 'Solidity', 'Assembly'];
        if (complexLanguages.includes(language)) score += 10;
        
        return Math.min(100, score);
    }

    private assessComplexityLevel(language: string, files: string[]): number {
        // Analyze file patterns for complexity indicators
        const complexPatterns = [
            'algorithm', 'crypto', 'blockchain', 'compiler',
            'kernel', 'driver', 'protocol', 'parser'
        ];
        
        let complexityScore = 1; // Base complexity
        
        files.forEach(file => {
            const filename = file.toLowerCase();
            complexPatterns.forEach(pattern => {
                if (filename.includes(pattern)) complexityScore += 1;
            });
        });
        
        return Math.min(5, complexityScore);
    }

    private identifyFrameworks(language: string, files: string[]): string[] {
        const frameworks: string[] = [];
        const frameworkPatterns: { [key: string]: string[] } = {
            'JavaScript': ['react', 'vue', 'angular', 'express', 'next'],
            'TypeScript': ['react', 'vue', 'angular', 'express', 'next', 'nest'],
            'Python': ['django', 'flask', 'fastapi', 'tensorflow', 'pytorch'],
            'Java': ['spring', 'hibernate', 'junit', 'maven', 'gradle'],
            'C++': ['boost', 'qt', 'opencv', 'eigen'],
            'Solidity': ['hardhat', 'truffle', 'foundry', 'openzeppelin']
        };
        
        const patterns = frameworkPatterns[language] || [];
        
        files.forEach(file => {
            const filename = file.toLowerCase();
            patterns.forEach(pattern => {
                if (filename.includes(pattern) && !frameworks.includes(pattern)) {
                    frameworks.push(pattern);
                }
            });
        });
        
        return frameworks;
    }

    private estimateExperience(commits: CommitData[]): number {
        if (commits.length === 0) return 0;
        
        const firstCommit = Math.min(...commits.map(c => new Date(c.timestamp).getTime()));
        const lastCommit = Math.max(...commits.map(c => new Date(c.timestamp).getTime()));
        const timeSpanMs = lastCommit - firstCommit;
        const yearsSpan = timeSpanMs / (1000 * 60 * 60 * 24 * 365);
        
        return Math.max(0.1, yearsSpan);
    }

    private calculateConsistencyScore(commits: CommitData[]): number {
        if (commits.length < 2) return 0;
        
        // Calculate intervals between commits
        const intervals: number[] = [];
        for (let i = 1; i < commits.length; i++) {
            const interval = new Date(commits[i].timestamp).getTime() - 
                           new Date(commits[i-1].timestamp).getTime();
            intervals.push(interval);
        }
        
        // Calculate coefficient of variation for intervals
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        const cv = avgInterval > 0 ? stdDev / avgInterval : 0;
        
        // Convert to consistency score (0-100, higher = more consistent)
        return Math.max(0, 100 - (cv * 50));
    }

    private analyzeActivityPattern(commits: CommitData[]): string {
        const hoursMap = new Map<number, number>();
        
        commits.forEach(commit => {
            const hour = new Date(commit.timestamp).getHours();
            hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
        });
        
        const maxHour = Array.from(hoursMap.entries()).reduce((max, [hour, count]) => 
            count > (hoursMap.get(max) || 0) ? hour : max, 0
        );
        
        if (maxHour >= 9 && maxHour <= 17) return 'business_hours';
        if (maxHour >= 18 && maxHour <= 23) return 'evening';
        if (maxHour >= 0 && maxHour <= 6) return 'night_owl';
        return 'flexible';
    }

    private findPeakHours(commits: CommitData[]): number[] {
        const hoursMap = new Map<number, number>();
        
        commits.forEach(commit => {
            const hour = new Date(commit.timestamp).getHours();
            hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
        });
        
        const maxCount = Math.max(...Array.from(hoursMap.values()));
        const threshold = maxCount * 0.7; // 70% of peak activity
        
        return Array.from(hoursMap.entries())
            .filter(([_, count]) => count >= threshold)
            .map(([hour, _]) => hour)
            .sort();
    }

    private calculateWeeklyDistribution(commits: CommitData[]): number[] {
        const weekDays = new Array(7).fill(0);
        
        commits.forEach(commit => {
            const dayOfWeek = new Date(commit.timestamp).getDay();
            weekDays[dayOfWeek]++;
        });
        
        return weekDays;
    }

    private analyzeMonthlyTrends(commits: CommitData[]): number[] {
        const monthlyMap = new Map<string, number>();
        
        commits.forEach(commit => {
            const date = new Date(commit.timestamp);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
        });
        
        return Array.from(monthlyMap.values());
    }

    private assessBurnoutRisk(commits: CommitData[]): number {
        if (commits.length < 10) return 0;
        
        // Check for periods of intense activity followed by inactivity
        const recentCommits = commits.filter(c => 
            Date.now() - new Date(c.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
        );
        
        const historicalAvg = commits.length / Math.max(1, this.estimateExperience(commits) * 12);
        const recentRate = recentCommits.length;
        
        // High recent activity compared to historical average suggests potential burnout
        const intensityRatio = historicalAvg > 0 ? recentRate / historicalAvg : 0;
        
        if (intensityRatio > 3) return 80; // High risk
        if (intensityRatio > 2) return 50; // Medium risk
        if (intensityRatio < 0.3) return 30; // Low activity risk
        return 10; // Low risk
    }

    private addDifferentialPrivacyNoise(value: number, sensitivity: number, epsilon: number): number {
        // Add Laplace noise for differential privacy
        const scale = sensitivity / epsilon;
        const u = Math.random() - 0.5;
        const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
        return Math.max(0, Math.round(value + noise));
    }

    private createRange(value: number, bucketSize: number): { min: number; max: number } {
        const bucket = Math.floor(value / bucketSize);
        return {
            min: bucket * bucketSize,
            max: (bucket + 1) * bucketSize - 1
        };
    }
}

export default RepositoryAnalyzer;