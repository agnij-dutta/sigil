import { createHash } from 'crypto';
import { CommitData, CollaboratorData, RepositoryData } from '../../../types/index.js';

/**
 * Collaboration Analyzer
 * 
 * Analyzes collaboration patterns, team dynamics, and leadership indicators
 * from repository commit data and contributor information.
 */

export interface CollaborationAnalysisConfig {
    maxCollaborators: number;
    minContributionsThreshold: number;
    leadershipDetection: boolean;
    mentorshipAnalysis: boolean;
    teamDynamicsScoring: boolean;
}

export interface CollaborationMetrics {
    totalCollaborators: number;
    activeCollaborators: number;
    contributionDistribution: number[];
    teamDiversityScore: number;
    collaborationIntensity: number;
    communicationFrequency: number;
    knowledgeSharingScore: number;
    leadershipScore: number;
}

export interface LeadershipIndicators {
    architecturalLeadership: boolean;
    technicalMentorship: boolean;
    processImprovement: boolean;
    documentationLeadership: boolean;
    codeReviewLeadership: boolean;
    projectManagement: boolean;
    innovationDriving: boolean;
    teamBuilding: boolean;
}

export interface TeamDynamics {
    coreTeamSize: number;
    peripheralContributors: number;
    collaborationClusters: CollaborationCluster[];
    workflowPatterns: WorkflowPattern[];
    conflictResolutionScore: number;
    decisionMakingStyle: 'centralized' | 'distributed' | 'consensus';
    knowledgeDistribution: 'concentrated' | 'balanced' | 'dispersed';
}

export interface CollaborationCluster {
    members: string[];
    collaborationStrength: number;
    sharedProjects: string[];
    communicationPatterns: string[];
}

export interface WorkflowPattern {
    pattern: string;
    frequency: number;
    participants: string[];
    effectiveness: number;
}

export interface CollaborationCircuitInputs {
    collaboratorHashes: string[];
    contributionPercentages: number[];
    collaborationScores: number[];
    leadershipIndicators: number[];
    teamDiversityScore: number;
    isOwner: number;
    isSoleContributor: number;
    mentorshipScore: number;
}

export class CollaborationAnalyzer {
    private config: CollaborationAnalysisConfig;
    private hashSalt: string;

    constructor(config: CollaborationAnalysisConfig) {
        this.config = config;
        this.hashSalt = process.env.HASH_SALT || 'sigil_collaboration_salt_2024';
    }

    /**
     * Analyze collaboration patterns from repository data
     */
    async analyzeCollaboration(
        repoData: RepositoryData,
        userAddress: string
    ): Promise<{
        metrics: CollaborationMetrics;
        leadership: LeadershipIndicators;
        teamDynamics: TeamDynamics;
        circuitInputs: CollaborationCircuitInputs;
        summary: CollaborationSummary;
    }> {
        try {
            // Extract collaboration data
            const collaborationData = this.extractCollaborationData(repoData, userAddress);
            
            // Calculate basic metrics
            const metrics = this.calculateCollaborationMetrics(collaborationData);
            
            // Analyze leadership patterns
            const leadership = this.analyzeLeadershipIndicators(collaborationData);
            
            // Analyze team dynamics
            const teamDynamics = this.analyzeTeamDynamics(collaborationData);
            
            // Generate circuit inputs
            const circuitInputs = this.generateCircuitInputs(
                collaborationData, metrics, leadership, teamDynamics
            );
            
            // Create summary
            const summary = this.createCollaborationSummary(
                metrics, leadership, teamDynamics, collaborationData
            );

            return {
                metrics,
                leadership,
                teamDynamics,
                circuitInputs,
                summary
            };

        } catch (error) {
            throw new Error(`Collaboration analysis failed: ${error.message}`);
        }
    }

    /**
     * Extract collaboration data from repository
     */
    private extractCollaborationData(repoData: RepositoryData, userAddress: string) {
        const commits = repoData.commits || [];
        const collaborators = repoData.collaborators || [];
        
        // Separate user and other commits
        const userCommits = commits.filter(c => c.author === userAddress);
        const otherCommits = commits.filter(c => c.author !== userAddress);
        
        // Calculate contribution statistics
        const contributionStats = this.calculateContributionStats(commits, userAddress);
        
        // Analyze commit patterns
        const commitPatterns = this.analyzeCommitPatterns(commits, userAddress);
        
        // Extract collaboration events
        const collaborationEvents = this.extractCollaborationEvents(commits, userAddress);
        
        // Analyze file overlap patterns
        const fileOverlapPatterns = this.analyzeFileOverlapPatterns(commits, userAddress);

        return {
            repoData,
            userAddress,
            commits,
            userCommits,
            otherCommits,
            collaborators,
            contributionStats,
            commitPatterns,
            collaborationEvents,
            fileOverlapPatterns,
            isOwner: repoData.owner === userAddress,
            isSoleContributor: commits.every(c => c.author === userAddress)
        };
    }

    /**
     * Calculate basic collaboration metrics
     */
    private calculateCollaborationMetrics(data: any): CollaborationMetrics {
        const { commits, collaborators, contributionStats, userAddress } = data;
        
        // Total and active collaborators
        const totalCollaborators = collaborators.length;
        const activeCollaborators = collaborators.filter(c => 
            (c.contributions || 0) >= this.config.minContributionsThreshold
        ).length;
        
        // Contribution distribution
        const contributionDistribution = this.calculateContributionDistribution(contributionStats);
        
        // Team diversity score
        const teamDiversityScore = this.calculateTeamDiversityScore(contributionStats);
        
        // Collaboration intensity
        const collaborationIntensity = this.calculateCollaborationIntensity(data);
        
        // Communication frequency
        const communicationFrequency = this.calculateCommunicationFrequency(data);
        
        // Knowledge sharing score
        const knowledgeSharingScore = this.calculateKnowledgeSharingScore(data);
        
        // Leadership score
        const leadershipScore = this.calculateLeadershipScore(data);

        return {
            totalCollaborators,
            activeCollaborators,
            contributionDistribution,
            teamDiversityScore: parseFloat(teamDiversityScore.toFixed(2)),
            collaborationIntensity: parseFloat(collaborationIntensity.toFixed(2)),
            communicationFrequency: parseFloat(communicationFrequency.toFixed(2)),
            knowledgeSharingScore: Math.round(knowledgeSharingScore),
            leadershipScore: Math.round(leadershipScore)
        };
    }

    /**
     * Analyze leadership indicators
     */
    private analyzeLeadershipIndicators(data: any): LeadershipIndicators {
        const { userCommits, commits, fileOverlapPatterns } = data;
        
        // Architectural leadership - significant refactoring/architecture commits
        const architecturalLeadership = this.detectArchitecturalLeadership(userCommits);
        
        // Technical mentorship - helping patterns in commits
        const technicalMentorship = this.detectTechnicalMentorship(userCommits, commits);
        
        // Process improvement - CI/CD, tooling, workflow improvements
        const processImprovement = this.detectProcessImprovement(userCommits);
        
        // Documentation leadership - significant documentation contributions
        const documentationLeadership = this.detectDocumentationLeadership(userCommits);
        
        // Code review leadership - patterns suggesting review responsibilities
        const codeReviewLeadership = this.detectCodeReviewLeadership(data);
        
        // Project management - coordination and planning indicators
        const projectManagement = this.detectProjectManagement(userCommits);
        
        // Innovation driving - introduction of new technologies/patterns
        const innovationDriving = this.detectInnovationDriving(userCommits);
        
        // Team building - onboarding and collaboration facilitation
        const teamBuilding = this.detectTeamBuilding(data);

        return {
            architecturalLeadership,
            technicalMentorship,
            processImprovement,
            documentationLeadership,
            codeReviewLeadership,
            projectManagement,
            innovationDriving,
            teamBuilding
        };
    }

    /**
     * Analyze team dynamics
     */
    private analyzeTeamDynamics(data: any): TeamDynamics {
        const { collaborators, contributionStats } = data;
        
        // Identify core team vs peripheral contributors
        const { coreTeamSize, peripheralContributors } = this.identifyTeamStructure(contributionStats);
        
        // Detect collaboration clusters
        const collaborationClusters = this.detectCollaborationClusters(data);
        
        // Identify workflow patterns
        const workflowPatterns = this.identifyWorkflowPatterns(data);
        
        // Calculate conflict resolution score
        const conflictResolutionScore = this.calculateConflictResolutionScore(data);
        
        // Determine decision making style
        const decisionMakingStyle = this.determineDecisionMakingStyle(data);
        
        // Assess knowledge distribution
        const knowledgeDistribution = this.assessKnowledgeDistribution(data);

        return {
            coreTeamSize,
            peripheralContributors,
            collaborationClusters,
            workflowPatterns,
            conflictResolutionScore: Math.round(conflictResolutionScore),
            decisionMakingStyle,
            knowledgeDistribution
        };
    }

    /**
     * Generate circuit-compatible inputs
     */
    private generateCircuitInputs(
        data: any,
        metrics: CollaborationMetrics,
        leadership: LeadershipIndicators,
        teamDynamics: TeamDynamics
    ): CollaborationCircuitInputs {
        const { collaborators, contributionStats, isOwner, isSoleContributor } = data;
        const maxCollaborators = this.config.maxCollaborators;
        
        // Hash collaborator identifiers
        const collaboratorHashes = collaborators
            .slice(0, maxCollaborators)
            .map(c => this.hashCollaborator(c.login))
            .concat(Array(Math.max(0, maxCollaborators - collaborators.length)).fill('0'));
        
        // Calculate contribution percentages
        const totalContributions = Object.values(contributionStats).reduce((sum: number, count: any) => sum + count, 0);
        const contributionPercentages = collaborators
            .slice(0, maxCollaborators)
            .map(c => totalContributions > 0 ? Math.round((contributionStats[c.login] || 0) / totalContributions * 100) : 0)
            .concat(Array(Math.max(0, maxCollaborators - collaborators.length)).fill(0));
        
        // Calculate individual collaboration scores
        const collaborationScores = collaborators
            .slice(0, maxCollaborators)
            .map(c => this.calculateIndividualCollaborationScore(c, data))
            .concat(Array(Math.max(0, maxCollaborators - collaborators.length)).fill(0));
        
        // Encode leadership indicators as bit flags
        const leadershipBits = [
            leadership.architecturalLeadership,
            leadership.technicalMentorship,
            leadership.processImprovement,
            leadership.documentationLeadership,
            leadership.codeReviewLeadership,
            leadership.projectManagement,
            leadership.innovationDriving,
            leadership.teamBuilding
        ];
        const leadershipIndicators = leadershipBits.map(bit => bit ? 1 : 0);
        
        // Calculate mentorship score
        const mentorshipScore = this.calculateMentorshipScore(leadership);

        return {
            collaboratorHashes,
            contributionPercentages,
            collaborationScores,
            leadershipIndicators,
            teamDiversityScore: Math.round(metrics.teamDiversityScore * 100),
            isOwner: isOwner ? 1 : 0,
            isSoleContributor: isSoleContributor ? 1 : 0,
            mentorshipScore: Math.round(mentorshipScore)
        };
    }

    /**
     * Create collaboration summary
     */
    private createCollaborationSummary(
        metrics: CollaborationMetrics,
        leadership: LeadershipIndicators,
        teamDynamics: TeamDynamics,
        data: any
    ): CollaborationSummary {
        const leadershipCount = Object.values(leadership).filter(Boolean).length;
        const collaborationLevel = this.assessCollaborationLevel(metrics, teamDynamics);
        const teamHealthScore = this.calculateTeamHealthScore(metrics, teamDynamics);
        const influenceScore = this.calculateInfluenceScore(leadership, metrics);
        
        return {
            collaborationLevel,
            teamHealthScore: Math.round(teamHealthScore),
            leadershipAreasCount: leadershipCount,
            influenceScore: Math.round(influenceScore),
            recommendedRole: this.recommendRole(leadership, metrics, teamDynamics),
            strengthAreas: this.identifyStrengthAreas(leadership, metrics),
            improvementAreas: this.identifyImprovementAreas(metrics, teamDynamics)
        };
    }

    // Helper methods for detailed analysis
    private calculateContributionStats(commits: CommitData[], userAddress: string) {
        const stats: { [author: string]: number } = {};
        
        commits.forEach(commit => {
            stats[commit.author] = (stats[commit.author] || 0) + 1;
        });
        
        return stats;
    }

    private analyzeCommitPatterns(commits: CommitData[], userAddress: string) {
        const userCommits = commits.filter(c => c.author === userAddress);
        
        // Analyze commit timing patterns
        const commitTimes = userCommits.map(c => new Date(c.timestamp));
        const timePatterns = this.analyzeTimePatterns(commitTimes);
        
        // Analyze commit message patterns
        const messagePatterns = this.analyzeMessagePatterns(userCommits);
        
        // Analyze file change patterns
        const filePatterns = this.analyzeFileChangePatterns(userCommits);
        
        return {
            timePatterns,
            messagePatterns,
            filePatterns
        };
    }

    private extractCollaborationEvents(commits: CommitData[], userAddress: string) {
        const events: CollaborationEvent[] = [];
        
        // Look for merge commits (collaboration indicators)
        commits.forEach(commit => {
            if (commit.message?.toLowerCase().includes('merge') && commit.author === userAddress) {
                events.push({
                    type: 'merge',
                    timestamp: new Date(commit.timestamp),
                    participants: [commit.author],
                    significance: this.calculateEventSignificance(commit)
                });
            }
            
            // Look for fix/help commits
            if (commit.message?.toLowerCase().includes('fix') || 
                commit.message?.toLowerCase().includes('help')) {
                events.push({
                    type: 'assistance',
                    timestamp: new Date(commit.timestamp),
                    participants: [commit.author],
                    significance: this.calculateEventSignificance(commit)
                });
            }
        });
        
        return events;
    }

    private analyzeFileOverlapPatterns(commits: CommitData[], userAddress: string) {
        const userFiles = new Set<string>();
        const otherFiles = new Map<string, Set<string>>();
        
        commits.forEach(commit => {
            const files = commit.files?.map(f => f.filename) || [];
            
            if (commit.author === userAddress) {
                files.forEach(file => userFiles.add(file));
            } else {
                if (!otherFiles.has(commit.author)) {
                    otherFiles.set(commit.author, new Set());
                }
                files.forEach(file => otherFiles.get(commit.author)!.add(file));
            }
        });
        
        // Calculate overlap scores
        const overlapScores = new Map<string, number>();
        for (const [author, files] of otherFiles.entries()) {
            const intersection = new Set([...userFiles].filter(f => files.has(f)));
            const union = new Set([...userFiles, ...files]);
            const overlapScore = union.size > 0 ? intersection.size / union.size : 0;
            overlapScores.set(author, overlapScore);
        }
        
        return {
            userFiles: Array.from(userFiles),
            overlapScores: Object.fromEntries(overlapScores)
        };
    }

    private calculateContributionDistribution(contributionStats: { [author: string]: number }): number[] {
        const contributions = Object.values(contributionStats);
        const total = contributions.reduce((sum, count) => sum + count, 0);
        
        return contributions.map(count => total > 0 ? (count / total) * 100 : 0);
    }

    private calculateTeamDiversityScore(contributionStats: { [author: string]: number }): number {
        const contributions = Object.values(contributionStats);
        if (contributions.length <= 1) return 0;
        
        // Calculate Gini coefficient (0 = perfect equality, 1 = perfect inequality)
        const sortedContributions = contributions.sort((a, b) => a - b);
        const n = sortedContributions.length;
        const sum = sortedContributions.reduce((acc, val) => acc + val, 0);
        
        if (sum === 0) return 0;
        
        let giniSum = 0;
        for (let i = 0; i < n; i++) {
            giniSum += (2 * (i + 1) - n - 1) * sortedContributions[i];
        }
        
        const gini = giniSum / (n * sum);
        
        // Convert to diversity score (1 - gini, so higher = more diverse)
        return 1 - gini;
    }

    private calculateCollaborationIntensity(data: any): number {
        const { commits, collaborationEvents, fileOverlapPatterns } = data;
        
        let intensity = 0;
        
        // Base intensity from number of collaborators
        const uniqueAuthors = new Set(commits.map(c => c.author)).size;
        intensity += Math.min(50, uniqueAuthors * 5);
        
        // Bonus from collaboration events
        intensity += Math.min(25, collaborationEvents.length * 2);
        
        // Bonus from file overlap
        const avgOverlap = Object.values(fileOverlapPatterns.overlapScores).reduce((sum: number, score: any) => sum + score, 0) / 
                          Object.keys(fileOverlapPatterns.overlapScores).length || 0;
        intensity += avgOverlap * 25;
        
        return Math.min(100, intensity);
    }

    private calculateCommunicationFrequency(data: any): number {
        const { commits, collaborationEvents } = data;
        
        // Estimate communication from commit patterns and collaboration events
        const commitFrequency = commits.length / Math.max(1, this.getRepositoryAgeInDays(commits));
        const eventFrequency = collaborationEvents.length / Math.max(1, this.getRepositoryAgeInDays(commits));
        
        return Math.min(100, (commitFrequency + eventFrequency) * 10);
    }

    private calculateKnowledgeSharingScore(data: any): number {
        const { userCommits, fileOverlapPatterns } = data;
        
        let score = 0;
        
        // Documentation commits
        const docCommits = userCommits.filter(c => 
            c.files?.some(f => f.filename.toLowerCase().includes('readme') ||
                              f.filename.toLowerCase().includes('doc') ||
                              f.filename.toLowerCase().includes('wiki'))
        ).length;
        score += Math.min(30, docCommits * 5);
        
        // Comment/help commits
        const helpCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('comment') ||
            c.message?.toLowerCase().includes('explain') ||
            c.message?.toLowerCase().includes('help')
        ).length;
        score += Math.min(30, helpCommits * 3);
        
        // File sharing (working on files others also work on)
        const avgOverlap = Object.values(fileOverlapPatterns.overlapScores).reduce((sum: number, score: any) => sum + score, 0) / 
                          Object.keys(fileOverlapPatterns.overlapScores).length || 0;
        score += avgOverlap * 40;
        
        return Math.min(100, score);
    }

    private calculateLeadershipScore(data: any): number {
        const { userCommits, contributionStats, userAddress } = data;
        
        let score = 0;
        
        // Contribution leadership (being a top contributor)
        const userContributions = contributionStats[userAddress] || 0;
        const totalContributions = Object.values(contributionStats).reduce((sum: number, count: any) => sum + count, 0);
        const contributionPercentage = totalContributions > 0 ? (userContributions / totalContributions) * 100 : 0;
        
        if (contributionPercentage >= 50) score += 40;
        else if (contributionPercentage >= 30) score += 30;
        else if (contributionPercentage >= 20) score += 20;
        else if (contributionPercentage >= 10) score += 10;
        
        // Technical leadership indicators
        const techLeadershipCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('architect') ||
            c.message?.toLowerCase().includes('design') ||
            c.message?.toLowerCase().includes('refactor') ||
            c.message?.toLowerCase().includes('optimize')
        ).length;
        score += Math.min(30, techLeadershipCommits * 3);
        
        // Process leadership indicators
        const processCommits = userCommits.filter(c =>
            c.files?.some(f => f.filename.includes('ci') ||
                              f.filename.includes('docker') ||
                              f.filename.includes('workflow') ||
                              f.filename.includes('makefile'))
        ).length;
        score += Math.min(30, processCommits * 5);
        
        return Math.min(100, score);
    }

    // Additional helper methods for leadership detection
    private detectArchitecturalLeadership(userCommits: CommitData[]): boolean {
        const archCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('architect') ||
            c.message?.toLowerCase().includes('design') ||
            c.message?.toLowerCase().includes('refactor') ||
            c.message?.toLowerCase().includes('restructure')
        );
        
        return archCommits.length >= 3;
    }

    private detectTechnicalMentorship(userCommits: CommitData[], allCommits: CommitData[]): boolean {
        const helpCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('help') ||
            c.message?.toLowerCase().includes('fix') ||
            c.message?.toLowerCase().includes('guide') ||
            c.message?.toLowerCase().includes('teach')
        );
        
        return helpCommits.length >= 5;
    }

    private detectProcessImprovement(userCommits: CommitData[]): boolean {
        const processCommits = userCommits.filter(c =>
            c.files?.some(f => 
                f.filename.includes('ci') ||
                f.filename.includes('docker') ||
                f.filename.includes('workflow') ||
                f.filename.includes('makefile') ||
                f.filename.includes('config')
            )
        );
        
        return processCommits.length >= 2;
    }

    private detectDocumentationLeadership(userCommits: CommitData[]): boolean {
        const docCommits = userCommits.filter(c =>
            c.files?.some(f =>
                f.filename.toLowerCase().includes('readme') ||
                f.filename.toLowerCase().includes('doc') ||
                f.filename.toLowerCase().includes('wiki') ||
                f.filename.toLowerCase().includes('guide')
            )
        );
        
        return docCommits.length >= 3;
    }

    private detectCodeReviewLeadership(data: any): boolean {
        // This would typically require access to PR/review data
        // For now, we'll use merge commits as a proxy
        const { userCommits } = data;
        
        const mergeCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('merge') ||
            c.message?.toLowerCase().includes('review')
        );
        
        return mergeCommits.length >= 5;
    }

    private detectProjectManagement(userCommits: CommitData[]): boolean {
        const pmCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('milestone') ||
            c.message?.toLowerCase().includes('release') ||
            c.message?.toLowerCase().includes('version') ||
            c.message?.toLowerCase().includes('roadmap')
        );
        
        return pmCommits.length >= 2;
    }

    private detectInnovationDriving(userCommits: CommitData[]): boolean {
        const innovationCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('new') ||
            c.message?.toLowerCase().includes('experimental') ||
            c.message?.toLowerCase().includes('prototype') ||
            c.message?.toLowerCase().includes('innovate')
        );
        
        return innovationCommits.length >= 3;
    }

    private detectTeamBuilding(data: any): boolean {
        const { userCommits, collaborationEvents } = data;
        
        const teamBuildingCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('onboard') ||
            c.message?.toLowerCase().includes('welcome') ||
            c.message?.toLowerCase().includes('setup') ||
            c.message?.toLowerCase().includes('getting started')
        );
        
        const collaborationEventCount = collaborationEvents.filter(e => e.type === 'assistance').length;
        
        return teamBuildingCommits.length >= 2 || collaborationEventCount >= 5;
    }

    // Additional helper methods
    private identifyTeamStructure(contributionStats: { [author: string]: number }) {
        const contributions = Object.values(contributionStats).sort((a, b) => b - a);
        const total = contributions.reduce((sum, count) => sum + count, 0);
        
        let coreTeamSize = 0;
        let cumulativeContributions = 0;
        
        // Core team: contributors who together make up 80% of contributions
        for (const contribution of contributions) {
            cumulativeContributions += contribution;
            coreTeamSize++;
            
            if (cumulativeContributions >= total * 0.8) {
                break;
            }
        }
        
        const peripheralContributors = contributions.length - coreTeamSize;
        
        return { coreTeamSize, peripheralContributors };
    }

    private detectCollaborationClusters(data: any): CollaborationCluster[] {
        // Simplified clustering based on file overlap
        const { fileOverlapPatterns, collaborators } = data;
        const clusters: CollaborationCluster[] = [];
        
        // For now, create a simple cluster of highly overlapping contributors
        const highOverlapCollaborators = Object.entries(fileOverlapPatterns.overlapScores)
            .filter(([_, score]: [string, any]) => score > 0.3)
            .map(([author, _]) => author);
        
        if (highOverlapCollaborators.length > 1) {
            clusters.push({
                members: highOverlapCollaborators,
                collaborationStrength: 0.8,
                sharedProjects: ['main'],
                communicationPatterns: ['file_overlap', 'commit_coordination']
            });
        }
        
        return clusters;
    }

    private identifyWorkflowPatterns(data: any): WorkflowPattern[] {
        const patterns: WorkflowPattern[] = [];
        
        // Feature development pattern
        const { userCommits } = data;
        const featureCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('feature') ||
            c.message?.toLowerCase().includes('add')
        );
        
        if (featureCommits.length >= 3) {
            patterns.push({
                pattern: 'feature_development',
                frequency: featureCommits.length,
                participants: [data.userAddress],
                effectiveness: 0.8
            });
        }
        
        // Bug fix pattern
        const bugFixCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('fix') ||
            c.message?.toLowerCase().includes('bug')
        );
        
        if (bugFixCommits.length >= 2) {
            patterns.push({
                pattern: 'bug_fixing',
                frequency: bugFixCommits.length,
                participants: [data.userAddress],
                effectiveness: 0.9
            });
        }
        
        return patterns;
    }

    private calculateConflictResolutionScore(data: any): number {
        // Simplified conflict resolution scoring
        const { userCommits } = data;
        
        const conflictResolutionCommits = userCommits.filter(c =>
            c.message?.toLowerCase().includes('resolve') ||
            c.message?.toLowerCase().includes('conflict') ||
            c.message?.toLowerCase().includes('merge conflict')
        );
        
        return Math.min(100, conflictResolutionCommits.length * 20);
    }

    private determineDecisionMakingStyle(data: any): 'centralized' | 'distributed' | 'consensus' {
        const { contributionStats, isOwner } = data;
        const contributions = Object.values(contributionStats);
        const maxContribution = Math.max(...contributions);
        const totalContributions = contributions.reduce((sum: number, count: any) => sum + count, 0);
        
        const dominanceRatio = totalContributions > 0 ? maxContribution / totalContributions : 0;
        
        if (dominanceRatio > 0.7 || isOwner) return 'centralized';
        if (dominanceRatio < 0.3) return 'consensus';
        return 'distributed';
    }

    private assessKnowledgeDistribution(data: any): 'concentrated' | 'balanced' | 'dispersed' {
        const { fileOverlapPatterns } = data;
        const overlapScores = Object.values(fileOverlapPatterns.overlapScores);
        
        if (overlapScores.length === 0) return 'concentrated';
        
        const avgOverlap = overlapScores.reduce((sum: number, score: any) => sum + score, 0) / overlapScores.length;
        
        if (avgOverlap > 0.6) return 'dispersed';
        if (avgOverlap > 0.3) return 'balanced';
        return 'concentrated';
    }

    private calculateIndividualCollaborationScore(collaborator: CollaboratorData, data: any): number {
        const { contributionStats, fileOverlapPatterns } = data;
        
        let score = 0;
        
        // Base score from contributions
        const contributions = contributionStats[collaborator.login] || 0;
        score += Math.min(50, contributions * 2);
        
        // File overlap bonus
        const overlapScore = fileOverlapPatterns.overlapScores[collaborator.login] || 0;
        score += overlapScore * 50;
        
        return Math.min(100, score);
    }

    private calculateMentorshipScore(leadership: LeadershipIndicators): number {
        let score = 0;
        
        if (leadership.technicalMentorship) score += 40;
        if (leadership.documentationLeadership) score += 20;
        if (leadership.teamBuilding) score += 30;
        if (leadership.processImprovement) score += 10;
        
        return Math.min(100, score);
    }

    private assessCollaborationLevel(metrics: CollaborationMetrics, teamDynamics: TeamDynamics): 'low' | 'medium' | 'high' | 'exceptional' {
        const score = (metrics.collaborationIntensity + metrics.teamDiversityScore * 100 + metrics.knowledgeSharingScore) / 3;
        
        if (score >= 80) return 'exceptional';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    private calculateTeamHealthScore(metrics: CollaborationMetrics, teamDynamics: TeamDynamics): number {
        return (
            metrics.teamDiversityScore * 100 * 0.3 +
            metrics.collaborationIntensity * 0.3 +
            metrics.knowledgeSharingScore * 0.2 +
            teamDynamics.conflictResolutionScore * 0.2
        );
    }

    private calculateInfluenceScore(leadership: LeadershipIndicators, metrics: CollaborationMetrics): number {
        const leadershipCount = Object.values(leadership).filter(Boolean).length;
        return (leadershipCount * 10) + (metrics.leadershipScore * 0.5);
    }

    private recommendRole(
        leadership: LeadershipIndicators,
        metrics: CollaborationMetrics,
        teamDynamics: TeamDynamics
    ): string {
        const leadershipAreas = Object.entries(leadership).filter(([_, value]) => value).map(([key, _]) => key);
        
        if (leadershipAreas.includes('architecturalLeadership') && leadershipAreas.includes('technicalMentorship')) {
            return 'Technical Lead';
        }
        if (leadershipAreas.includes('projectManagement') && leadershipAreas.includes('teamBuilding')) {
            return 'Engineering Manager';
        }
        if (leadershipAreas.includes('innovationDriving') && leadershipAreas.includes('processImprovement')) {
            return 'Senior Engineer';
        }
        if (leadershipAreas.includes('technicalMentorship') && metrics.knowledgeSharingScore >= 70) {
            return 'Mentor/Coach';
        }
        if (metrics.collaborationIntensity >= 70) {
            return 'Team Contributor';
        }
        
        return 'Individual Contributor';
    }

    private identifyStrengthAreas(leadership: LeadershipIndicators, metrics: CollaborationMetrics): string[] {
        const strengths: string[] = [];
        
        if (leadership.technicalMentorship) strengths.push('Technical Mentorship');
        if (leadership.architecturalLeadership) strengths.push('System Architecture');
        if (leadership.processImprovement) strengths.push('Process Optimization');
        if (metrics.knowledgeSharingScore >= 70) strengths.push('Knowledge Sharing');
        if (metrics.collaborationIntensity >= 70) strengths.push('Team Collaboration');
        if (leadership.innovationDriving) strengths.push('Innovation');
        
        return strengths;
    }

    private identifyImprovementAreas(metrics: CollaborationMetrics, teamDynamics: TeamDynamics): string[] {
        const improvements: string[] = [];
        
        if (metrics.communicationFrequency < 50) improvements.push('Communication Frequency');
        if (metrics.knowledgeSharingScore < 50) improvements.push('Knowledge Documentation');
        if (teamDynamics.conflictResolutionScore < 50) improvements.push('Conflict Resolution');
        if (metrics.teamDiversityScore < 0.5) improvements.push('Inclusive Collaboration');
        
        return improvements;
    }

    // Utility methods
    private analyzeTimePatterns(commitTimes: Date[]) {
        // Analyze commit timing patterns
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        
        commitTimes.forEach(time => {
            hourCounts[time.getHours()]++;
            dayCounts[time.getDay()]++;
        });
        
        return { hourCounts, dayCounts };
    }

    private analyzeMessagePatterns(commits: CommitData[]) {
        const patterns = {
            hasConventionalCommits: 0,
            avgMessageLength: 0,
            hasDescriptiveMessages: 0
        };
        
        if (commits.length === 0) return patterns;
        
        const totalLength = commits.reduce((sum, c) => sum + (c.message?.length || 0), 0);
        patterns.avgMessageLength = totalLength / commits.length;
        
        patterns.hasConventionalCommits = commits.filter(c => 
            c.message?.match(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/)
        ).length;
        
        patterns.hasDescriptiveMessages = commits.filter(c => 
            (c.message?.length || 0) >= 20
        ).length;
        
        return patterns;
    }

    private analyzeFileChangePatterns(commits: CommitData[]) {
        const patterns = {
            avgFilesPerCommit: 0,
            avgLinesPerCommit: 0,
            fileTypes: new Set<string>()
        };
        
        if (commits.length === 0) return patterns;
        
        let totalFiles = 0;
        let totalLines = 0;
        
        commits.forEach(commit => {
            const fileCount = commit.files?.length || 0;
            totalFiles += fileCount;
            
            commit.files?.forEach(file => {
                totalLines += (file.additions || 0) + (file.deletions || 0);
                const extension = file.filename.split('.').pop()?.toLowerCase();
                if (extension) patterns.fileTypes.add(extension);
            });
        });
        
        patterns.avgFilesPerCommit = totalFiles / commits.length;
        patterns.avgLinesPerCommit = totalLines / commits.length;
        
        return patterns;
    }

    private calculateEventSignificance(commit: CommitData): number {
        const linesChanged = (commit.files?.reduce((sum, f) => sum + (f.additions || 0) + (f.deletions || 0), 0) || 0);
        return Math.min(1, linesChanged / 100); // Normalize to 0-1 scale
    }

    private getRepositoryAgeInDays(commits: CommitData[]): number {
        if (commits.length === 0) return 1;
        
        const timestamps = commits.map(c => new Date(c.timestamp).getTime());
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);
        
        return Math.max(1, Math.floor((newest - oldest) / (1000 * 60 * 60 * 24)));
    }

    private hashCollaborator(login: string): string {
        return createHash('sha256').update(login + this.hashSalt).digest('hex').substring(0, 16);
    }
}

// Supporting interfaces
interface CollaborationEvent {
    type: 'merge' | 'assistance' | 'review' | 'coordination';
    timestamp: Date;
    participants: string[];
    significance: number;
}

interface CollaborationSummary {
    collaborationLevel: 'low' | 'medium' | 'high' | 'exceptional';
    teamHealthScore: number;
    leadershipAreasCount: number;
    influenceScore: number;
    recommendedRole: string;
    strengthAreas: string[];
    improvementAreas: string[];
}

export default CollaborationAnalyzer;