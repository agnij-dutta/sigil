import { RepositoryCredential, LanguageCredential, CollaborationCredential, AggregateCredential } from '../types/credentials.js';

export interface CredentialGenerationOptions {
  privacyLevel: 'low' | 'medium' | 'high';
  includeMetadata?: boolean;
  expirationDays?: number;
  trustedSetupPath?: string;
}

export class CredentialGenerator {
  async generateRepositoryCredential(
    repositoryData: any,
    userCommitments: any,
    options: CredentialGenerationOptions
  ): Promise<RepositoryCredential> {
    // Generate ZK proof for repository claims
    const claims = this.extractRepositoryClaims(repositoryData, userCommitments);
    const zkProof = await this.generateZKProof('repository', claims, options);

    return {
      type: 'repository',
      version: '1.0',
      issuer: 'sigil-credential-issuer',
      subject: userCommitments.userHash,
      claims,
      proof: zkProof,
      issuedAt: Date.now(),
      expiresAt: options.expirationDays ? Date.now() + (options.expirationDays * 24 * 60 * 60 * 1000) : undefined,
      metadata: options.includeMetadata ? {
        privacyLevel: options.privacyLevel,
        generationMethod: 'zk-snark',
        circuitHash: 'repo-circuit-v1-hash'
      } : undefined
    };
  }

  async generateLanguageCredential(
    languageData: any,
    userCommitments: any,
    options: CredentialGenerationOptions
  ): Promise<LanguageCredential> {
    const claims = this.extractLanguageClaims(languageData, userCommitments);
    const zkProof = await this.generateZKProof('language', claims, options);

    return {
      type: 'language',
      version: '1.0',
      issuer: 'sigil-credential-issuer',
      subject: userCommitments.userHash,
      claims,
      proof: zkProof,
      issuedAt: Date.now(),
      expiresAt: options.expirationDays ? Date.now() + (options.expirationDays * 24 * 60 * 60 * 1000) : undefined,
      metadata: options.includeMetadata ? {
        privacyLevel: options.privacyLevel,
        generationMethod: 'zk-snark',
        circuitHash: 'lang-circuit-v1-hash'
      } : undefined
    };
  }

  private extractRepositoryClaims(repositoryData: any, userCommitments: any): any {
    return {
      repositoryHash: this.hashRepository(repositoryData),
      commitCountRange: this.getCommitCountRange(repositoryData.commits?.length || 0),
      locRange: this.getLOCRange(repositoryData.totalLOC || 0),
      isPrivateRepo: repositoryData.private,
      collaboratorCount: repositoryData.collaborators?.length || 0,
      userIsOwner: repositoryData.owner === userCommitments.username,
      userIsSoleContributor: this.checkSoleContributor(repositoryData, userCommitments.username)
    };
  }

  private extractLanguageClaims(languageData: any, userCommitments: any): any {
    return {
      languagesUsed: languageData.languages || [],
      primaryLanguage: languageData.primaryLanguage,
      proficiencyLevels: languageData.proficiencyLevels || {},
      totalProjects: languageData.projectCount || 0,
      experienceYears: languageData.experienceYears || 0
    };
  }

  private async generateZKProof(type: string, claims: any, options: CredentialGenerationOptions): Promise<any> {
    // Simplified ZK proof generation - real implementation would use circom/snarkjs
    return {
      pi_a: ['0x1234...', '0x5678...'],
      pi_b: [['0xabcd...', '0xefgh...'], ['0xijkl...', '0xmnop...']],
      pi_c: ['0xqrst...', '0xuvwx...'],
      protocol: 'groth16',
      curve: 'bn128'
    };
  }

  private hashRepository(repositoryData: any): string {
    const repoString = `${repositoryData.owner}/${repositoryData.name}`;
    return Buffer.from(repoString).toString('hex');
  }

  private getCommitCountRange(commitCount: number): { min: number; max: number } {
    // Return ranges for privacy
    if (commitCount < 10) return { min: 1, max: 10 };
    if (commitCount < 50) return { min: 10, max: 50 };
    if (commitCount < 100) return { min: 50, max: 100 };
    if (commitCount < 500) return { min: 100, max: 500 };
    return { min: 500, max: 1000 };
  }

  private getLOCRange(loc: number): { min: number; max: number } {
    // Return ranges for privacy
    if (loc < 1000) return { min: 1, max: 1000 };
    if (loc < 5000) return { min: 1000, max: 5000 };
    if (loc < 10000) return { min: 5000, max: 10000 };
    if (loc < 50000) return { min: 10000, max: 50000 };
    return { min: 50000, max: 100000 };
  }

  private checkSoleContributor(repositoryData: any, username: string): boolean {
    const contributors = repositoryData.commits?.map((c: any) => c.author?.login) || [];
    const uniqueContributors = new Set(contributors);
    return uniqueContributors.size === 1 && uniqueContributors.has(username);
  }
} 