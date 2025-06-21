export interface RepositoryMetrics {
  totalCommits: number;
  totalLinesOfCode: number;
  languageDistribution: { [language: string]: number };
  collaboratorCount: number;
  commitFrequency: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  codeComplexity: {
    average: number;
    median: number;
    max: number;
  };
  fileStructure: {
    totalFiles: number;
    directories: number;
    fileTypes: { [extension: string]: number };
  };
}

export interface RepositoryAnalysis {
  repository: {
    name: string;
    owner: string;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  metrics: RepositoryMetrics;
  qualityScore: number;
  activityLevel: 'low' | 'medium' | 'high';
  collaborationPatterns: {
    isPrimaryContributor: boolean;
    contributionPercentage: number;
    pairProgrammingIndicators: number;
  };
}

export class RepositoryAnalyzer {
  async analyzeRepository(repositoryData: any, userLogin: string): Promise<RepositoryAnalysis> {
    const metrics = await this.calculateMetrics(repositoryData);
    const qualityScore = this.calculateQualityScore(metrics);
    const activityLevel = this.determineActivityLevel(metrics);
    const collaborationPatterns = this.analyzeCollaborationPatterns(repositoryData, userLogin);

    return {
      repository: {
        name: repositoryData.name,
        owner: repositoryData.owner.login,
        isPrivate: repositoryData.private,
        createdAt: new Date(repositoryData.created_at),
        updatedAt: new Date(repositoryData.updated_at)
      },
      metrics,
      qualityScore,
      activityLevel,
      collaborationPatterns
    };
  }

  private async calculateMetrics(repositoryData: any): Promise<RepositoryMetrics> {
    // Simulate repository analysis - in real implementation, this would
    // analyze commits, files, and code structure
    const commits = repositoryData.commits || [];
    const files = repositoryData.files || [];
    
    const languageDistribution = this.analyzeLanguageDistribution(files);
    const commitFrequency = this.analyzeCommitFrequency(commits);
    const codeComplexity = this.analyzeCodeComplexity(files);
    const fileStructure = this.analyzeFileStructure(files);

    return {
      totalCommits: commits.length,
      totalLinesOfCode: this.calculateTotalLOC(files),
      languageDistribution,
      collaboratorCount: new Set(commits.map((c: any) => c.author?.login)).size,
      commitFrequency,
      codeComplexity,
      fileStructure
    };
  }

  private analyzeLanguageDistribution(files: any[]): { [language: string]: number } {
    const distribution: { [language: string]: number } = {};
    
    files.forEach(file => {
      const extension = file.name?.split('.').pop()?.toLowerCase();
      const language = this.mapExtensionToLanguage(extension);
      
      if (language) {
        distribution[language] = (distribution[language] || 0) + (file.additions || 0);
      }
    });

    return distribution;
  }

  private mapExtensionToLanguage(extension?: string): string | null {
    const languageMap: { [ext: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'rs': 'Rust',
      'go': 'Go',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'cs': 'C#',
      'scala': 'Scala',
      'sol': 'Solidity'
    };

    return extension ? languageMap[extension] || null : null;
  }

  private analyzeCommitFrequency(commits: any[]): {
    daily: number[];
    weekly: number[];
    monthly: number[];
  } {
    const now = new Date();
    const daily = new Array(30).fill(0);
    const weekly = new Array(12).fill(0);
    const monthly = new Array(12).fill(0);

    commits.forEach(commit => {
      const commitDate = new Date(commit.commit?.author?.date || commit.date);
      const daysDiff = Math.floor((now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.floor(daysDiff / 7);
      const monthsDiff = Math.floor(daysDiff / 30);

      if (daysDiff < 30) daily[daysDiff]++;
      if (weeksDiff < 12) weekly[weeksDiff]++;
      if (monthsDiff < 12) monthly[monthsDiff]++;
    });

    return { daily, weekly, monthly };
  }

  private analyzeCodeComplexity(files: any[]): {
    average: number;
    median: number;
    max: number;
  } {
    const complexities = files.map(file => this.calculateFileComplexity(file));
    const sorted = complexities.sort((a, b) => a - b);

    return {
      average: complexities.reduce((sum, c) => sum + c, 0) / complexities.length || 0,
      median: sorted[Math.floor(sorted.length / 2)] || 0,
      max: Math.max(...complexities) || 0
    };
  }

  private calculateFileComplexity(file: any): number {
    // Simplified complexity calculation based on additions/changes
    const additions = file.additions || 0;
    const changes = file.changes || 0;
    
    // Base complexity on file size and change patterns
    return Math.min(10, Math.floor((additions + changes) / 50));
  }

  private analyzeFileStructure(files: any[]): {
    totalFiles: number;
    directories: number;
    fileTypes: { [extension: string]: number };
  } {
    const fileTypes: { [extension: string]: number } = {};
    const directories = new Set<string>();

    files.forEach(file => {
      const path = file.filename || file.name || '';
      const extension = path.split('.').pop()?.toLowerCase() || 'no-extension';
      
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
      
      const directory = path.split('/').slice(0, -1).join('/');
      if (directory) directories.add(directory);
    });

    return {
      totalFiles: files.length,
      directories: directories.size,
      fileTypes
    };
  }

  private calculateTotalLOC(files: any[]): number {
    return files.reduce((total, file) => total + (file.additions || 0), 0);
  }

  private calculateQualityScore(metrics: RepositoryMetrics): number {
    let score = 0;

    // Language diversity (0-20 points)
    const languageCount = Object.keys(metrics.languageDistribution).length;
    score += Math.min(20, languageCount * 4);

    // Code complexity (0-20 points)
    const complexityScore = Math.max(0, 20 - (metrics.codeComplexity.average * 2));
    score += complexityScore;

    // Activity level (0-30 points)
    const recentCommits = metrics.commitFrequency.weekly.slice(0, 4).reduce((sum, c) => sum + c, 0);
    score += Math.min(30, recentCommits * 2);

    // Collaboration (0-30 points)
    score += Math.min(30, metrics.collaboratorCount * 5);

    return Math.min(100, Math.max(0, score));
  }

  private determineActivityLevel(metrics: RepositoryMetrics): 'low' | 'medium' | 'high' {
    const recentCommits = metrics.commitFrequency.weekly.slice(0, 4).reduce((sum, c) => sum + c, 0);
    
    if (recentCommits >= 20) return 'high';
    if (recentCommits >= 5) return 'medium';
    return 'low';
  }

  private analyzeCollaborationPatterns(repositoryData: any, userLogin: string): {
    isPrimaryContributor: boolean;
    contributionPercentage: number;
    pairProgrammingIndicators: number;
  } {
    const commits = repositoryData.commits || [];
    const userCommits = commits.filter((c: any) => c.author?.login === userLogin);
    const contributionPercentage = commits.length > 0 ? (userCommits.length / commits.length) * 100 : 0;

    // Detect pair programming patterns
    const pairProgrammingIndicators = this.detectPairProgramming(commits, userLogin);

    return {
      isPrimaryContributor: contributionPercentage > 50,
      contributionPercentage,
      pairProgrammingIndicators
    };
  }

  private detectPairProgramming(commits: any[], userLogin: string): number {
    let indicators = 0;
    
    commits.forEach(commit => {
      const message = commit.commit?.message || '';
      const coAuthorPattern = /co-authored-by:/i;
      const pairPattern = /pair:|paired with|with @/i;
      
      if (coAuthorPattern.test(message) || pairPattern.test(message)) {
        indicators++;
      }
    });

    return indicators;
  }
} 