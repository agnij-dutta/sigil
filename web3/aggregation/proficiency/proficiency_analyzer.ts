/**
 * Proficiency Analyzer
 * 
 * Evaluates technical skill levels, expertise depth, and competency progression
 * across programming languages and technologies to generate proficiency scores.
 */

import { createHash } from 'crypto';
import { 
    RepositoryData, 
    CommitData,
    LanguageData,
    AggregatedProficiencyMetrics,
    DifferentialPrivacyConfig
} from '../types/index.js';

export interface ProficiencyConfig {
    minCommitsForProficiency: number;
    expertiseThresholds: {
        beginner: number;
        intermediate: number;
        advanced: number;
        expert: number;
    };
    languageComplexityWeights: Record<string, number>;
    frameworkWeights: Record<string, number>;
    privacyConfig: DifferentialPrivacyConfig;
    temporalDecay: number;
    qualityWeighting: boolean;
}

export interface LanguageProficiency {
    language: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    score: number;
    metrics: {
        linesOfCode: number;
        commits: number;
        repositories: number;
        complexity: number;
        recency: number;
        consistency: number;
        qualityIndicators: number;
    };
    frameworks: string[];
    specializations: string[];
    growthRate: number;
    confidenceScore: number;
}

export interface TechnicalProficiency {
    repositoryId: string;
    overallScore: number;
    languageProficiencies: LanguageProficiency[];
    technicalDepth: {
        primaryExpertise: string[];
        secondarySkills: string[];
        emergingSkills: string[];
        specializations: string[];
    };
    skillProgression: {
        growthRate: number;
        learningVelocity: number;
        adaptabilityScore: number;
        masteryIndicators: number;
    };
    industryRelevance: {
        marketDemand: number;
        trendinessScore: number;
        futureProofing: number;
        enterpriseRelevance: number;
    };
    qualityMetrics: {
        codeQuality: number;
        bestPractices: number;
        architecturalAwareness: number;
        testingProficiency: number;
    };
}

export class ProficiencyAnalyzer {
    private config: ProficiencyConfig;
    private repositoryProficiencies: Map<string, TechnicalProficiency> = new Map();
    private languageDatabase: Map<string, LanguageProficiency[]> = new Map();
    
    // Language complexity and market weights
    private readonly LANGUAGE_COMPLEXITY = {
        'Assembly': 10, 'C': 8, 'C++': 9, 'Rust': 9, 'Haskell': 10,
        'Scala': 8, 'Clojure': 7, 'Erlang': 7, 'Go': 6, 'Java': 6,
        'C#': 6, 'Python': 5, 'JavaScript': 4, 'TypeScript': 5,
        'Ruby': 4, 'PHP': 3, 'HTML': 2, 'CSS': 3, 'SQL': 4
    };

    private readonly MARKET_DEMAND = {
        'JavaScript': 10, 'TypeScript': 9, 'Python': 10, 'Java': 8,
        'C#': 7, 'Go': 8, 'Rust': 9, 'Kotlin': 7, 'Swift': 6,
        'C++': 7, 'PHP': 6, 'Ruby': 5, 'Scala': 6, 'Clojure': 4
    };

    private readonly FRAMEWORK_INDICATORS = {
        'React': ['jsx', 'component', 'hook', 'state'],
        'Vue': ['vue', 'component', 'directive'],
        'Angular': ['angular', 'component', 'service', 'module'],
        'Django': ['django', 'model', 'view', 'template'],
        'Rails': ['rails', 'model', 'controller', 'view'],
        'Express': ['express', 'middleware', 'route'],
        'Spring': ['spring', 'bean', 'annotation', 'mvc'],
        'TensorFlow': ['tensorflow', 'tensor', 'model', 'neural'],
        'PyTorch': ['pytorch', 'tensor', 'model', 'neural']
    };

    constructor(config: Partial<ProficiencyConfig> = {}) {
        this.config = {
            minCommitsForProficiency: 5,
            expertiseThresholds: {
                beginner: 20,
                intermediate: 50,
                advanced: 80,
                expert: 95
            },
            languageComplexityWeights: this.LANGUAGE_COMPLEXITY,
            frameworkWeights: {},
            privacyConfig: {
                epsilon: 1.0,
                delta: 1e-5,
                sensitivity: 1.0,
                mechanism: 'laplace',
                clampingBounds: [0, 100]
            },
            temporalDecay: 0.1,
            qualityWeighting: true,
            ...config
        };
    }

    /**
     * Analyze proficiency for a single repository
     */
    async analyzeRepository(
        repository: RepositoryData, 
        commits: CommitData[]
    ): Promise<TechnicalProficiency> {
        // Filter commits with sufficient data
        const validCommits = commits.filter(commit => 
            commit.additions > 0 || commit.deletions > 0
        );

        if (validCommits.length < this.config.minCommitsForProficiency) {
            return this.createMinimalProficiency(repository.id);
        }

        // Analyze language proficiencies
        const languageProficiencies = await this.analyzeLanguageProficiencies(
            repository, validCommits
        );

        // Calculate technical depth
        const technicalDepth = this.calculateTechnicalDepth(
            repository, languageProficiencies
        );

        // Analyze skill progression
        const skillProgression = this.analyzeSkillProgression(
            repository, validCommits, languageProficiencies
        );

        // Calculate industry relevance
        const industryRelevance = this.calculateIndustryRelevance(
            repository, languageProficiencies
        );

        // Assess quality metrics
        const qualityMetrics = this.assessQualityMetrics(
            repository, validCommits
        );

        // Calculate overall score
        const overallScore = this.calculateOverallProficiencyScore({
            languageProficiencies,
            technicalDepth,
            skillProgression,
            industryRelevance,
            qualityMetrics
        });

        const proficiency: TechnicalProficiency = {
            repositoryId: repository.id,
            overallScore,
            languageProficiencies,
            technicalDepth,
            skillProgression,
            industryRelevance,
            qualityMetrics
        };

        this.repositoryProficiencies.set(repository.id, proficiency);
        this.updateLanguageDatabase(languageProficiencies);

        return proficiency;
    }

    /**
     * Aggregate proficiency metrics across multiple repositories
     */
    async aggregateProficiencyMetrics(
        repositories: RepositoryData[],
        userAddress: string
    ): Promise<AggregatedProficiencyMetrics> {
        const proficiencies = Array.from(this.repositoryProficiencies.values());
        
        if (proficiencies.length === 0) {
            throw new Error('No repository proficiencies available for aggregation');
        }

        // Calculate aggregate metrics
        const overallProficiency = this.calculateAggregateOverallProficiency(proficiencies);
        const expertiseDepth = this.calculateExpertiseDepth(proficiencies);
        const skillGrowthRate = this.calculateSkillGrowthRate(proficiencies);
        const technicalLeadership = this.calculateTechnicalLeadership(proficiencies);
        const industryRelevance = this.calculateAggregateIndustryRelevance(proficiencies);

        // Apply differential privacy
        const privacyPreserving = this.applyDifferentialPrivacy({
            overallProficiency,
            expertiseDepth,
            skillGrowthRate,
            technicalLeadership,
            industryRelevance
        });

        return {
            overallProficiency: privacyPreserving.overallProficiency,
            expertiseDepth: privacyPreserving.expertiseDepth,
            skillGrowthRate: privacyPreserving.skillGrowthRate,
            technicalLeadership: privacyPreserving.technicalLeadership,
            industryRelevance: privacyPreserving.industryRelevance
        };
    }

    /**
     * Analyze language proficiencies for a repository
     */
    private async analyzeLanguageProficiencies(
        repository: RepositoryData,
        commits: CommitData[]
    ): Promise<LanguageProficiency[]> {
        const proficiencies: LanguageProficiency[] = [];

        for (const language of repository.languages) {
            if (language.linesOfCode < 50) continue; // Skip trivial usage

            const languageCommits = this.filterCommitsByLanguage(commits, language.name);
            const proficiency = await this.calculateLanguageProficiency(
                language, languageCommits, repository
            );

            proficiencies.push(proficiency);
        }

        return proficiencies.sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate proficiency for a specific language
     */
    private async calculateLanguageProficiency(
        language: LanguageData,
        commits: CommitData[],
        repository: RepositoryData
    ): Promise<LanguageProficiency> {
        // Base metrics
        const linesOfCode = language.linesOfCode;
        const commitCount = commits.length;
        const complexity = this.config.languageComplexityWeights[language.name] || 5;

        // Calculate recency score
        const recency = this.calculateRecencyScore(commits);

        // Calculate consistency score
        const consistency = this.calculateConsistencyScore(commits);

        // Detect frameworks and specializations
        const frameworks = this.detectFrameworks(repository, language.name);
        const specializations = this.detectSpecializations(repository, language.name);

        // Calculate quality indicators
        const qualityIndicators = this.calculateQualityIndicators(
            repository, commits, language.name
        );

        // Calculate growth rate
        const growthRate = this.calculateGrowthRate(commits);

        // Calculate base score
        let baseScore = 0;
        baseScore += Math.min(40, Math.log10(linesOfCode + 1) * 10); // LOC contribution
        baseScore += Math.min(30, commitCount * 2); // Commit contribution
        baseScore += Math.min(20, complexity * 2); // Complexity bonus
        baseScore += Math.min(10, recency); // Recency bonus

        // Apply quality weighting
        if (this.config.qualityWeighting) {
            baseScore *= (1 + qualityIndicators / 100);
        }

        // Apply temporal decay
        baseScore *= (1 - this.config.temporalDecay * this.calculateAgeInYears(commits));

        // Normalize to 0-100
        const score = Math.max(0, Math.min(100, baseScore));

        // Determine proficiency level
        const level = this.determineProficiencyLevel(score);

        // Calculate confidence score
        const confidenceScore = this.calculateConfidenceScore({
            linesOfCode, commitCount, consistency, qualityIndicators
        });

        return {
            language: language.name,
            level,
            score: Math.round(score),
            metrics: {
                linesOfCode,
                commits: commitCount,
                repositories: 1, // Will be aggregated later
                complexity,
                recency,
                consistency,
                qualityIndicators
            },
            frameworks,
            specializations,
            growthRate,
            confidenceScore
        };
    }

    /**
     * Calculate technical depth metrics
     */
    private calculateTechnicalDepth(
        repository: RepositoryData,
        languageProficiencies: LanguageProficiency[]
    ): any {
        const expertLanguages = languageProficiencies.filter(lp => lp.level === 'expert');
        const advancedLanguages = languageProficiencies.filter(lp => lp.level === 'advanced');
        const emergingLanguages = languageProficiencies.filter(lp => 
            lp.level === 'beginner' && lp.growthRate > 0.5
        );

        const allFrameworks = new Set<string>();
        const allSpecializations = new Set<string>();

        languageProficiencies.forEach(lp => {
            lp.frameworks.forEach(f => allFrameworks.add(f));
            lp.specializations.forEach(s => allSpecializations.add(s));
        });

        return {
            primaryExpertise: expertLanguages.map(lp => lp.language),
            secondarySkills: advancedLanguages.map(lp => lp.language),
            emergingSkills: emergingLanguages.map(lp => lp.language),
            specializations: Array.from(allSpecializations)
        };
    }

    /**
     * Analyze skill progression patterns
     */
    private analyzeSkillProgression(
        repository: RepositoryData,
        commits: CommitData[],
        languageProficiencies: LanguageProficiency[]
    ): any {
        // Calculate overall growth rate
        const growthRate = languageProficiencies.reduce((sum, lp) => 
            sum + lp.growthRate, 0
        ) / languageProficiencies.length;

        // Calculate learning velocity (new languages/frameworks over time)
        const learningVelocity = this.calculateLearningVelocity(
            repository, languageProficiencies
        );

        // Calculate adaptability score
        const adaptabilityScore = this.calculateAdaptabilityScore(
            languageProficiencies
        );

        // Calculate mastery indicators
        const masteryIndicators = this.calculateMasteryIndicators(
            languageProficiencies
        );

        return {
            growthRate: Math.round(growthRate * 100),
            learningVelocity: Math.round(learningVelocity),
            adaptabilityScore: Math.round(adaptabilityScore),
            masteryIndicators: Math.round(masteryIndicators)
        };
    }

    /**
     * Calculate industry relevance metrics
     */
    private calculateIndustryRelevance(
        repository: RepositoryData,
        languageProficiencies: LanguageProficiency[]
    ): any {
        // Calculate market demand score
        const marketDemand = languageProficiencies.reduce((sum, lp) => {
            const demand = this.MARKET_DEMAND[lp.language] || 5;
            return sum + (demand * lp.score / 100);
        }, 0) / languageProficiencies.length;

        // Calculate trendiness score
        const trendinessScore = this.calculateTrendinessScore(languageProficiencies);

        // Calculate future-proofing score
        const futureProofing = this.calculateFutureProofingScore(languageProficiencies);

        // Calculate enterprise relevance
        const enterpriseRelevance = this.calculateEnterpriseRelevance(languageProficiencies);

        return {
            marketDemand: Math.round(marketDemand * 10),
            trendinessScore: Math.round(trendinessScore),
            futureProofing: Math.round(futureProofing),
            enterpriseRelevance: Math.round(enterpriseRelevance)
        };
    }

    /**
     * Assess code quality metrics
     */
    private assessQualityMetrics(
        repository: RepositoryData,
        commits: CommitData[]
    ): any {
        // Calculate code quality indicators
        const codeQuality = this.calculateCodeQuality(repository, commits);
        
        // Assess best practices adherence
        const bestPractices = this.assessBestPractices(repository);
        
        // Evaluate architectural awareness
        const architecturalAwareness = this.evaluateArchitecturalAwareness(repository);
        
        // Assess testing proficiency
        const testingProficiency = this.assessTestingProficiency(repository);

        return {
            codeQuality: Math.round(codeQuality),
            bestPractices: Math.round(bestPractices),
            architecturalAwareness: Math.round(architecturalAwareness),
            testingProficiency: Math.round(testingProficiency)
        };
    }

    /**
     * Calculate overall proficiency score
     */
    private calculateOverallProficiencyScore(components: any): number {
        const {
            languageProficiencies,
            technicalDepth,
            skillProgression,
            industryRelevance,
            qualityMetrics
        } = components;

        // Weight components
        const languageScore = languageProficiencies.reduce((sum: number, lp: any) => 
            sum + lp.score, 0
        ) / languageProficiencies.length;

        const depthScore = (
            technicalDepth.primaryExpertise.length * 25 +
            technicalDepth.secondarySkills.length * 15 +
            technicalDepth.emergingSkills.length * 10
        );

        const progressionScore = (
            skillProgression.growthRate * 0.3 +
            skillProgression.learningVelocity * 0.3 +
            skillProgression.adaptabilityScore * 0.2 +
            skillProgression.masteryIndicators * 0.2
        );

        const relevanceScore = (
            industryRelevance.marketDemand * 0.4 +
            industryRelevance.trendinessScore * 0.3 +
            industryRelevance.futureProofing * 0.2 +
            industryRelevance.enterpriseRelevance * 0.1
        );

        const qualityScore = (
            qualityMetrics.codeQuality * 0.3 +
            qualityMetrics.bestPractices * 0.3 +
            qualityMetrics.architecturalAwareness * 0.2 +
            qualityMetrics.testingProficiency * 0.2
        );

        // Weighted combination
        const overallScore = (
            languageScore * 0.35 +
            Math.min(100, depthScore) * 0.25 +
            progressionScore * 0.15 +
            relevanceScore * 0.15 +
            qualityScore * 0.10
        );

        return Math.round(Math.max(0, Math.min(100, overallScore)));
    }

    /**
     * Utility functions for proficiency calculations
     */
    private filterCommitsByLanguage(commits: CommitData[], language: string): CommitData[] {
        // This is a simplified implementation
        // In reality, you'd need to analyze commit diffs to determine language-specific changes
        return commits;
    }

    private calculateRecencyScore(commits: CommitData[]): number {
        if (commits.length === 0) return 0;
        
        const latestCommit = Math.max(...commits.map(c => c.date.getTime()));
        const daysSinceLatest = (Date.now() - latestCommit) / (1000 * 60 * 60 * 24);
        
        // Score decreases with time since last commit
        return Math.max(0, 100 - daysSinceLatest / 7); // Weekly decay
    }

    private calculateConsistencyScore(commits: CommitData[]): number {
        if (commits.length < 2) return 0;
        
        const intervals = [];
        for (let i = 1; i < commits.length; i++) {
            const interval = commits[i].date.getTime() - commits[i-1].date.getTime();
            intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
        }
        
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => 
            sum + Math.pow(interval - avgInterval, 2), 0
        ) / intervals.length;
        
        const coefficientOfVariation = Math.sqrt(variance) / avgInterval;
        
        // Lower CV indicates higher consistency
        return Math.max(0, 100 - coefficientOfVariation * 20);
    }

    private detectFrameworks(repository: RepositoryData, language: string): string[] {
        const frameworks: string[] = [];
        const text = `${repository.name} ${repository.fullName}`.toLowerCase();
        
        for (const [framework, indicators] of Object.entries(this.FRAMEWORK_INDICATORS)) {
            if (indicators.some(indicator => text.includes(indicator))) {
                frameworks.push(framework);
            }
        }
        
        return frameworks;
    }

    private detectSpecializations(repository: RepositoryData, language: string): string[] {
        const specializations: string[] = [];
        const text = `${repository.name} ${repository.fullName}`.toLowerCase();
        
        const specializationKeywords = {
            'machine-learning': ['ml', 'ai', 'neural', 'model'],
            'web-development': ['web', 'api', 'server', 'client'],
            'mobile-development': ['mobile', 'app', 'ios', 'android'],
            'game-development': ['game', 'engine', 'graphics', 'unity'],
            'blockchain': ['blockchain', 'crypto', 'defi', 'smart-contract'],
            'security': ['security', 'crypto', 'encryption', 'auth'],
            'data-analysis': ['data', 'analytics', 'visualization', 'etl'],
            'devops': ['devops', 'ci', 'cd', 'docker', 'kubernetes']
        };
        
        for (const [specialization, keywords] of Object.entries(specializationKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                specializations.push(specialization);
            }
        }
        
        return specializations;
    }

    private calculateQualityIndicators(
        repository: RepositoryData,
        commits: CommitData[],
        language: string
    ): number {
        let score = 50; // Base score
        
        // Commit message quality
        const avgMessageLength = commits.reduce((sum, commit) => 
            sum + commit.message.length, 0
        ) / commits.length;
        
        if (avgMessageLength > 20) score += 10;
        if (avgMessageLength > 50) score += 10;
        
        // Commit size consistency
        const commitSizes = commits.map(c => c.additions + c.deletions);
        const avgSize = commitSizes.reduce((sum, size) => sum + size, 0) / commitSizes.length;
        const sizeVariance = commitSizes.reduce((sum, size) => 
            sum + Math.pow(size - avgSize, 2), 0
        ) / commitSizes.length;
        
        const sizeCV = Math.sqrt(sizeVariance) / avgSize;
        if (sizeCV < 1) score += 15; // Consistent commit sizes
        
        // Repository structure indicators
        if (repository.totalLOC > 1000) score += 10;
        if (repository.totalLOC > 10000) score += 10;
        
        return Math.min(100, score);
    }

    private calculateGrowthRate(commits: CommitData[]): number {
        if (commits.length < 2) return 0;
        
        // Sort commits by date
        const sortedCommits = commits.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Calculate growth in commit frequency over time
        const timeSpan = sortedCommits[sortedCommits.length - 1].date.getTime() - 
                        sortedCommits[0].date.getTime();
        const timeSpanDays = timeSpan / (1000 * 60 * 60 * 24);
        
        if (timeSpanDays === 0) return 0;
        
        // Simple growth rate calculation
        const recentCommits = sortedCommits.slice(-Math.ceil(sortedCommits.length / 2));
        const earlyCommits = sortedCommits.slice(0, Math.floor(sortedCommits.length / 2));
        
        const recentRate = recentCommits.length / (timeSpanDays / 2);
        const earlyRate = earlyCommits.length / (timeSpanDays / 2);
        
        return earlyRate > 0 ? (recentRate - earlyRate) / earlyRate : 0;
    }

    private determineProficiencyLevel(score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
        const thresholds = this.config.expertiseThresholds;
        
        if (score >= thresholds.expert) return 'expert';
        if (score >= thresholds.advanced) return 'advanced';
        if (score >= thresholds.intermediate) return 'intermediate';
        return 'beginner';
    }

    private calculateConfidenceScore(metrics: any): number {
        const { linesOfCode, commitCount, consistency, qualityIndicators } = metrics;
        
        let confidence = 0;
        
        // More data increases confidence
        confidence += Math.min(30, Math.log10(linesOfCode + 1) * 5);
        confidence += Math.min(25, commitCount * 2);
        confidence += Math.min(25, consistency * 0.25);
        confidence += Math.min(20, qualityIndicators * 0.2);
        
        return Math.round(Math.min(100, confidence));
    }

    private calculateLearningVelocity(
        repository: RepositoryData,
        languageProficiencies: LanguageProficiency[]
    ): number {
        // Simplified learning velocity based on language diversity and growth
        const languageCount = languageProficiencies.length;
        const avgGrowthRate = languageProficiencies.reduce((sum, lp) => 
            sum + lp.growthRate, 0
        ) / languageProficiencies.length;
        
        return (languageCount * 10) + (avgGrowthRate * 50);
    }

    private calculateAdaptabilityScore(languageProficiencies: LanguageProficiency[]): number {
        // Measure ability to work with different language paradigms
        const paradigms = new Set<string>();
        
        const paradigmMap: Record<string, string> = {
            'JavaScript': 'multi-paradigm',
            'Python': 'multi-paradigm',
            'Java': 'object-oriented',
            'C++': 'multi-paradigm',
            'Haskell': 'functional',
            'Clojure': 'functional',
            'Go': 'procedural',
            'Rust': 'systems'
        };
        
        languageProficiencies.forEach(lp => {
            const paradigm = paradigmMap[lp.language] || 'other';
            paradigms.add(paradigm);
        });
        
        return paradigms.size * 20;
    }

    private calculateMasteryIndicators(languageProficiencies: LanguageProficiency[]): number {
        const expertCount = languageProficiencies.filter(lp => lp.level === 'expert').length;
        const advancedCount = languageProficiencies.filter(lp => lp.level === 'advanced').length;
        
        return (expertCount * 30) + (advancedCount * 15);
    }

    private calculateTrendinessScore(languageProficiencies: LanguageProficiency[]): number {
        const trendyLanguages = ['TypeScript', 'Rust', 'Go', 'Kotlin', 'Swift'];
        const trendyCount = languageProficiencies.filter(lp => 
            trendyLanguages.includes(lp.language)
        ).length;
        
        return Math.min(100, trendyCount * 25);
    }

    private calculateFutureProofingScore(languageProficiencies: LanguageProficiency[]): number {
        const futureProofLanguages = ['Rust', 'Go', 'TypeScript', 'Python', 'Kotlin'];
        const futureProofCount = languageProficiencies.filter(lp => 
            futureProofLanguages.includes(lp.language)
        ).length;
        
        return Math.min(100, futureProofCount * 20);
    }

    private calculateEnterpriseRelevance(languageProficiencies: LanguageProficiency[]): number {
        const enterpriseLanguages = ['Java', 'C#', 'Python', 'JavaScript', 'TypeScript', 'Go'];
        const enterpriseCount = languageProficiencies.filter(lp => 
            enterpriseLanguages.includes(lp.language)
        ).length;
        
        return Math.min(100, enterpriseCount * 15);
    }

    private calculateCodeQuality(repository: RepositoryData, commits: CommitData[]): number {
        let score = 50;
        
        // Large codebase suggests sustained development
        if (repository.totalLOC > 5000) score += 15;
        if (repository.totalLOC > 20000) score += 15;
        
        // Consistent commit sizes suggest good practices
        const commitSizes = commits.map(c => c.additions + c.deletions);
        const avgSize = commitSizes.reduce((sum, size) => sum + size, 0) / commitSizes.length;
        
        if (avgSize > 10 && avgSize < 500) score += 20; // Reasonable commit sizes
        
        return Math.min(100, score);
    }

    private assessBestPractices(repository: RepositoryData): number {
        let score = 50;
        
        // Multiple languages suggest good architecture
        if (repository.languages.length > 2) score += 20;
        
        // Collaborative repositories suggest good practices
        if (!repository.isOwner) score += 15;
        
        // Active maintenance
        const daysSinceUpdate = (Date.now() - repository.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) score += 15;
        
        return Math.min(100, score);
    }

    private evaluateArchitecturalAwareness(repository: RepositoryData): number {
        let score = 40;
        
        // Complex projects suggest architectural awareness
        if (repository.languages.length > 3) score += 20;
        if (repository.totalLOC > 10000) score += 20;
        
        // Collaborative work suggests architectural discussions
        if (!repository.isOwner) score += 20;
        
        return Math.min(100, score);
    }

    private assessTestingProficiency(repository: RepositoryData): number {
        let score = 30;
        
        // Infer testing from repository characteristics
        const name = repository.name.toLowerCase();
        const fullName = repository.fullName.toLowerCase();
        
        if (name.includes('test') || fullName.includes('test')) score += 30;
        if (name.includes('spec') || fullName.includes('spec')) score += 20;
        
        // Large projects likely have tests
        if (repository.totalLOC > 5000) score += 20;
        
        return Math.min(100, score);
    }

    private calculateAgeInYears(commits: CommitData[]): number {
        if (commits.length === 0) return 0;
        
        const oldestCommit = Math.min(...commits.map(c => c.date.getTime()));
        const ageInMs = Date.now() - oldestCommit;
        return ageInMs / (1000 * 60 * 60 * 24 * 365);
    }

    /**
     * Aggregation helper functions
     */
    private calculateAggregateOverallProficiency(proficiencies: TechnicalProficiency[]): number {
        const scores = proficiencies.map(p => p.overallScore);
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }

    private calculateExpertiseDepth(proficiencies: TechnicalProficiency[]): number {
        const expertLanguages = new Set<string>();
        const advancedLanguages = new Set<string>();
        
        proficiencies.forEach(p => {
            p.languageProficiencies.forEach(lp => {
                if (lp.level === 'expert') expertLanguages.add(lp.language);
                if (lp.level === 'advanced') advancedLanguages.add(lp.language);
            });
        });
        
        return Math.min(100, (expertLanguages.size * 25) + (advancedLanguages.size * 15));
    }

    private calculateSkillGrowthRate(proficiencies: TechnicalProficiency[]): number {
        const growthRates = proficiencies.map(p => p.skillProgression.growthRate);
        return Math.round(growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length);
    }

    private calculateTechnicalLeadership(proficiencies: TechnicalProficiency[]): number {
        const leadershipScores = proficiencies.map(p => {
            const expertCount = p.languageProficiencies.filter(lp => lp.level === 'expert').length;
            const qualityScore = p.qualityMetrics.architecturalAwareness;
            return (expertCount * 20) + (qualityScore * 0.3);
        });
        
        return Math.round(leadershipScores.reduce((sum, score) => sum + score, 0) / leadershipScores.length);
    }

    private calculateAggregateIndustryRelevance(proficiencies: TechnicalProficiency[]): number {
        const relevanceScores = proficiencies.map(p => 
            (p.industryRelevance.marketDemand + 
             p.industryRelevance.trendinessScore + 
             p.industryRelevance.futureProofing + 
             p.industryRelevance.enterpriseRelevance) / 4
        );
        
        return Math.round(relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length);
    }

    private updateLanguageDatabase(languageProficiencies: LanguageProficiency[]): void {
        languageProficiencies.forEach(lp => {
            if (!this.languageDatabase.has(lp.language)) {
                this.languageDatabase.set(lp.language, []);
            }
            this.languageDatabase.get(lp.language)!.push(lp);
        });
    }

    private createMinimalProficiency(repositoryId: string): TechnicalProficiency {
        return {
            repositoryId,
            overallScore: 0,
            languageProficiencies: [],
            technicalDepth: {
                primaryExpertise: [],
                secondarySkills: [],
                emergingSkills: [],
                specializations: []
            },
            skillProgression: {
                growthRate: 0,
                learningVelocity: 0,
                adaptabilityScore: 0,
                masteryIndicators: 0
            },
            industryRelevance: {
                marketDemand: 0,
                trendinessScore: 0,
                futureProofing: 0,
                enterpriseRelevance: 0
            },
            qualityMetrics: {
                codeQuality: 0,
                bestPractices: 0,
                architecturalAwareness: 0,
                testingProficiency: 0
            }
        };
    }

    /**
     * Apply differential privacy to proficiency metrics
     */
    private applyDifferentialPrivacy(metrics: any): any {
        const { epsilon, mechanism, clampingBounds } = this.config.privacyConfig;
        const [minBound, maxBound] = clampingBounds;
        
        const addNoise = (value: number): number => {
            const clampedValue = Math.max(minBound, Math.min(maxBound, value));
            const noise = mechanism === 'laplace' 
                ? this.generateLaplaceNoise(0, 1 / epsilon)
                : this.generateGaussianNoise(0, Math.sqrt(2 * Math.log(1.25 / this.config.privacyConfig.delta)) / epsilon);
            
            return Math.max(minBound, Math.min(maxBound, clampedValue + noise));
        };

        return Object.keys(metrics).reduce((result, key) => {
            result[key] = Math.round(addNoise(metrics[key]));
            return result;
        }, {} as any);
    }

    private generateLaplaceNoise(mean: number, scale: number): number {
        const u = Math.random() - 0.5;
        return mean - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    }

    private generateGaussianNoise(mean: number, stddev: number): number {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + stddev * z;
    }
} 