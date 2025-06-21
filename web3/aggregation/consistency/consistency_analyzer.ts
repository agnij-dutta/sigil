/**
 * Consistency Analyzer
 * 
 * Analyzes temporal patterns, activity consistency, and reliability metrics
 * across multiple repositories to generate consistency scores for credential generation.
 */

//import { createHash } from 'crypto';
import { 
    RepositoryData, 
    CommitData, 
    ConsistencyAnalysis,
    AggregatedConsistencyMetrics,
    PrivacyPreservingAggregation,
    DifferentialPrivacyConfig
} from '../types/index.js';

export interface ConsistencyConfig {
    minCommitsForAnalysis: number;
    timeWindowDays: number;
    consistencyThreshold: number;
    reliabilityWeight: number;
    privacyConfig: DifferentialPrivacyConfig;
    seasonalityDetection: boolean;
    burnoutDetection: boolean;
}

export interface ConsistencyMetrics {
    overallScore: number;
    temporalConsistency: number;
    activityPattern: 'regular' | 'sporadic' | 'intensive' | 'declining';
    streakAnalysis: {
        longestStreak: number;
        currentStreak: number;
        averageStreak: number;
        streakConsistency: number;
    };
    gapAnalysis: {
        averageGap: number;
        maxGap: number;
        gapVariability: number;
    };
    seasonality: {
        hasSeasonalPattern: boolean;
        seasonalityScore: number;
        peakMonths: number[];
        lowMonths: number[];
    };
    burnoutIndicators: {
        burnoutRisk: number;
        productivityTrend: 'increasing' | 'stable' | 'decreasing';
        workloadBalance: number;
    };
    reliability: {
        commitmentScore: number;
        predictabilityScore: number;
        sustainabilityScore: number;
    };
}

export class ConsistencyAnalyzer {
    private config: ConsistencyConfig;
    private repositoryAnalyses: Map<string, ConsistencyAnalysis> = new Map();

    constructor(config: Partial<ConsistencyConfig> = {}) {
        this.config = {
            minCommitsForAnalysis: 10,
            timeWindowDays: 365,
            consistencyThreshold: 0.7,
            reliabilityWeight: 0.8,
            privacyConfig: {
                epsilon: 1.0,
                delta: 1e-5,
                sensitivity: 1.0,
                mechanism: 'laplace',
                clampingBounds: [0, 100]
            },
            seasonalityDetection: true,
            burnoutDetection: true,
            ...config
        };
    }

    /**
     * Analyze consistency for a single repository
     */
    async analyzeRepository(repository: RepositoryData, commits: CommitData[]): Promise<ConsistencyAnalysis> {
        if (commits.length < this.config.minCommitsForAnalysis) {
            return this.createMinimalAnalysis(repository.id);
        }

        // Sort commits by date
        const sortedCommits = commits.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Analyze temporal patterns
        const temporalAnalysis = this.analyzeTemporalPatterns(sortedCommits);
        
        // Calculate consistency score
        const consistencyScore = this.calculateConsistencyScore(temporalAnalysis);
        
        // Determine activity pattern
        const activityPattern = this.determineActivityPattern(temporalAnalysis);
        
        // Analyze streaks and gaps
        const streakAnalysis = this.analyzeStreaks(sortedCommits);
        const gapAnalysis = this.analyzeGaps(sortedCommits);
        
        // Seasonal analysis
        const seasonalityAnalysis = this.config.seasonalityDetection 
            ? this.analyzeSeasonality(sortedCommits)
            : { seasonalityScore: 0 };
        
        // Burnout detection
        const burnoutRisk = this.config.burnoutDetection 
            ? this.detectBurnoutRisk(sortedCommits)
            : 0;

        const analysis: ConsistencyAnalysis = {
            consistencyScore,
            activityPattern,
            longestStreak: streakAnalysis.longestStreak,
            averageGapDays: gapAnalysis.averageGap,
            seasonalityScore: seasonalityAnalysis.seasonalityScore,
            burnoutRisk
        };

        this.repositoryAnalyses.set(repository.id, analysis);
        return analysis;
    }

    /**
     * Aggregate consistency metrics across multiple repositories
     */
    async aggregateConsistencyMetrics(
        repositories: RepositoryData[],
        userAddress: string
    ): Promise<AggregatedConsistencyMetrics> {
        const analyses = Array.from(this.repositoryAnalyses.values());
        
        if (analyses.length === 0) {
            throw new Error('No repository analyses available for aggregation');
        }

        // Calculate aggregate scores
        const overallConsistency = this.calculateWeightedAverage(
            analyses.map(a => a.consistencyScore)
        );

        const reliabilityScore = this.calculateReliabilityScore(analyses);
        const commitmentLevel = this.calculateCommitmentLevel(analyses);
        const professionalismScore = this.calculateProfessionalismScore(analyses);
        const sustainabilityScore = this.calculateSustainabilityScore(analyses);

        // Apply differential privacy
        const privacyPreserving = this.applyDifferentialPrivacy({
            overallConsistency,
            reliabilityScore,
            commitmentLevel,
            professionalismScore,
            sustainabilityScore
        });

        return {
            overallConsistency: privacyPreserving.overallConsistency,
            reliabilityScore: privacyPreserving.reliabilityScore,
            commitmentLevel: privacyPreserving.commitmentLevel,
            professionalismScore: privacyPreserving.professionalismScore,
            sustainabilityScore: privacyPreserving.sustainabilityScore
        };
    }

    /**
     * Analyze temporal patterns in commits
     */
    private analyzeTemporalPatterns(commits: CommitData[]): any {
        const timeIntervals: number[] = [];
        
        for (let i = 1; i < commits.length; i++) {
            const interval = commits[i].date.getTime() - commits[i - 1].date.getTime();
            timeIntervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
        }

        const averageInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / timeIntervals.length;
        const intervalStdDev = this.calculateStandardDeviation(timeIntervals);
        const coefficientOfVariation = intervalStdDev / averageInterval;

        // Analyze commit frequency by time periods
        const hourlyDistribution = this.analyzeHourlyDistribution(commits);
        const weeklyDistribution = this.analyzeWeeklyDistribution(commits);
        const monthlyDistribution = this.analyzeMonthlyDistribution(commits);

        return {
            averageInterval,
            intervalStdDev,
            coefficientOfVariation,
            hourlyDistribution,
            weeklyDistribution,
            monthlyDistribution,
            totalTimeSpan: commits[commits.length - 1].date.getTime() - commits[0].date.getTime()
        };
    }

    /**
     * Calculate overall consistency score
     */
    private calculateConsistencyScore(temporalAnalysis: any): number {
        // Lower coefficient of variation indicates higher consistency
        const consistencyFromVariation = Math.max(0, 1 - (temporalAnalysis.coefficientOfVariation / 2));
        
        // Regular distribution across time periods
        const hourlyConsistency = this.calculateDistributionConsistency(temporalAnalysis.hourlyDistribution);
        const weeklyConsistency = this.calculateDistributionConsistency(temporalAnalysis.weeklyDistribution);
        
        // Weighted combination
        const score = (
            consistencyFromVariation * 0.5 +
            hourlyConsistency * 0.25 +
            weeklyConsistency * 0.25
        ) * 100;

        return Math.round(Math.max(0, Math.min(100, score)));
    }

    /**
     * Determine activity pattern based on temporal analysis
     */
    private determineActivityPattern(temporalAnalysis: any): 'regular' | 'sporadic' | 'intensive' | 'declining' {
        const cv = temporalAnalysis.coefficientOfVariation;
        const avgInterval = temporalAnalysis.averageInterval;

        if (cv < 0.5 && avgInterval < 7) return 'regular';
        if (cv > 1.5) return 'sporadic';
        if (avgInterval < 2) return 'intensive';
        return 'declining';
    }

    /**
     * Analyze commit streaks
     */
    private analyzeStreaks(commits: CommitData[]): any {
        const streaks: number[] = [];
        let currentStreak = 1;
        let longestStreak = 1;

        for (let i = 1; i < commits.length; i++) {
            const daysDiff = (commits[i].date.getTime() - commits[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 7) { // Within a week
                currentStreak++;
            } else {
                streaks.push(currentStreak);
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
        
        streaks.push(currentStreak);
        longestStreak = Math.max(longestStreak, currentStreak);

        return {
            longestStreak,
            currentStreak,
            averageStreak: streaks.reduce((sum, s) => sum + s, 0) / streaks.length,
            streakConsistency: this.calculateStandardDeviation(streaks)
        };
    }

    /**
     * Analyze gaps between commits
     */
    private analyzeGaps(commits: CommitData[]): any {
        const gaps: number[] = [];
        
        for (let i = 1; i < commits.length; i++) {
            const gap = (commits[i].date.getTime() - commits[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
            gaps.push(gap);
        }

        return {
            averageGap: gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length,
            maxGap: Math.max(...gaps),
            gapVariability: this.calculateStandardDeviation(gaps)
        };
    }

    /**
     * Analyze seasonality patterns
     */
    private analyzeSeasonality(commits: CommitData[]): any {
        const monthlyCommits = new Array(12).fill(0);
        
        commits.forEach(commit => {
            const month = commit.date.getMonth();
            monthlyCommits[month]++;
        });

        const avgMonthlyCommits = monthlyCommits.reduce((sum, count) => sum + count, 0) / 12;
        const seasonalityScore = this.calculateDistributionConsistency(monthlyCommits) * 100;

        // Identify peak and low months
        const peakMonths: number[] = [];
        const lowMonths: number[] = [];
        
        monthlyCommits.forEach((count, month) => {
            if (count > avgMonthlyCommits * 1.2) peakMonths.push(month);
            if (count < avgMonthlyCommits * 0.8) lowMonths.push(month);
        });

        return {
            seasonalityScore,
            hasSeasonalPattern: peakMonths.length > 0 || lowMonths.length > 0,
            peakMonths,
            lowMonths
        };
    }

    /**
     * Detect burnout risk indicators
     */
    private detectBurnoutRisk(commits: CommitData[]): number {
        if (commits.length < 30) return 0;

        // Analyze recent vs historical activity
        const recentCommits = commits.slice(-30);
        const historicalCommits = commits.slice(0, -30);

        const recentActivity = recentCommits.length / 30;
        const historicalActivity = historicalCommits.length / Math.max(1, historicalCommits.length / 30);

        const activityRatio = recentActivity / Math.max(0.1, historicalActivity);
        
        // Analyze commit size trends
        const recentAvgSize = recentCommits.reduce((sum, c) => sum + (c.additions + c.deletions), 0) / recentCommits.length;
        const historicalAvgSize = historicalCommits.reduce((sum, c) => sum + (c.additions + c.deletions), 0) / Math.max(1, historicalCommits.length);
        
        const sizeRatio = recentAvgSize / Math.max(1, historicalAvgSize);

        // Calculate burnout risk (higher values indicate higher risk)
        let burnoutRisk = 0;
        
        if (activityRatio < 0.5) burnoutRisk += 30; // Significant activity decline
        if (sizeRatio < 0.7) burnoutRisk += 20; // Smaller commits
        if (activityRatio > 2.0) burnoutRisk += 25; // Unsustainable pace

        return Math.min(100, burnoutRisk);
    }

    /**
     * Calculate reliability score from analyses
     */
    private calculateReliabilityScore(analyses: ConsistencyAnalysis[]): number {
        const consistencyScores = analyses.map(a => a.consistencyScore);
        const avgConsistency = this.calculateWeightedAverage(consistencyScores);
        
        const lowBurnoutRisk = analyses.reduce((sum, a) => sum + (100 - a.burnoutRisk), 0) / analyses.length;
        
        return Math.round((avgConsistency + lowBurnoutRisk) / 2);
    }

    /**
     * Calculate commitment level
     */
    private calculateCommitmentLevel(analyses: ConsistencyAnalysis[]): number {
        const streakScores = analyses.map(a => Math.min(100, a.longestStreak * 5));
        const avgStreakScore = this.calculateWeightedAverage(streakScores);
        
        const gapScores = analyses.map(a => Math.max(0, 100 - a.averageGapDays * 2));
        const avgGapScore = this.calculateWeightedAverage(gapScores);
        
        return Math.round((avgStreakScore + avgGapScore) / 2);
    }

    /**
     * Calculate professionalism score
     */
    private calculateProfessionalismScore(analyses: ConsistencyAnalysis[]): number {
        const regularPatterns = analyses.filter(a => a.activityPattern === 'regular').length;
        const patternScore = (regularPatterns / analyses.length) * 100;
        
        const seasonalityScores = analyses.map(a => a.seasonalityScore);
        const avgSeasonality = this.calculateWeightedAverage(seasonalityScores);
        
        return Math.round((patternScore + avgSeasonality) / 2);
    }

    /**
     * Calculate sustainability score
     */
    private calculateSustainabilityScore(analyses: ConsistencyAnalysis[]): number {
        const burnoutScores = analyses.map(a => 100 - a.burnoutRisk);
        const avgBurnoutScore = this.calculateWeightedAverage(burnoutScores);
        
        const sustainablePatterns = analyses.filter(a => 
            a.activityPattern === 'regular' || a.activityPattern === 'sporadic'
        ).length;
        const patternScore = (sustainablePatterns / analyses.length) * 100;
        
        return Math.round((avgBurnoutScore + patternScore) / 2);
    }

    /**
     * Apply differential privacy to metrics
     */
    private applyDifferentialPrivacy(metrics: any): any {
        const { epsilon, mechanism, clampingBounds } = this.config.privacyConfig;
        const [minBound, maxBound] = clampingBounds;
        
        const addNoise = (value: number): number => {
            // Clamp value to bounds
            const clampedValue = Math.max(minBound, Math.min(maxBound, value));
            
            // Add Laplace noise
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

    /**
     * Utility functions
     */
    private createMinimalAnalysis(repositoryId: string): ConsistencyAnalysis {
        return {
            consistencyScore: 0,
            activityPattern: 'sporadic',
            longestStreak: 0,
            averageGapDays: 0,
            seasonalityScore: 0,
            burnoutRisk: 0
        };
    }

    private calculateWeightedAverage(values: number[]): number {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private calculateStandardDeviation(values: number[]): number {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    private calculateDistributionConsistency(distribution: number[]): number {
        const total = distribution.reduce((sum, val) => sum + val, 0);
        if (total === 0) return 0;
        
        const expected = total / distribution.length;
        const variance = distribution.reduce((sum, val) => sum + Math.pow(val - expected, 2), 0) / distribution.length;
        
        return Math.max(0, 1 - (Math.sqrt(variance) / expected));
    }

    private analyzeHourlyDistribution(commits: CommitData[]): number[] {
        const hourly = new Array(24).fill(0);
        commits.forEach(commit => {
            hourly[commit.date.getHours()]++;
        });
        return hourly;
    }

    private analyzeWeeklyDistribution(commits: CommitData[]): number[] {
        const weekly = new Array(7).fill(0);
        commits.forEach(commit => {
            weekly[commit.date.getDay()]++;
        });
        return weekly;
    }

    private analyzeMonthlyDistribution(commits: CommitData[]): number[] {
        const monthly = new Array(12).fill(0);
        commits.forEach(commit => {
            monthly[commit.date.getMonth()]++;
        });
        return monthly;
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