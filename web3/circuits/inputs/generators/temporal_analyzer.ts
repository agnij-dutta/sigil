import { CommitData } from '../../../types/index.js';

/**
 * Temporal Analyzer
 * 
 * Analyzes temporal patterns, consistency, and activity rhythms
 * from commit data to generate circuit-compatible temporal metrics.
 */

export interface TemporalAnalysisConfig {
    consistencyWindow: number; // days
    activityThreshold: number; // commits per day
    burnoutDetection: boolean;
    productivityAnalysis: boolean;
    seasonalityDetection: boolean;
}

export interface TemporalMetrics {
    consistencyScore: number;
    activityPattern: ActivityPattern;
    productivityTrends: ProductivityTrend[];
    workingHoursDistribution: number[];
    weeklyDistribution: number[];
    monthlyTrends: MonthlyTrend[];
    streakAnalysis: StreakAnalysis;
    burnoutRisk: BurnoutAssessment;
    seasonalityIndex: number;
}

export interface ActivityPattern {
    type: 'consistent' | 'sporadic' | 'bursty' | 'declining' | 'growing';
    peakHours: number[];
    peakDays: number[];
    intensityScore: number;
    regularity: number;
}

export interface ProductivityTrend {
    period: string;
    commitCount: number;
    linesChanged: number;
    filesModified: number;
    productivityScore: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MonthlyTrend {
    month: string;
    commits: number;
    productivity: number;
    consistency: number;
}

export interface StreakAnalysis {
    currentStreak: number;
    longestStreak: number;
    streakConsistency: number;
    averageStreakLength: number;
    totalActivedays: number;
}

export interface BurnoutAssessment {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    indicators: string[];
    recommendations: string[];
    workloadTrend: 'sustainable' | 'increasing' | 'excessive';
}

export interface TemporalCircuitInputs {
    consistencyScore: number;
    activityDays: number;
    peakProductivityHour: number;
    weeklyVariance: number;
    longestStreak: number;
    burnoutRisk: number;
    seasonalityScore: number;
    productivityTrend: number;
}

export class TemporalAnalyzer {
    private config: TemporalAnalysisConfig;

    constructor(config: TemporalAnalysisConfig) {
        this.config = config;
    }

    /**
     * Analyze temporal patterns from commit data
     */
    async analyzeTemporalPatterns(
        commits: CommitData[],
        userAddress: string
    ): Promise<{
        metrics: TemporalMetrics;
        circuitInputs: TemporalCircuitInputs;
        summary: TemporalSummary;
    }> {
        try {
            // Filter user commits and sort by timestamp
            const userCommits = commits
                .filter(c => c.author === userAddress)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            if (userCommits.length === 0) {
                return this.createEmptyAnalysis();
            }

            // Calculate consistency score
            const consistencyScore = this.calculateConsistencyScore(userCommits);
            
            // Analyze activity patterns
            const activityPattern = this.analyzeActivityPattern(userCommits);
            
            // Calculate productivity trends
            const productivityTrends = this.calculateProductivityTrends(userCommits);
            
            // Analyze time distributions
            const workingHoursDistribution = this.analyzeWorkingHours(userCommits);
            const weeklyDistribution = this.analyzeWeeklyDistribution(userCommits);
            const monthlyTrends = this.analyzeMonthlyTrends(userCommits);
            
            // Analyze streaks
            const streakAnalysis = this.analyzeStreaks(userCommits);
            
            // Assess burnout risk
            const burnoutRisk = this.assessBurnoutRisk(userCommits);
            
            // Calculate seasonality
            const seasonalityIndex = this.calculateSeasonalityIndex(userCommits);

            const metrics: TemporalMetrics = {
                consistencyScore,
                activityPattern,
                productivityTrends,
                workingHoursDistribution,
                weeklyDistribution,
                monthlyTrends,
                streakAnalysis,
                burnoutRisk,
                seasonalityIndex
            };

            // Generate circuit inputs
            const circuitInputs = this.generateCircuitInputs(metrics);
            
            // Create summary
            const summary = this.createTemporalSummary(metrics, userCommits);

            return {
                metrics,
                circuitInputs,
                summary
            };

        } catch (error) {
            throw new Error(`Temporal analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate consistency score based on commit patterns
     */
    private calculateConsistencyScore(commits: CommitData[]): number {
        if (commits.length < 2) return 0;

        // Calculate intervals between commits
        const intervals: number[] = [];
        for (let i = 1; i < commits.length; i++) {
            const interval = new Date(commits[i].timestamp).getTime() - 
                           new Date(commits[i-1].timestamp).getTime();
            intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
        }

        // Calculate coefficient of variation (lower = more consistent)
        const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => 
            sum + Math.pow(interval - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;

        // Convert to consistency score (0-100, higher = more consistent)
        // Use exponential decay to heavily penalize high variability
        const consistencyScore = Math.max(0, 100 * Math.exp(-cv));
        
        return Math.round(consistencyScore);
    }

    /**
     * Analyze activity patterns
     */
    private analyzeActivityPattern(commits: CommitData[]): ActivityPattern {
        const timestamps = commits.map(c => new Date(c.timestamp));
        
        // Analyze hourly distribution
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        
        timestamps.forEach(time => {
            hourCounts[time.getHours()]++;
            dayCounts[time.getDay()]++;
        });

        // Find peak hours and days
        const peakHours = this.findPeaks(hourCounts, 0.7);
        const peakDays = this.findPeaks(dayCounts, 0.7);

        // Calculate intensity and regularity
        const intensityScore = this.calculateIntensityScore(commits);
        const regularity = this.calculateRegularity(timestamps);

        // Determine activity type
        const type = this.determineActivityType(commits, intensityScore, regularity);

        return {
            type,
            peakHours,
            peakDays,
            intensityScore: Math.round(intensityScore),
            regularity: parseFloat(regularity.toFixed(2))
        };
    }

    /**
     * Calculate productivity trends over time
     */
    private calculateProductivityTrends(commits: CommitData[]): ProductivityTrend[] {
        const trends: ProductivityTrend[] = [];
        
        // Group commits by month
        const monthlyGroups = this.groupCommitsByMonth(commits);
        
        for (const [month, monthCommits] of monthlyGroups.entries()) {
            const commitCount = monthCommits.length;
            const linesChanged = monthCommits.reduce((sum, c) => 
                sum + (c.files?.reduce((fileSum, f) => 
                    fileSum + (f.additions || 0) + (f.deletions || 0), 0) || 0), 0);
            const filesModified = new Set(monthCommits.flatMap(c => 
                c.files?.map(f => f.filename) || [])).size;
            
            const productivityScore = this.calculateProductivityScore(
                commitCount, linesChanged, filesModified
            );

            trends.push({
                period: month,
                commitCount,
                linesChanged,
                filesModified,
                productivityScore: Math.round(productivityScore),
                trend: 'stable' // Will be calculated after all trends are collected
            });
        }

        // Calculate trend directions
        for (let i = 1; i < trends.length; i++) {
            const current = trends[i].productivityScore;
            const previous = trends[i-1].productivityScore;
            const change = (current - previous) / previous;
            
            if (change > 0.1) trends[i].trend = 'increasing';
            else if (change < -0.1) trends[i].trend = 'decreasing';
            else trends[i].trend = 'stable';
        }

        return trends;
    }

    /**
     * Analyze working hours distribution
     */
    private analyzeWorkingHours(commits: CommitData[]): number[] {
        const hourCounts = new Array(24).fill(0);
        
        commits.forEach(commit => {
            const hour = new Date(commit.timestamp).getHours();
            hourCounts[hour]++;
        });

        // Normalize to percentages
        const total = hourCounts.reduce((sum, count) => sum + count, 0);
        return hourCounts.map(count => total > 0 ? (count / total) * 100 : 0);
    }

    /**
     * Analyze weekly distribution
     */
    private analyzeWeeklyDistribution(commits: CommitData[]): number[] {
        const dayCounts = new Array(7).fill(0); // Sunday = 0, Monday = 1, etc.
        
        commits.forEach(commit => {
            const day = new Date(commit.timestamp).getDay();
            dayCounts[day]++;
        });

        // Normalize to percentages
        const total = dayCounts.reduce((sum, count) => sum + count, 0);
        return dayCounts.map(count => total > 0 ? (count / total) * 100 : 0);
    }

    /**
     * Analyze monthly trends
     */
    private analyzeMonthlyTrends(commits: CommitData[]): MonthlyTrend[] {
        const monthlyGroups = this.groupCommitsByMonth(commits);
        const trends: MonthlyTrend[] = [];

        for (const [month, monthCommits] of monthlyGroups.entries()) {
            const commits_count = monthCommits.length;
            const productivity = this.calculateMonthlyProductivity(monthCommits);
            const consistency = this.calculateMonthlyConsistency(monthCommits);

            trends.push({
                month,
                commits: commits_count,
                productivity: Math.round(productivity),
                consistency: Math.round(consistency)
            });
        }

        return trends.sort((a, b) => a.month.localeCompare(b.month));
    }

    /**
     * Analyze commit streaks
     */
    private analyzeStreaks(commits: CommitData[]): StreakAnalysis {
        const commitDates = commits.map(c => {
            const date = new Date(c.timestamp);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        });

        // Get unique dates and sort them
        const uniqueDates = Array.from(new Set(commitDates)).sort();
        
        if (uniqueDates.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                streakConsistency: 0,
                averageStreakLength: 0,
                totalActivedays: 0
            };
        }

        // Calculate streaks
        const streaks: number[] = [];
        let currentStreak = 1;
        let longestStreak = 1;
        
        for (let i = 1; i < uniqueDates.length; i++) {
            const dayDiff = (uniqueDates[i] - uniqueDates[i-1]) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                currentStreak++;
            } else {
                streaks.push(currentStreak);
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
        
        streaks.push(currentStreak);
        longestStreak = Math.max(longestStreak, currentStreak);

        // Calculate current streak (from most recent commit)
        const today = new Date();
        const lastCommitDate = new Date(Math.max(...uniqueDates));
        const daysSinceLastCommit = Math.floor((today.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24));
        const activeCurrentStreak = daysSinceLastCommit <= 1 ? currentStreak : 0;

        // Calculate average streak length and consistency
        const averageStreakLength = streaks.length > 0 ? 
            streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length : 0;
        
        const streakConsistency = this.calculateStreakConsistency(streaks);

        return {
            currentStreak: activeCurrentStreak,
            longestStreak,
            streakConsistency: parseFloat(streakConsistency.toFixed(2)),
            averageStreakLength: parseFloat(averageStreakLength.toFixed(1)),
            totalActivedays: uniqueDates.length
        };
    }

    /**
     * Assess burnout risk
     */
    private assessBurnoutRisk(commits: CommitData[]): BurnoutAssessment {
        const indicators: string[] = [];
        const recommendations: string[] = [];
        let riskScore = 0;

        // Analyze recent activity intensity
        const recentCommits = this.getRecentCommits(commits, 30); // Last 30 days
        const historicalAverage = this.calculateHistoricalAverage(commits);
        const recentAverage = recentCommits.length / 30;

        // High intensity indicator
        if (recentAverage > historicalAverage * 2) {
            riskScore += 30;
            indicators.push('High recent activity intensity');
            recommendations.push('Consider maintaining a more sustainable pace');
        }

        // Long working hours indicator
        const lateNightCommits = commits.filter(c => {
            const hour = new Date(c.timestamp).getHours();
            return hour >= 22 || hour <= 6;
        }).length;
        
        if (lateNightCommits / commits.length > 0.3) {
            riskScore += 25;
            indicators.push('Frequent late-night commits');
            recommendations.push('Try to maintain regular working hours');
        }

        // Weekend work indicator
        const weekendCommits = commits.filter(c => {
            const day = new Date(c.timestamp).getDay();
            return day === 0 || day === 6;
        }).length;
        
        if (weekendCommits / commits.length > 0.4) {
            riskScore += 20;
            indicators.push('High weekend activity');
            recommendations.push('Ensure adequate rest and work-life balance');
        }

        // Declining productivity indicator
        const productivityTrends = this.calculateProductivityTrends(commits);
        const recentTrends = productivityTrends.slice(-3);
        const decliningTrends = recentTrends.filter(t => t.trend === 'decreasing').length;
        
        if (decliningTrends >= 2) {
            riskScore += 15;
            indicators.push('Declining productivity trend');
            recommendations.push('Consider taking breaks to recharge');
        }

        // Irregular patterns indicator
        const consistency = this.calculateConsistencyScore(commits);
        if (consistency < 30) {
            riskScore += 10;
            indicators.push('Irregular work patterns');
            recommendations.push('Try to establish more consistent work rhythms');
        }

        // Determine risk level and workload trend
        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        if (riskScore >= 70) riskLevel = 'critical';
        else if (riskScore >= 50) riskLevel = 'high';
        else if (riskScore >= 30) riskLevel = 'medium';
        else riskLevel = 'low';

        const workloadTrend = recentAverage > historicalAverage * 1.5 ? 'excessive' :
                             recentAverage > historicalAverage * 1.2 ? 'increasing' : 'sustainable';

        return {
            riskLevel,
            riskScore: Math.round(riskScore),
            indicators,
            recommendations,
            workloadTrend
        };
    }

    /**
     * Calculate seasonality index
     */
    private calculateSeasonalityIndex(commits: CommitData[]): number {
        if (commits.length < 12) return 0; // Need at least a year of data

        const monthlyCommits = new Array(12).fill(0);
        
        commits.forEach(commit => {
            const month = new Date(commit.timestamp).getMonth();
            monthlyCommits[month]++;
        });

        // Calculate coefficient of variation for monthly distribution
        const mean = monthlyCommits.reduce((sum, count) => sum + count, 0) / 12;
        const variance = monthlyCommits.reduce((sum, count) => 
            sum + Math.pow(count - mean, 2), 0) / 12;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;

        // Convert to seasonality index (0-100, higher = more seasonal)
        return Math.min(100, Math.round(cv * 100));
    }

    /**
     * Generate circuit-compatible inputs
     */
    private generateCircuitInputs(metrics: TemporalMetrics): TemporalCircuitInputs {
        // Find peak productivity hour
        const peakHourIndex = metrics.workingHoursDistribution.indexOf(
            Math.max(...metrics.workingHoursDistribution)
        );

        // Calculate weekly variance
        const weeklyMean = metrics.weeklyDistribution.reduce((sum, count) => sum + count, 0) / 7;
        const weeklyVariance = metrics.weeklyDistribution.reduce((sum, count) => 
            sum + Math.pow(count - weeklyMean, 2), 0) / 7;

        // Calculate overall productivity trend
        const recentTrends = metrics.productivityTrends.slice(-3);
        const increasingTrends = recentTrends.filter(t => t.trend === 'increasing').length;
        const decreasingTrends = recentTrends.filter(t => t.trend === 'decreasing').length;
        const productivityTrend = increasingTrends > decreasingTrends ? 1 : 
                                 decreasingTrends > increasingTrends ? -1 : 0;

        return {
            consistencyScore: metrics.consistencyScore,
            activityDays: metrics.streakAnalysis.totalActivedays,
            peakProductivityHour: peakHourIndex,
            weeklyVariance: Math.round(weeklyVariance),
            longestStreak: metrics.streakAnalysis.longestStreak,
            burnoutRisk: metrics.burnoutRisk.riskScore,
            seasonalityScore: metrics.seasonalityIndex,
            productivityTrend: productivityTrend
        };
    }

    /**
     * Create temporal summary
     */
    private createTemporalSummary(metrics: TemporalMetrics, commits: CommitData[]): TemporalSummary {
        const workingStyle = this.determineWorkingStyle(metrics);
        const productivityPhase = this.determineProductivityPhase(metrics.productivityTrends);
        const timeManagementScore = this.calculateTimeManagementScore(metrics);
        const sustainabilityScore = 100 - metrics.burnoutRisk.riskScore;

        return {
            workingStyle,
            productivityPhase,
            timeManagementScore: Math.round(timeManagementScore),
            sustainabilityScore: Math.round(sustainabilityScore),
            keyInsights: this.generateKeyInsights(metrics),
            recommendations: this.generateRecommendations(metrics)
        };
    }

    /**
     * Create empty analysis for users with no commits
     */
    private createEmptyAnalysis() {
        const emptyMetrics: TemporalMetrics = {
            consistencyScore: 0,
            activityPattern: {
                type: 'sporadic',
                peakHours: [],
                peakDays: [],
                intensityScore: 0,
                regularity: 0
            },
            productivityTrends: [],
            workingHoursDistribution: new Array(24).fill(0),
            weeklyDistribution: new Array(7).fill(0),
            monthlyTrends: [],
            streakAnalysis: {
                currentStreak: 0,
                longestStreak: 0,
                streakConsistency: 0,
                averageStreakLength: 0,
                totalActivedays: 0
            },
            burnoutRisk: {
                riskLevel: 'low',
                riskScore: 0,
                indicators: [],
                recommendations: [],
                workloadTrend: 'sustainable'
            },
            seasonalityIndex: 0
        };

        const emptyCircuitInputs: TemporalCircuitInputs = {
            consistencyScore: 0,
            activityDays: 0,
            peakProductivityHour: 9,
            weeklyVariance: 0,
            longestStreak: 0,
            burnoutRisk: 0,
            seasonalityScore: 0,
            productivityTrend: 0
        };

        const emptySummary: TemporalSummary = {
            workingStyle: 'inactive',
            productivityPhase: 'stable',
            timeManagementScore: 0,
            sustainabilityScore: 100,
            keyInsights: ['No activity detected'],
            recommendations: ['Start contributing to establish patterns']
        };

        return {
            metrics: emptyMetrics,
            circuitInputs: emptyCircuitInputs,
            summary: emptySummary
        };
    }

    // Helper methods
    private findPeaks(distribution: number[], threshold: number): number[] {
        const maxValue = Math.max(...distribution);
        const peakThreshold = maxValue * threshold;
        
        return distribution
            .map((value, index) => ({ value, index }))
            .filter(item => item.value >= peakThreshold)
            .map(item => item.index);
    }

    private calculateIntensityScore(commits: CommitData[]): number {
        if (commits.length === 0) return 0;

        const timeSpan = this.getTimeSpanInDays(commits);
        const commitsPerDay = commits.length / Math.max(1, timeSpan);
        
        // Normalize to 0-100 scale
        return Math.min(100, commitsPerDay * 20);
    }

    private calculateRegularity(timestamps: Date[]): number {
        if (timestamps.length < 2) return 0;

        // Calculate intervals between commits
        const intervals: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i].getTime() - timestamps[i-1].getTime();
            intervals.push(interval);
        }

        // Calculate coefficient of variation (lower = more regular)
        const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => 
            sum + Math.pow(interval - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;

        // Convert to regularity score (0-1, higher = more regular)
        return Math.max(0, 1 - Math.min(1, cv));
    }

    private determineActivityType(
        commits: CommitData[], 
        intensityScore: number, 
        regularity: number
    ): ActivityPattern['type'] {
        if (commits.length === 0) return 'sporadic';
        
        const recentCommits = this.getRecentCommits(commits, 90);
        const historicalAverage = this.calculateHistoricalAverage(commits);
        const recentAverage = recentCommits.length / 90;

        if (regularity > 0.7 && intensityScore > 30) return 'consistent';
        if (recentAverage > historicalAverage * 1.5) return 'growing';
        if (recentAverage < historicalAverage * 0.5) return 'declining';
        if (intensityScore > 60 && regularity < 0.3) return 'bursty';
        return 'sporadic';
    }

    private groupCommitsByMonth(commits: CommitData[]): Map<string, CommitData[]> {
        const groups = new Map<string, CommitData[]>();

        commits.forEach(commit => {
            const date = new Date(commit.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groups.has(monthKey)) {
                groups.set(monthKey, []);
            }
            groups.get(monthKey)!.push(commit);
        });

        return groups;
    }

    private calculateProductivityScore(
        commitCount: number, 
        linesChanged: number, 
        filesModified: number
    ): number {
        // Weighted productivity score
        const commitScore = Math.min(40, commitCount * 2);
        const linesScore = Math.min(40, linesChanged / 100);
        const filesScore = Math.min(20, filesModified);
        
        return commitScore + linesScore + filesScore;
    }

    private calculateMonthlyProductivity(commits: CommitData[]): number {
        const linesChanged = commits.reduce((sum, c) => 
            sum + (c.files?.reduce((fileSum, f) => 
                fileSum + (f.additions || 0) + (f.deletions || 0), 0) || 0), 0);
        const filesModified = new Set(commits.flatMap(c => 
            c.files?.map(f => f.filename) || [])).size;
        
        return this.calculateProductivityScore(commits.length, linesChanged, filesModified);
    }

    private calculateMonthlyConsistency(commits: CommitData[]): number {
        if (commits.length < 2) return 0;
        
        // Group by days in the month
        const dailyCommits = new Map<string, number>();
        commits.forEach(commit => {
            const date = new Date(commit.timestamp);
            const dayKey = date.getDate().toString();
            dailyCommits.set(dayKey, (dailyCommits.get(dayKey) || 0) + 1);
        });

        // Calculate consistency based on daily distribution
        const days = Array.from(dailyCommits.values());
        if (days.length <= 1) return 0;

        const mean = days.reduce((sum, count) => sum + count, 0) / days.length;
        const variance = days.reduce((sum, count) => 
            sum + Math.pow(count - mean, 2), 0) / days.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;

        return Math.max(0, 100 * (1 - cv));
    }

    private calculateStreakConsistency(streaks: number[]): number {
        if (streaks.length === 0) return 0;
        
        const mean = streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length;
        const variance = streaks.reduce((sum, streak) => 
            sum + Math.pow(streak - mean, 2), 0) / streaks.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;

        // Convert to consistency score (0-1)
        return Math.max(0, 1 - Math.min(1, cv));
    }

    private getRecentCommits(commits: CommitData[], days: number): CommitData[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return commits.filter(c => new Date(c.timestamp) >= cutoffDate);
    }

    private calculateHistoricalAverage(commits: CommitData[]): number {
        if (commits.length === 0) return 0;
        
        const timeSpan = this.getTimeSpanInDays(commits);
        return commits.length / Math.max(1, timeSpan);
    }

    private getTimeSpanInDays(commits: CommitData[]): number {
        if (commits.length === 0) return 1;
        
        const timestamps = commits.map(c => new Date(c.timestamp).getTime());
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);
        
        return Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24));
    }

    private determineWorkingStyle(metrics: TemporalMetrics): string {
        const { activityPattern, workingHoursDistribution, weeklyDistribution } = metrics;
        
        // Analyze working hours
        const businessHours = workingHoursDistribution.slice(9, 17).reduce((sum, pct) => sum + pct, 0);
        const eveningHours = workingHoursDistribution.slice(18, 23).reduce((sum, pct) => sum + pct, 0);
        const nightHours = [...workingHoursDistribution.slice(0, 6), ...workingHoursDistribution.slice(23)].reduce((sum, pct) => sum + pct, 0);
        
        // Analyze weekly pattern
        const weekdayHours = weeklyDistribution.slice(1, 6).reduce((sum, pct) => sum + pct, 0);
        const weekendHours = weeklyDistribution[0] + weeklyDistribution[6];
        
        if (businessHours > 60 && weekdayHours > 70) return 'Traditional Business Hours';
        if (eveningHours > 40) return 'Evening Focused';
        if (nightHours > 30) return 'Night Owl';
        if (weekendHours > 40) return 'Weekend Warrior';
        if (activityPattern.regularity > 0.7) return 'Highly Consistent';
        if (activityPattern.type === 'bursty') return 'Sprint Worker';
        return 'Flexible Schedule';
    }

    private determineProductivityPhase(trends: ProductivityTrend[]): string {
        if (trends.length < 3) return 'stable';
        
        const recentTrends = trends.slice(-3);
        const increasingCount = recentTrends.filter(t => t.trend === 'increasing').length;
        const decreasingCount = recentTrends.filter(t => t.trend === 'decreasing').length;
        
        if (increasingCount >= 2) return 'growth';
        if (decreasingCount >= 2) return 'decline';
        return 'stable';
    }

    private calculateTimeManagementScore(metrics: TemporalMetrics): number {
        let score = 0;
        
        // Consistency bonus
        score += metrics.consistencyScore * 0.4;
        
        // Regularity bonus
        score += metrics.activityPattern.regularity * 40;
        
        // Sustainable hours bonus (penalize excessive late night work)
        const lateNightPct = [...metrics.workingHoursDistribution.slice(0, 6), 
                              ...metrics.workingHoursDistribution.slice(22)].reduce((sum, pct) => sum + pct, 0);
        score += Math.max(0, 20 - lateNightPct);
        
        return Math.min(100, score);
    }

    private generateKeyInsights(metrics: TemporalMetrics): string[] {
        const insights: string[] = [];
        
        if (metrics.consistencyScore > 70) {
            insights.push('Highly consistent work patterns');
        }
        
        if (metrics.streakAnalysis.longestStreak > 30) {
            insights.push(`Impressive ${metrics.streakAnalysis.longestStreak}-day contribution streak`);
        }
        
        if (metrics.activityPattern.intensityScore > 70) {
            insights.push('High development activity intensity');
        }
        
        if (metrics.burnoutRisk.riskLevel === 'low') {
            insights.push('Sustainable work-life balance');
        }
        
        if (metrics.seasonalityIndex > 50) {
            insights.push('Strong seasonal activity patterns');
        }
        
        return insights.length > 0 ? insights : ['Regular development activity'];
    }

    private generateRecommendations(metrics: TemporalMetrics): string[] {
        const recommendations: string[] = [];
        
        if (metrics.consistencyScore < 40) {
            recommendations.push('Consider establishing more regular contribution patterns');
        }
        
        if (metrics.burnoutRisk.riskLevel !== 'low') {
            recommendations.push('Monitor workload to prevent burnout');
        }
        
        if (metrics.activityPattern.regularity < 0.3) {
            recommendations.push('Try to develop more predictable work rhythms');
        }
        
        return recommendations.length > 0 ? recommendations : ['Continue current sustainable practices'];
    }
}

// Supporting interfaces
interface TemporalSummary {
    workingStyle: string;
    productivityPhase: string;
    timeManagementScore: number;
    sustainabilityScore: number;
    keyInsights: string[];
    recommendations: string[];
}

export default TemporalAnalyzer;