/**
 * Diversity Analyzer
 * 
 * Analyzes project diversity, domain breadth, technical versatility, and innovation
 * indicators across multiple repositories to generate diversity scores for credential generation.
 */

import { createHash } from 'crypto';
import { 
    RepositoryData, 
    LanguageData,
    AggregatedDiversityMetrics,
    DifferentialPrivacyConfig
} from '../types/index.js';

export interface DiversityConfig {
    minRepositoriesForAnalysis: number;
    languageWeights: Record<string, number>;
    domainCategories: Record<string, string[]>;
    frameworkCategories: Record<string, string[]>;
    innovationIndicators: string[];
    privacyConfig: DifferentialPrivacyConfig;
    trendAnalysis: boolean;
    emergingTechBonus: number;
}

export interface DiversityAnalysis {
    repositoryId: string;
    diversityMetrics: {
        languageDiversity: number;
        domainDiversity: number;
        frameworkDiversity: number;
        projectTypeDiversity: number;
        technicalComplexity: number;
        innovationScore: number;
    };
    categories: {
        primaryDomain: string;
        secondaryDomains: string[];
        techStack: string[];
        projectTypes: string[];
        emergingTech: string[];
    };
    trendinessScore: number;
    uniquenessScore: number;
}

export interface PortfolioDiversity {
    overallDiversity: number;
    languageSpread: {
        count: number;
        entropy: number;
        modernityScore: number;
        versatilityScore: number;
    };
    domainSpread: {
        count: number;
        breadth: number;
        depth: number;
        crossDomainScore: number;
    };
    technicalBreadth: {
        frameworkCount: number;
        toolCount: number;
        paradigmCount: number;
        architecturePatterns: number;
    };
    innovationMetrics: {
        emergingTechAdoption: number;
        experimentalProjects: number;
        originalityScore: number;
        trendFollowing: number;
    };
    adaptabilityScore: number;
}

export class DiversityAnalyzer {
    private config: DiversityConfig;
    private repositoryAnalyses: Map<string, DiversityAnalysis> = new Map();
    
    // Predefined categories and mappings
    private readonly LANGUAGE_CATEGORIES = {
        'systems': ['C', 'C++', 'Rust', 'Go', 'Zig'],
        'web': ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'PHP'],
        'mobile': ['Swift', 'Kotlin', 'Java', 'Dart', 'Objective-C'],
        'data': ['Python', 'R', 'Julia', 'Scala', 'SQL'],
        'functional': ['Haskell', 'Clojure', 'Erlang', 'Elixir', 'F#'],
        'academic': ['MATLAB', 'Mathematica', 'Coq', 'Agda'],
        'emerging': ['Zig', 'Nim', 'Crystal', 'V', 'Carbon']
    };

    private readonly DOMAIN_KEYWORDS = {
        'web-development': ['react', 'vue', 'angular', 'express', 'django', 'rails', 'laravel'],
        'mobile-development': ['ios', 'android', 'flutter', 'react-native', 'xamarin'],
        'data-science': ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'jupyter'],
        'machine-learning': ['ml', 'ai', 'neural', 'deep-learning', 'nlp', 'computer-vision'],
        'blockchain': ['ethereum', 'bitcoin', 'solidity', 'web3', 'defi', 'smart-contract'],
        'devops': ['docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci-cd'],
        'security': ['cryptography', 'penetration', 'security', 'vulnerability', 'encryption'],
        'game-development': ['unity', 'unreal', 'godot', 'game-engine', 'graphics'],
        'systems': ['operating-system', 'compiler', 'database', 'networking', 'embedded'],
        'fintech': ['trading', 'payment', 'banking', 'financial', 'accounting'],
        'healthcare': ['medical', 'health', 'bioinformatics', 'clinical', 'pharmaceutical'],
        'education': ['learning', 'educational', 'course', 'tutorial', 'academic']
    };

    private readonly FRAMEWORK_CATEGORIES = {
        'frontend': ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js'],
        'backend': ['Express', 'Django', 'Rails', 'Spring', 'Laravel', 'FastAPI'],
        'mobile': ['Flutter', 'React Native', 'Ionic', 'Xamarin'],
        'ml': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras'],
        'testing': ['Jest', 'Mocha', 'PyTest', 'JUnit', 'Cypress'],
        'cloud': ['AWS', 'Azure', 'GCP', 'Serverless', 'CloudFormation']
    };

    constructor(config: Partial<DiversityConfig> = {}) {
        this.config = {
            minRepositoriesForAnalysis: 3,
            languageWeights: {
                'JavaScript': 1.0, 'Python': 1.0, 'TypeScript': 1.2,
                'Rust': 1.5, 'Go': 1.3, 'Solidity': 1.8
            },
            domainCategories: this.DOMAIN_KEYWORDS,
            frameworkCategories: this.FRAMEWORK_CATEGORIES,
            innovationIndicators: ['experimental', 'prototype', 'research', 'novel', 'innovative'],
            privacyConfig: {
                epsilon: 1.0,
                delta: 1e-5,
                sensitivity: 1.0,
                mechanism: 'laplace',
                clampingBounds: [0, 100]
            },
            trendAnalysis: true,
            emergingTechBonus: 1.5,
            ...config
        };
    }

    /**
     * Analyze diversity for a single repository
     */
    async analyzeRepository(repository: RepositoryData): Promise<DiversityAnalysis> {
        // Analyze language diversity
        const languageDiversity = this.calculateLanguageDiversity(repository.languages);
        
        // Detect domains from repository name, description, and languages
        const domains = this.detectDomains(repository);
        const domainDiversity = this.calculateDomainDiversity(domains);
        
        // Detect frameworks and tools
        const frameworks = this.detectFrameworks(repository);
        const frameworkDiversity = this.calculateFrameworkDiversity(frameworks);
        
        // Analyze project type
        const projectTypes = this.detectProjectTypes(repository);
        const projectTypeDiversity = this.calculateProjectTypeDiversity(projectTypes);
        
        // Calculate technical complexity
        const technicalComplexity = this.calculateTechnicalComplexity(repository);
        
        // Calculate innovation score
        const innovationScore = this.calculateInnovationScore(repository);
        
        // Calculate trendiness
        const trendinessScore = this.config.trendAnalysis 
            ? this.calculateTrendinessScore(repository)
            : 0;
        
        // Calculate uniqueness
        const uniquenessScore = this.calculateUniquenessScore(repository);

        const analysis: DiversityAnalysis = {
            repositoryId: repository.id,
            diversityMetrics: {
                languageDiversity,
                domainDiversity,
                frameworkDiversity,
                projectTypeDiversity,
                technicalComplexity,
                innovationScore
            },
            categories: {
                primaryDomain: domains[0] || 'general',
                secondaryDomains: domains.slice(1),
                techStack: this.extractTechStack(repository),
                projectTypes,
                emergingTech: this.detectEmergingTech(repository)
            },
            trendinessScore,
            uniquenessScore
        };

        this.repositoryAnalyses.set(repository.id, analysis);
        return analysis;
    }

    /**
     * Aggregate diversity metrics across multiple repositories
     */
    async aggregateDiversityMetrics(
        repositories: RepositoryData[],
        userAddress: string
    ): Promise<AggregatedDiversityMetrics> {
        if (repositories.length < this.config.minRepositoriesForAnalysis) {
            throw new Error(`Minimum ${this.config.minRepositoriesForAnalysis} repositories required`);
        }

        const analyses = Array.from(this.repositoryAnalyses.values());
        
        // Calculate portfolio diversity
        const portfolioDiversity = this.calculatePortfolioDiversity(repositories, analyses);
        
        // Calculate aggregate scores
        const projectDiversity = this.calculateProjectDiversity(analyses);
        const domainDiversity = this.calculateAggregateDomainDiversity(analyses);
        const technicalBreadth = this.calculateTechnicalBreadth(analyses);
        const innovationScore = this.calculateAggregateInnovationScore(analyses);
        const adaptabilityScore = this.calculateAdaptabilityScore(analyses);

        // Apply differential privacy
        const privacyPreserving = this.applyDifferentialPrivacy({
            projectDiversity,
            domainDiversity,
            technicalBreadth,
            innovationScore,
            adaptabilityScore
        });

        return {
            projectDiversity: privacyPreserving.projectDiversity,
            domainDiversity: privacyPreserving.domainDiversity,
            technicalBreadth: privacyPreserving.technicalBreadth,
            innovationScore: privacyPreserving.innovationScore,
            adaptabilityScore: privacyPreserving.adaptabilityScore
        };
    }

    /**
     * Calculate language diversity using Shannon entropy
     */
    private calculateLanguageDiversity(languages: LanguageData[]): number {
        if (languages.length === 0) return 0;
        
        const totalLOC = languages.reduce((sum, lang) => sum + lang.linesOfCode, 0);
        if (totalLOC === 0) return 0;
        
        // Calculate Shannon entropy
        let entropy = 0;
        for (const lang of languages) {
            const probability = lang.linesOfCode / totalLOC;
            if (probability > 0) {
                entropy -= probability * Math.log2(probability);
            }
        }
        
        // Normalize to 0-100 scale
        const maxEntropy = Math.log2(languages.length);
        return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
    }

    /**
     * Detect domains from repository metadata
     */
    private detectDomains(repository: RepositoryData): string[] {
        const text = `${repository.name} ${repository.fullName}`.toLowerCase();
        const detectedDomains: string[] = [];
        
        for (const [domain, keywords] of Object.entries(this.config.domainCategories)) {
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            if (matches > 0) {
                detectedDomains.push(domain);
            }
        }
        
        // Add language-based domain detection
        const languageBasedDomains = this.detectLanguageBasedDomains(repository.languages);
        detectedDomains.push(...languageBasedDomains);
        
        return [...new Set(detectedDomains)];
    }

    /**
     * Detect domains based on programming languages
     */
    private detectLanguageBasedDomains(languages: LanguageData[]): string[] {
        const domains: string[] = [];
        
        for (const lang of languages) {
            for (const [category, langs] of Object.entries(this.LANGUAGE_CATEGORIES)) {
                if (langs.includes(lang.name)) {
                    domains.push(category);
                }
            }
        }
        
        return [...new Set(domains)];
    }

    /**
     * Calculate domain diversity
     */
    private calculateDomainDiversity(domains: string[]): number {
        if (domains.length === 0) return 0;
        
        // Base score from number of domains
        const domainCount = domains.length;
        const baseScore = Math.min(100, domainCount * 20);
        
        // Bonus for cross-domain combinations
        const crossDomainBonus = this.calculateCrossDomainBonus(domains);
        
        return Math.min(100, baseScore + crossDomainBonus);
    }

    /**
     * Calculate cross-domain bonus
     */
    private calculateCrossDomainBonus(domains: string[]): number {
        const valuableCombinations = [
            ['web-development', 'blockchain'],
            ['machine-learning', 'web-development'],
            ['security', 'blockchain'],
            ['data-science', 'fintech'],
            ['mobile-development', 'machine-learning']
        ];
        
        let bonus = 0;
        for (const combination of valuableCombinations) {
            if (combination.every(domain => domains.includes(domain))) {
                bonus += 15;
            }
        }
        
        return Math.min(30, bonus);
    }

    /**
     * Detect frameworks from repository metadata
     */
    private detectFrameworks(repository: RepositoryData): string[] {
        const text = `${repository.name} ${repository.fullName}`.toLowerCase();
        const frameworks: string[] = [];
        
        for (const [category, frameworkList] of Object.entries(this.config.frameworkCategories)) {
            for (const framework of frameworkList) {
                if (text.includes(framework.toLowerCase())) {
                    frameworks.push(framework);
                }
            }
        }
        
        return [...new Set(frameworks)];
    }

    /**
     * Calculate framework diversity
     */
    private calculateFrameworkDiversity(frameworks: string[]): number {
        if (frameworks.length === 0) return 0;
        
        const frameworkCount = frameworks.length;
        const categoryCount = this.countFrameworkCategories(frameworks);
        
        // Score based on both count and category spread
        const countScore = Math.min(60, frameworkCount * 10);
        const categoryScore = Math.min(40, categoryCount * 8);
        
        return countScore + categoryScore;
    }

    /**
     * Count framework categories
     */
    private countFrameworkCategories(frameworks: string[]): number {
        const categories = new Set<string>();
        
        for (const framework of frameworks) {
            for (const [category, frameworkList] of Object.entries(this.config.frameworkCategories)) {
                if (frameworkList.includes(framework)) {
                    categories.add(category);
                }
            }
        }
        
        return categories.size;
    }

    /**
     * Detect project types
     */
    private detectProjectTypes(repository: RepositoryData): string[] {
        const types: string[] = [];
        const name = repository.name.toLowerCase();
        const fullName = repository.fullName.toLowerCase();
        
        // Library/Package detection
        if (name.includes('lib') || name.includes('package') || name.includes('sdk')) {
            types.push('library');
        }
        
        // Application detection
        if (name.includes('app') || name.includes('client') || name.includes('server')) {
            types.push('application');
        }
        
        // Tool detection
        if (name.includes('tool') || name.includes('cli') || name.includes('util')) {
            types.push('tool');
        }
        
        // Framework detection
        if (name.includes('framework') || name.includes('boilerplate') || name.includes('template')) {
            types.push('framework');
        }
        
        // Research/Experimental
        if (name.includes('experiment') || name.includes('research') || name.includes('prototype')) {
            types.push('experimental');
        }
        
        return types.length > 0 ? types : ['application'];
    }

    /**
     * Calculate project type diversity
     */
    private calculateProjectTypeDiversity(projectTypes: string[]): number {
        const typeCount = projectTypes.length;
        return Math.min(100, typeCount * 25);
    }

    /**
     * Calculate technical complexity
     */
    private calculateTechnicalComplexity(repository: RepositoryData): number {
        let complexity = 0;
        
        // Language complexity
        const complexLanguages = ['C++', 'Rust', 'Haskell', 'Scala', 'Solidity'];
        const hasComplexLanguage = repository.languages.some(lang => 
            complexLanguages.includes(lang.name)
        );
        if (hasComplexLanguage) complexity += 30;
        
        // Multiple languages bonus
        if (repository.languages.length > 3) complexity += 20;
        
        // Large codebase bonus
        if (repository.totalLOC > 10000) complexity += 25;
        if (repository.totalLOC > 50000) complexity += 25;
        
        return Math.min(100, complexity);
    }

    /**
     * Calculate innovation score
     */
    private calculateInnovationScore(repository: RepositoryData): number {
        let score = 0;
        const text = `${repository.name} ${repository.fullName}`.toLowerCase();
        
        // Check for innovation indicators
        for (const indicator of this.config.innovationIndicators) {
            if (text.includes(indicator)) {
                score += 20;
            }
        }
        
        // Emerging technology bonus
        const hasEmergingTech = this.detectEmergingTech(repository).length > 0;
        if (hasEmergingTech) {
            score += 30;
        }
        
        // Recency bonus (newer repos might be more innovative)
        const ageInDays = (Date.now() - repository.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 365) score += 15;
        
        return Math.min(100, score);
    }

    /**
     * Detect emerging technologies
     */
    private detectEmergingTech(repository: RepositoryData): string[] {
        const emergingTech: string[] = [];
        const text = `${repository.name} ${repository.fullName}`.toLowerCase();
        
        const emergingKeywords = [
            'web3', 'defi', 'nft', 'metaverse', 'ai', 'ml', 'blockchain',
            'quantum', 'edge-computing', 'serverless', 'microservices',
            'rust', 'zig', 'webassembly', 'graphql', 'jamstack'
        ];
        
        for (const keyword of emergingKeywords) {
            if (text.includes(keyword)) {
                emergingTech.push(keyword);
            }
        }
        
        // Check languages
        const emergingLanguages = this.LANGUAGE_CATEGORIES.emerging;
        for (const lang of repository.languages) {
            if (emergingLanguages.includes(lang.name)) {
                emergingTech.push(lang.name.toLowerCase());
            }
        }
        
        return [...new Set(emergingTech)];
    }

    /**
     * Calculate trendiness score
     */
    private calculateTrendinessScore(repository: RepositoryData): number {
        let score = 0;
        
        // Stars and forks indicate popularity/trendiness
        if (repository.stars > 100) score += 20;
        if (repository.stars > 1000) score += 30;
        if (repository.forks > 50) score += 15;
        
        // Recent activity
        const lastUpdate = repository.updatedAt.getTime();
        const daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) score += 25;
        
        // Emerging tech bonus
        const emergingTechCount = this.detectEmergingTech(repository).length;
        score += emergingTechCount * 10;
        
        return Math.min(100, score);
    }

    /**
     * Calculate uniqueness score
     */
    private calculateUniquenessScore(repository: RepositoryData): number {
        let score = 50; // Base score
        
        // Unique language combinations
        const languageCombo = repository.languages.map(l => l.name).sort().join('-');
        const commonCombos = ['JavaScript-HTML-CSS', 'Python', 'Java', 'C++'];
        if (!commonCombos.includes(languageCombo)) {
            score += 25;
        }
        
        // Low stars might indicate uniqueness (not following trends)
        if (repository.stars < 10 && repository.totalLOC > 1000) {
            score += 15;
        }
        
        // Owner vs contributor uniqueness
        if (!repository.isOwner) {
            score += 10; // Contributing to others' projects shows diverse engagement
        }
        
        return Math.min(100, score);
    }

    /**
     * Extract tech stack from repository
     */
    private extractTechStack(repository: RepositoryData): string[] {
        const techStack: string[] = [];
        
        // Add primary languages
        techStack.push(...repository.languages.map(l => l.name));
        
        // Add detected frameworks
        const frameworks = this.detectFrameworks(repository);
        techStack.push(...frameworks);
        
        return [...new Set(techStack)];
    }

    /**
     * Calculate portfolio diversity across all repositories
     */
    private calculatePortfolioDiversity(
        repositories: RepositoryData[], 
        analyses: DiversityAnalysis[]
    ): PortfolioDiversity {
        // Aggregate all languages
        const allLanguages = new Map<string, number>();
        repositories.forEach(repo => {
            repo.languages.forEach(lang => {
                allLanguages.set(lang.name, (allLanguages.get(lang.name) || 0) + lang.linesOfCode);
            });
        });

        // Calculate language spread
        const languageSpread = {
            count: allLanguages.size,
            entropy: this.calculateLanguageDiversity(
                Array.from(allLanguages.entries()).map(([name, linesOfCode]) => ({
                    name, linesOfCode, percentage: 0
                }))
            ),
            modernityScore: this.calculateModernityScore(Array.from(allLanguages.keys())),
            versatilityScore: this.calculateVersatilityScore(Array.from(allLanguages.keys()))
        };

        // Calculate domain spread
        const allDomains = new Set<string>();
        analyses.forEach(analysis => {
            allDomains.add(analysis.categories.primaryDomain);
            analysis.categories.secondaryDomains.forEach(domain => allDomains.add(domain));
        });

        const domainSpread = {
            count: allDomains.size,
            breadth: this.calculateDomainBreadth(Array.from(allDomains)),
            depth: this.calculateDomainDepth(analyses),
            crossDomainScore: this.calculateCrossDomainScore(Array.from(allDomains))
        };

        // Calculate technical breadth
        const allFrameworks = new Set<string>();
        analyses.forEach(analysis => {
            analysis.categories.techStack.forEach(tech => allFrameworks.add(tech));
        });

        const technicalBreadth = {
            frameworkCount: allFrameworks.size,
            toolCount: this.countTools(analyses),
            paradigmCount: this.countProgrammingParadigms(Array.from(allLanguages.keys())),
            architecturePatterns: this.countArchitecturePatterns(analyses)
        };

        // Calculate innovation metrics
        const innovationMetrics = {
            emergingTechAdoption: this.calculateEmergingTechAdoption(analyses),
            experimentalProjects: analyses.filter(a => 
                a.categories.projectTypes.includes('experimental')
            ).length,
            originalityScore: this.calculateOriginalityScore(analyses),
            trendFollowing: this.calculateTrendFollowingScore(analyses)
        };

        const adaptabilityScore = this.calculatePortfolioAdaptabilityScore(analyses);

        return {
            overallDiversity: this.calculateOverallDiversity({
                languageSpread, domainSpread, technicalBreadth, innovationMetrics
            }),
            languageSpread,
            domainSpread,
            technicalBreadth,
            innovationMetrics,
            adaptabilityScore
        };
    }

    /**
     * Apply differential privacy to diversity metrics
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

    /**
     * Utility functions for complex calculations
     */
    private calculateProjectDiversity(analyses: DiversityAnalysis[]): number {
        const avgDiversity = analyses.reduce((sum, analysis) => {
            return sum + (
                analysis.diversityMetrics.languageDiversity +
                analysis.diversityMetrics.domainDiversity +
                analysis.diversityMetrics.frameworkDiversity +
                analysis.diversityMetrics.projectTypeDiversity
            ) / 4;
        }, 0) / analyses.length;
        
        return Math.round(avgDiversity);
    }

    private calculateAggregateDomainDiversity(analyses: DiversityAnalysis[]): number {
        const allDomains = new Set<string>();
        analyses.forEach(analysis => {
            allDomains.add(analysis.categories.primaryDomain);
            analysis.categories.secondaryDomains.forEach(domain => allDomains.add(domain));
        });
        
        return Math.min(100, allDomains.size * 15);
    }

    private calculateTechnicalBreadth(analyses: DiversityAnalysis[]): number {
        const allTech = new Set<string>();
        analyses.forEach(analysis => {
            analysis.categories.techStack.forEach(tech => allTech.add(tech));
        });
        
        return Math.min(100, allTech.size * 5);
    }

    private calculateAggregateInnovationScore(analyses: DiversityAnalysis[]): number {
        const avgInnovation = analyses.reduce((sum, analysis) => 
            sum + analysis.diversityMetrics.innovationScore, 0
        ) / analyses.length;
        
        return Math.round(avgInnovation);
    }

    private calculateAdaptabilityScore(analyses: DiversityAnalysis[]): number {
        const diversitySpread = analyses.map(a => a.diversityMetrics.languageDiversity);
        const adaptability = this.calculateStandardDeviation(diversitySpread);
        
        return Math.min(100, adaptability * 10);
    }

    private calculateModernityScore(languages: string[]): number {
        const modernLanguages = ['TypeScript', 'Rust', 'Go', 'Kotlin', 'Swift', 'Dart'];
        const modernCount = languages.filter(lang => modernLanguages.includes(lang)).length;
        return Math.min(100, (modernCount / languages.length) * 100);
    }

    private calculateVersatilityScore(languages: string[]): number {
        const categories = Object.keys(this.LANGUAGE_CATEGORIES);
        const coveredCategories = categories.filter(category => 
            this.LANGUAGE_CATEGORIES[category].some(lang => languages.includes(lang))
        );
        return Math.min(100, (coveredCategories.length / categories.length) * 100);
    }

    private calculateDomainBreadth(domains: string[]): number {
        return Math.min(100, domains.length * 12);
    }

    private calculateDomainDepth(analyses: DiversityAnalysis[]): number {
        const domainCounts = new Map<string, number>();
        analyses.forEach(analysis => {
            domainCounts.set(
                analysis.categories.primaryDomain, 
                (domainCounts.get(analysis.categories.primaryDomain) || 0) + 1
            );
        });
        
        const maxDepth = Math.max(...Array.from(domainCounts.values()));
        return Math.min(100, maxDepth * 20);
    }

    private calculateCrossDomainScore(domains: string[]): number {
        // Bonus for having multiple domains
        return Math.min(100, domains.length * 10);
    }

    private countTools(analyses: DiversityAnalysis[]): number {
        const tools = new Set<string>();
        analyses.forEach(analysis => {
            analysis.categories.techStack.forEach(tech => tools.add(tech));
        });
        return tools.size;
    }

    private countProgrammingParadigms(languages: string[]): number {
        const paradigms = new Set<string>();
        
        const paradigmMap = {
            'object-oriented': ['Java', 'C++', 'C#', 'Python'],
            'functional': ['Haskell', 'Clojure', 'Erlang', 'Elixir'],
            'procedural': ['C', 'Go', 'Pascal'],
            'scripting': ['JavaScript', 'Python', 'Ruby', 'PHP'],
            'systems': ['C', 'C++', 'Rust', 'Go']
        };
        
        for (const [paradigm, langs] of Object.entries(paradigmMap)) {
            if (langs.some(lang => languages.includes(lang))) {
                paradigms.add(paradigm);
            }
        }
        
        return paradigms.size;
    }

    private countArchitecturePatterns(analyses: DiversityAnalysis[]): number {
        // Simplified architecture pattern detection
        let patterns = 0;
        
        const hasWebProjects = analyses.some(a => a.categories.primaryDomain === 'web-development');
        const hasMobileProjects = analyses.some(a => a.categories.primaryDomain === 'mobile-development');
        const hasDataProjects = analyses.some(a => a.categories.primaryDomain === 'data-science');
        
        if (hasWebProjects) patterns++;
        if (hasMobileProjects) patterns++;
        if (hasDataProjects) patterns++;
        
        return patterns;
    }

    private calculateEmergingTechAdoption(analyses: DiversityAnalysis[]): number {
        const totalEmergingTech = analyses.reduce((sum, analysis) => 
            sum + analysis.categories.emergingTech.length, 0
        );
        
        return Math.min(100, totalEmergingTech * 10);
    }

    private calculateOriginalityScore(analyses: DiversityAnalysis[]): number {
        const avgUniqueness = analyses.reduce((sum, analysis) => 
            sum + analysis.uniquenessScore, 0
        ) / analyses.length;
        
        return Math.round(avgUniqueness);
    }

    private calculateTrendFollowingScore(analyses: DiversityAnalysis[]): number {
        const avgTrendiness = analyses.reduce((sum, analysis) => 
            sum + analysis.trendinessScore, 0
        ) / analyses.length;
        
        return Math.round(avgTrendiness);
    }

    private calculateOverallDiversity(components: any): number {
        const {
            languageSpread,
            domainSpread,
            technicalBreadth,
            innovationMetrics
        } = components;
        
        return Math.round(
            (languageSpread.entropy * 0.3 +
             domainSpread.breadth * 0.25 +
             technicalBreadth.frameworkCount * 0.25 +
             innovationMetrics.originalityScore * 0.2) / 4
        );
    }

    private calculatePortfolioAdaptabilityScore(analyses: DiversityAnalysis[]): number {
        // Measure how well the developer adapts to different contexts
        const diversityVariance = this.calculateStandardDeviation(
            analyses.map(a => a.diversityMetrics.languageDiversity)
        );
        
        const domainSwitching = new Set(analyses.map(a => a.categories.primaryDomain)).size;
        
        return Math.min(100, (diversityVariance * 2 + domainSwitching * 10));
    }

    private calculateStandardDeviation(values: number[]): number {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
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