import { createHash } from 'crypto';
import { CommitData, FileData } from '../../../types/index.js';

/**
 * Language Detector
 * 
 * Detects and analyzes programming languages from repository commits and files.
 * Provides detailed language proficiency analysis and circuit-compatible outputs.
 */

export interface LanguageDetectionConfig {
    maxLanguages: number;
    minLinesThreshold: number;
    minCommitsThreshold: number;
    complexityWeighting: boolean;
    frameworkDetection: boolean;
}

export interface LanguageAnalysis {
    language: string;
    fileExtensions: string[];
    totalLines: number;
    commitCount: number;
    fileCount: number;
    proficiencyScore: number;
    complexityLevel: number;
    frameworks: string[];
    libraries: string[];
    patterns: string[];
    firstSeen: Date;
    lastSeen: Date;
    experienceMonths: number;
    dominancePercentage: number;
}

export interface LanguageCircuitInputs {
    languageHashes: string[];
    proficiencyScores: number[];
    complexityLevels: number[];
    linesCounts: number[];
    commitCounts: number[];
    experienceMonths: number[];
    frameworkCounts: number[];
    dominanceScores: number[];
}

export class LanguageDetector {
    private config: LanguageDetectionConfig;
    private languageMap: Map<string, string>;
    private frameworkPatterns: Map<string, string[]>;
    private complexityPatterns: Map<string, string[]>;

    constructor(config: LanguageDetectionConfig) {
        this.config = config;
        this.initializeLanguageMap();
        this.initializeFrameworkPatterns();
        this.initializeComplexityPatterns();
    }

    /**
     * Analyze languages from commit data
     */
    async analyzeLanguages(commits: CommitData[], userAddress: string): Promise<{
        languages: LanguageAnalysis[];
        circuitInputs: LanguageCircuitInputs;
        summary: LanguageSummary;
    }> {
        try {
            // Filter user commits
            const userCommits = commits.filter(c => c.author === userAddress);
            
            // Extract language data from commits
            const languageData = this.extractLanguageData(userCommits);
            
            // Analyze each language
            const languages = await this.analyzeLanguageDetails(languageData, userCommits);
            
            // Filter and sort languages
            const filteredLanguages = this.filterLanguages(languages);
            
            // Generate circuit inputs
            const circuitInputs = this.generateCircuitInputs(filteredLanguages);
            
            // Create summary
            const summary = this.createLanguageSummary(filteredLanguages, userCommits);

            return {
                languages: filteredLanguages,
                circuitInputs,
                summary
            };

        } catch (error) {
            throw new Error(`Language analysis failed: ${error.message}`);
        }
    }

    /**
     * Extract raw language data from commits
     */
    private extractLanguageData(commits: CommitData[]): Map<string, {
        files: FileData[];
        commits: CommitData[];
        extensions: Set<string>;
        totalLines: number;
        timestamps: Date[];
    }> {
        const languageData = new Map();

        commits.forEach(commit => {
            commit.files?.forEach(file => {
                const extension = this.getFileExtension(file.filename);
                const language = this.getLanguageFromExtension(extension);
                
                if (language) {
                    if (!languageData.has(language)) {
                        languageData.set(language, {
                            files: [],
                            commits: [],
                            extensions: new Set(),
                            totalLines: 0,
                            timestamps: []
                        });
                    }
                    
                    const data = languageData.get(language);
                    data.files.push(file);
                    data.extensions.add(extension);
                    data.totalLines += (file.additions || 0);
                    data.timestamps.push(new Date(commit.timestamp));
                    
                    // Add commit if not already included
                    if (!data.commits.find(c => c.sha === commit.sha)) {
                        data.commits.push(commit);
                    }
                }
            });
        });

        return languageData;
    }

    /**
     * Analyze detailed language information
     */
    private async analyzeLanguageDetails(
        languageData: Map<string, any>, 
        allCommits: CommitData[]
    ): Promise<LanguageAnalysis[]> {
        const analyses: LanguageAnalysis[] = [];

        for (const [language, data] of languageData.entries()) {
            const analysis = await this.analyzeLanguage(language, data, allCommits);
            analyses.push(analysis);
        }

        return analyses;
    }

    /**
     * Analyze a specific language
     */
    private async analyzeLanguage(
        language: string, 
        data: any, 
        allCommits: CommitData[]
    ): Promise<LanguageAnalysis> {
        // Basic metrics
        const totalLines = data.totalLines;
        const commitCount = data.commits.length;
        const fileCount = data.files.length;
        const fileExtensions = Array.from(data.extensions);

        // Time analysis
        const timestamps = data.timestamps.sort((a, b) => a.getTime() - b.getTime());
        const firstSeen = timestamps[0];
        const lastSeen = timestamps[timestamps.length - 1];
        const experienceMonths = this.calculateExperienceMonths(firstSeen, lastSeen);

        // Proficiency scoring
        const proficiencyScore = this.calculateProficiencyScore(language, {
            totalLines,
            commitCount,
            fileCount,
            experienceMonths,
            files: data.files
        });

        // Complexity analysis
        const complexityLevel = this.assessComplexityLevel(language, data.files);

        // Framework and library detection
        const frameworks = this.detectFrameworks(language, data.files);
        const libraries = this.detectLibraries(language, data.files);
        const patterns = this.detectPatterns(language, data.files);

        // Calculate dominance percentage
        const totalLinesAllLanguages = this.calculateTotalLines(allCommits);
        const dominancePercentage = totalLinesAllLanguages > 0 ? 
            (totalLines / totalLinesAllLanguages) * 100 : 0;

        return {
            language,
            fileExtensions,
            totalLines,
            commitCount,
            fileCount,
            proficiencyScore: Math.round(proficiencyScore),
            complexityLevel: Math.round(complexityLevel),
            frameworks,
            libraries,
            patterns,
            firstSeen,
            lastSeen,
            experienceMonths: parseFloat(experienceMonths.toFixed(1)),
            dominancePercentage: parseFloat(dominancePercentage.toFixed(2))
        };
    }

    /**
     * Filter languages based on thresholds
     */
    private filterLanguages(languages: LanguageAnalysis[]): LanguageAnalysis[] {
        return languages
            .filter(lang => 
                lang.totalLines >= this.config.minLinesThreshold &&
                lang.commitCount >= this.config.minCommitsThreshold
            )
            .sort((a, b) => b.proficiencyScore - a.proficiencyScore)
            .slice(0, this.config.maxLanguages);
    }

    /**
     * Generate circuit-compatible inputs
     */
    private generateCircuitInputs(languages: LanguageAnalysis[]): LanguageCircuitInputs {
        const maxLanguages = this.config.maxLanguages;
        
        // Pad arrays to maxLanguages length
        const paddedLanguages = [...languages];
        while (paddedLanguages.length < maxLanguages) {
            paddedLanguages.push({
                language: '',
                fileExtensions: [],
                totalLines: 0,
                commitCount: 0,
                fileCount: 0,
                proficiencyScore: 0,
                complexityLevel: 0,
                frameworks: [],
                libraries: [],
                patterns: [],
                firstSeen: new Date(),
                lastSeen: new Date(),
                experienceMonths: 0,
                dominancePercentage: 0
            });
        }

        return {
            languageHashes: paddedLanguages.map(lang => this.hashLanguage(lang.language)),
            proficiencyScores: paddedLanguages.map(lang => lang.proficiencyScore),
            complexityLevels: paddedLanguages.map(lang => lang.complexityLevel),
            linesCounts: paddedLanguages.map(lang => lang.totalLines),
            commitCounts: paddedLanguages.map(lang => lang.commitCount),
            experienceMonths: paddedLanguages.map(lang => Math.round(lang.experienceMonths)),
            frameworkCounts: paddedLanguages.map(lang => lang.frameworks.length),
            dominanceScores: paddedLanguages.map(lang => Math.round(lang.dominancePercentage))
        };
    }

    /**
     * Create language summary
     */
    private createLanguageSummary(languages: LanguageAnalysis[], commits: CommitData[]): LanguageSummary {
        const totalLanguages = languages.length;
        const primaryLanguage = languages[0]?.language || 'Unknown';
        const totalLinesAllLanguages = languages.reduce((sum, lang) => sum + lang.totalLines, 0);
        const avgProficiency = languages.length > 0 ? 
            languages.reduce((sum, lang) => sum + lang.proficiencyScore, 0) / languages.length : 0;
        const avgComplexity = languages.length > 0 ?
            languages.reduce((sum, lang) => sum + lang.complexityLevel, 0) / languages.length : 0;
        
        // Calculate language diversity index
        const diversityIndex = this.calculateLanguageDiversityIndex(languages);
        
        // Identify language categories
        const categories = this.categorizeLanguages(languages);
        
        // Calculate experience span
        const allTimestamps = languages.flatMap(lang => [lang.firstSeen, lang.lastSeen]);
        const experienceSpan = allTimestamps.length > 0 ?
            (Math.max(...allTimestamps.map(d => d.getTime())) - 
             Math.min(...allTimestamps.map(d => d.getTime()))) / (1000 * 60 * 60 * 24 * 30) : 0;

        return {
            totalLanguages,
            primaryLanguage,
            totalLinesAllLanguages,
            avgProficiency: Math.round(avgProficiency),
            avgComplexity: parseFloat(avgComplexity.toFixed(1)),
            diversityIndex: parseFloat(diversityIndex.toFixed(2)),
            categories,
            experienceSpanMonths: parseFloat(experienceSpan.toFixed(1)),
            polyglotScore: this.calculatePolyglotScore(languages)
        };
    }

    // Helper methods
    private initializeLanguageMap() {
        this.languageMap = new Map([
            // Web Technologies
            ['js', 'JavaScript'],
            ['jsx', 'JavaScript'],
            ['ts', 'TypeScript'],
            ['tsx', 'TypeScript'],
            ['html', 'HTML'],
            ['htm', 'HTML'],
            ['css', 'CSS'],
            ['scss', 'SCSS'],
            ['sass', 'Sass'],
            ['less', 'Less'],
            ['vue', 'Vue'],
            
            // Backend Languages
            ['py', 'Python'],
            ['pyw', 'Python'],
            ['java', 'Java'],
            ['kt', 'Kotlin'],
            ['kts', 'Kotlin'],
            ['scala', 'Scala'],
            ['rb', 'Ruby'],
            ['php', 'PHP'],
            ['go', 'Go'],
            ['rs', 'Rust'],
            ['cs', 'C#'],
            ['fs', 'F#'],
            ['vb', 'Visual Basic'],
            
            // Systems Programming
            ['c', 'C'],
            ['cpp', 'C++'],
            ['cc', 'C++'],
            ['cxx', 'C++'],
            ['h', 'C/C++'],
            ['hpp', 'C++'],
            ['asm', 'Assembly'],
            ['s', 'Assembly'],
            
            // Mobile Development
            ['swift', 'Swift'],
            ['m', 'Objective-C'],
            ['mm', 'Objective-C++'],
            ['dart', 'Dart'],
            
            // Functional Languages
            ['hs', 'Haskell'],
            ['elm', 'Elm'],
            ['clj', 'Clojure'],
            ['cljs', 'ClojureScript'],
            ['ml', 'OCaml'],
            ['fs', 'F#'],
            
            // Scripting
            ['sh', 'Shell'],
            ['bash', 'Bash'],
            ['zsh', 'Zsh'],
            ['ps1', 'PowerShell'],
            ['bat', 'Batch'],
            ['cmd', 'Command'],
            
            // Data & Config
            ['sql', 'SQL'],
            ['json', 'JSON'],
            ['yaml', 'YAML'],
            ['yml', 'YAML'],
            ['xml', 'XML'],
            ['toml', 'TOML'],
            ['ini', 'INI'],
            
            // Blockchain
            ['sol', 'Solidity'],
            ['vy', 'Vyper'],
            
            // Other
            ['r', 'R'],
            ['jl', 'Julia'],
            ['lua', 'Lua'],
            ['pl', 'Perl'],
            ['tex', 'LaTeX'],
            ['md', 'Markdown'],
            ['dockerfile', 'Docker'],
            ['makefile', 'Make']
        ]);
    }

    private initializeFrameworkPatterns() {
        this.frameworkPatterns = new Map([
            ['JavaScript', [
                'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby',
                'express', 'koa', 'fastify', 'nest', 'meteor', 'ember',
                'webpack', 'vite', 'rollup', 'parcel', 'jest', 'mocha', 'cypress'
            ]],
            ['TypeScript', [
                'react', 'vue', 'angular', 'svelte', 'next', 'nuxt',
                'express', 'nest', 'fastify', 'typeorm', 'prisma'
            ]],
            ['Python', [
                'django', 'flask', 'fastapi', 'tornado', 'pyramid', 'bottle',
                'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
                'celery', 'gunicorn', 'uvicorn', 'pytest', 'unittest'
            ]],
            ['Java', [
                'spring', 'hibernate', 'junit', 'maven', 'gradle', 'tomcat',
                'struts', 'jsf', 'wicket', 'play', 'dropwizard', 'micronaut'
            ]],
            ['C#', [
                'dotnet', 'aspnet', 'entity', 'xamarin', 'unity', 'nunit',
                'moq', 'autofac', 'newtonsoft', 'serilog'
            ]],
            ['C++', [
                'boost', 'qt', 'opencv', 'eigen', 'catch2', 'gtest',
                'cmake', 'conan', 'vcpkg'
            ]],
            ['Rust', [
                'tokio', 'serde', 'diesel', 'actix', 'rocket', 'warp',
                'clap', 'structopt', 'cargo'
            ]],
            ['Go', [
                'gin', 'echo', 'fiber', 'gorilla', 'gorm', 'cobra',
                'viper', 'testify', 'gomock'
            ]],
            ['Swift', [
                'swiftui', 'uikit', 'combine', 'vapor', 'perfect', 'kitura'
            ]],
            ['Solidity', [
                'hardhat', 'truffle', 'foundry', 'openzeppelin', 'web3',
                'ethers', 'ganache', 'remix'
            ]]
        ]);
    }

    private initializeComplexityPatterns() {
        this.complexityPatterns = new Map([
            ['algorithm', ['sort', 'search', 'graph', 'tree', 'hash', 'dynamic']],
            ['systems', ['kernel', 'driver', 'embedded', 'realtime', 'concurrent']],
            ['crypto', ['encryption', 'hash', 'signature', 'key', 'cipher', 'merkle']],
            ['ai_ml', ['neural', 'model', 'training', 'inference', 'tensor', 'gradient']],
            ['compiler', ['parser', 'lexer', 'ast', 'optimizer', 'codegen', 'llvm']],
            ['blockchain', ['consensus', 'mining', 'validator', 'smart', 'defi', 'nft']],
            ['distributed', ['cluster', 'consensus', 'raft', 'gossip', 'sharding']],
            ['graphics', ['shader', 'render', 'mesh', 'texture', 'lighting', 'gpu']]
        ]);
    }

    private getFileExtension(filename: string): string {
        const parts = filename.toLowerCase().split('.');
        if (parts.length < 2) return '';
        
        // Handle special cases
        if (filename.toLowerCase() === 'dockerfile') return 'dockerfile';
        if (filename.toLowerCase() === 'makefile') return 'makefile';
        
        return parts[parts.length - 1];
    }

    private getLanguageFromExtension(extension: string): string | null {
        return this.languageMap.get(extension) || null;
    }

    private calculateExperienceMonths(firstSeen: Date, lastSeen: Date): number {
        const diffMs = lastSeen.getTime() - firstSeen.getTime();
        return Math.max(0.1, diffMs / (1000 * 60 * 60 * 24 * 30));
    }

    private calculateProficiencyScore(language: string, metrics: any): number {
        let score = 0;
        
        // Lines of code contribution (40 points max)
        if (metrics.totalLines >= 5000) score += 40;
        else if (metrics.totalLines >= 2000) score += 32;
        else if (metrics.totalLines >= 1000) score += 24;
        else if (metrics.totalLines >= 500) score += 16;
        else if (metrics.totalLines >= 100) score += 8;
        
        // Commit frequency (25 points max)
        if (metrics.commitCount >= 50) score += 25;
        else if (metrics.commitCount >= 25) score += 20;
        else if (metrics.commitCount >= 10) score += 15;
        else if (metrics.commitCount >= 5) score += 10;
        else if (metrics.commitCount >= 2) score += 5;
        
        // File diversity (15 points max)
        if (metrics.fileCount >= 20) score += 15;
        else if (metrics.fileCount >= 10) score += 12;
        else if (metrics.fileCount >= 5) score += 8;
        else if (metrics.fileCount >= 2) score += 4;
        
        // Experience duration (10 points max)
        if (metrics.experienceMonths >= 24) score += 10;
        else if (metrics.experienceMonths >= 12) score += 8;
        else if (metrics.experienceMonths >= 6) score += 6;
        else if (metrics.experienceMonths >= 3) score += 4;
        else if (metrics.experienceMonths >= 1) score += 2;
        
        // Language complexity bonus (10 points max)
        const complexLanguages = ['C++', 'Rust', 'Assembly', 'Haskell', 'Solidity'];
        if (complexLanguages.includes(language)) score += 10;
        else if (['TypeScript', 'Go', 'Swift', 'Kotlin'].includes(language)) score += 5;
        
        return Math.min(100, score);
    }

    private assessComplexityLevel(language: string, files: FileData[]): number {
        let complexityScore = 1; // Base complexity
        
        // Analyze file names and paths for complexity indicators
        files.forEach(file => {
            const filename = file.filename.toLowerCase();
            
            for (const [category, patterns] of this.complexityPatterns.entries()) {
                patterns.forEach(pattern => {
                    if (filename.includes(pattern)) {
                        complexityScore += 0.5;
                    }
                });
            }
        });
        
        // Language-specific complexity
        const complexityMap: { [key: string]: number } = {
            'Assembly': 5,
            'C': 4,
            'C++': 4,
            'Rust': 4,
            'Haskell': 4,
            'Solidity': 3,
            'Go': 3,
            'TypeScript': 2,
            'JavaScript': 2,
            'Python': 2,
            'Java': 2
        };
        
        const baseComplexity = complexityMap[language] || 1;
        complexityScore += baseComplexity;
        
        return Math.min(5, complexityScore);
    }

    private detectFrameworks(language: string, files: FileData[]): string[] {
        const frameworks = new Set<string>();
        const patterns = this.frameworkPatterns.get(language) || [];
        
        files.forEach(file => {
            const filename = file.filename.toLowerCase();
            patterns.forEach(pattern => {
                if (filename.includes(pattern)) {
                    frameworks.add(pattern);
                }
            });
        });
        
        return Array.from(frameworks);
    }

    private detectLibraries(language: string, files: FileData[]): string[] {
        // Simplified library detection based on common import patterns
        const libraries = new Set<string>();
        
        // This would typically involve parsing file contents
        // For now, we'll use filename patterns
        files.forEach(file => {
            const filename = file.filename.toLowerCase();
            
            // Common library indicators
            if (filename.includes('lib') || filename.includes('vendor') || 
                filename.includes('node_modules') || filename.includes('package')) {
                const parts = filename.split('/');
                parts.forEach(part => {
                    if (part.length > 2 && !part.includes('.')) {
                        libraries.add(part);
                    }
                });
            }
        });
        
        return Array.from(libraries).slice(0, 10); // Limit to top 10
    }

    private detectPatterns(language: string, files: FileData[]): string[] {
        const patterns = new Set<string>();
        
        files.forEach(file => {
            const filename = file.filename.toLowerCase();
            
            // Design patterns
            if (filename.includes('factory')) patterns.add('factory_pattern');
            if (filename.includes('singleton')) patterns.add('singleton_pattern');
            if (filename.includes('observer')) patterns.add('observer_pattern');
            if (filename.includes('strategy')) patterns.add('strategy_pattern');
            if (filename.includes('adapter')) patterns.add('adapter_pattern');
            
            // Architectural patterns
            if (filename.includes('controller')) patterns.add('mvc_pattern');
            if (filename.includes('service')) patterns.add('service_layer');
            if (filename.includes('repository')) patterns.add('repository_pattern');
            if (filename.includes('middleware')) patterns.add('middleware_pattern');
            
            // Testing patterns
            if (filename.includes('test') || filename.includes('spec')) patterns.add('testing');
            if (filename.includes('mock')) patterns.add('mocking');
        });
        
        return Array.from(patterns);
    }

    private calculateTotalLines(commits: CommitData[]): number {
        return commits.reduce((total, commit) => {
            return total + (commit.files?.reduce((sum, file) => 
                sum + (file.additions || 0), 0) || 0);
        }, 0);
    }

    private calculateLanguageDiversityIndex(languages: LanguageAnalysis[]): number {
        if (languages.length <= 1) return 0;
        
        // Calculate Shannon diversity index
        const totalLines = languages.reduce((sum, lang) => sum + lang.totalLines, 0);
        if (totalLines === 0) return 0;
        
        let diversity = 0;
        languages.forEach(lang => {
            const proportion = lang.totalLines / totalLines;
            if (proportion > 0) {
                diversity -= proportion * Math.log2(proportion);
            }
        });
        
        // Normalize to 0-1 scale
        const maxDiversity = Math.log2(languages.length);
        return maxDiversity > 0 ? diversity / maxDiversity : 0;
    }

    private categorizeLanguages(languages: LanguageAnalysis[]): { [category: string]: string[] } {
        const categories: { [category: string]: string[] } = {
            web_frontend: [],
            web_backend: [],
            mobile: [],
            systems: [],
            data_science: [],
            blockchain: [],
            functional: [],
            scripting: []
        };
        
        const categoryMap: { [language: string]: string } = {
            'JavaScript': 'web_frontend',
            'TypeScript': 'web_frontend',
            'HTML': 'web_frontend',
            'CSS': 'web_frontend',
            'Python': 'web_backend',
            'Java': 'web_backend',
            'Go': 'web_backend',
            'Rust': 'systems',
            'C++': 'systems',
            'C': 'systems',
            'Swift': 'mobile',
            'Kotlin': 'mobile',
            'Dart': 'mobile',
            'Solidity': 'blockchain',
            'Haskell': 'functional',
            'Shell': 'scripting',
            'R': 'data_science'
        };
        
        languages.forEach(lang => {
            const category = categoryMap[lang.language] || 'other';
            if (!categories[category]) categories[category] = [];
            categories[category].push(lang.language);
        });
        
        return categories;
    }

    private calculatePolyglotScore(languages: LanguageAnalysis[]): number {
        if (languages.length === 0) return 0;
        
        // Base score from number of languages
        let score = Math.min(50, languages.length * 10);
        
        // Bonus for language diversity across categories
        const categories = this.categorizeLanguages(languages);
        const categoryCount = Object.values(categories).filter(langs => langs.length > 0).length;
        score += categoryCount * 5;
        
        // Bonus for high proficiency in multiple languages
        const highProficiencyCount = languages.filter(lang => lang.proficiencyScore >= 70).length;
        score += highProficiencyCount * 5;
        
        // Bonus for complex languages
        const complexLanguageCount = languages.filter(lang => lang.complexityLevel >= 3).length;
        score += complexLanguageCount * 5;
        
        return Math.min(100, score);
    }

    private hashLanguage(language: string): string {
        if (!language) return '0';
        return createHash('sha256').update(language).digest('hex').substring(0, 16);
    }
}

interface LanguageSummary {
    totalLanguages: number;
    primaryLanguage: string;
    totalLinesAllLanguages: number;
    avgProficiency: number;
    avgComplexity: number;
    diversityIndex: number;
    categories: { [category: string]: string[] };
    experienceSpanMonths: number;
    polyglotScore: number;
}

export default LanguageDetector;