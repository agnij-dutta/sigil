import { expect } from 'chai';
import { CredentialGenerator } from '../../credentials/generators/credential_generator.js';
import { CredentialVerifier } from '../../verification/verifiers/credential_verifier.js';
import { GitHubCrawler } from '../../aggregation/processors/github_crawler.js';
import { RepositoryAnalyzer } from '../../indexing/analyzers/repository_analyzer.js';
import { LanguageDetector } from '../../languages/detection/language_detector.js';

describe('Integration: Complete Credential Flow', () => {
  let credentialGenerator: CredentialGenerator;
  let credentialVerifier: CredentialVerifier;
  let githubCrawler: GitHubCrawler;
  let repositoryAnalyzer: RepositoryAnalyzer;
  let languageDetector: LanguageDetector;

  const mockGitHubToken = 'mock_token_for_testing';
  const testRepository = {
    owner: 'test-org',
    name: 'test-repo',
    isPrivate: true
  };

  beforeEach(() => {
    credentialGenerator = new CredentialGenerator();
    credentialVerifier = new CredentialVerifier();
    githubCrawler = new GitHubCrawler(mockGitHubToken);
    repositoryAnalyzer = new RepositoryAnalyzer();
    languageDetector = new LanguageDetector();
  });

  describe('Repository Credential Flow', () => {
    it('should generate and verify repository credentials end-to-end', async () => {
      // Step 1: Crawl repository data
      const repositoryData = await githubCrawler.crawlRepository(
        testRepository.owner,
        testRepository.name,
        'test-user'
      );

      expect(repositoryData).to.be.an('object');
      expect(repositoryData.commits).to.be.an('array');
      expect(repositoryData.files).to.be.an('array');

      // Step 2: Analyze repository
      const analysis = await repositoryAnalyzer.analyzeRepository(
        repositoryData,
        'test-user'
      );

      expect(analysis.metrics.totalCommits).to.be.a('number');
      expect(analysis.metrics.totalLinesOfCode).to.be.a('number');
      expect(analysis.collaborationPatterns.contributionPercentage).to.be.a('number');

      // Step 3: Generate credential
      const userCommitments = {
        userHash: 'test-user-hash',
        username: 'test-user'
      };

      const credential = await credentialGenerator.generateRepositoryCredential(
        repositoryData,
        userCommitments,
        {
          privacyLevel: 'high',
          includeMetadata: true,
          expirationDays: 30
        }
      );

      expect(credential.type).to.equal('repository');
      expect(credential.claims).to.be.an('object');
      expect(credential.proof).to.be.an('object');

      // Verify critical claims are present
      expect(credential.claims.repositoryHash).to.be.a('string');
      expect(credential.claims.commitCountRange).to.have.property('min');
      expect(credential.claims.commitCountRange).to.have.property('max');
      expect(credential.claims.collaboratorCount).to.be.a('number');

      // Step 4: Verify credential
      const verificationContext = {
        trustedIssuers: ['sigil-credential-issuer'],
        issuerTrustLevels: { 'sigil-credential-issuer': 90 },
        verificationTime: Date.now()
      };

      const verificationResult = await credentialVerifier.verifyCredential(
        credential,
        verificationContext,
        {
          requireRecent: true,
          maxAge: 7,
          minimumTrustLevel: 70
        }
      );

      expect(verificationResult.isValid).to.be.true;
      expect(verificationResult.trustLevel).to.be.at.least(70);
    });

    it('should prove all 6 critical claims correctly', async () => {
      const repositoryData = createMockRepositoryData();
      const userCommitments = {
        userHash: 'test-user-hash',
        username: 'test-user'
      };

      const credential = await credentialGenerator.generateRepositoryCredential(
        repositoryData,
        userCommitments,
        { privacyLevel: 'high' }
      );

      // Verify all 6 critical claims
      const claims = credential.claims;

      // 1. Repository membership (via hash)
      expect(claims.repositoryHash).to.be.a('string');

      // 2. Commit count in range
      expect(claims.commitCountRange).to.have.property('min');
      expect(claims.commitCountRange).to.have.property('max');

      // 3. Lines of code range
      expect(claims.locRange).to.have.property('min');
      expect(claims.locRange).to.have.property('max');

      // 4. Collaborator count
      expect(claims.collaboratorCount).to.be.a('number');

      // 5. Not sole contributor
      expect(claims.userIsSoleContributor).to.be.a('boolean');

      // 6. Not repository owner
      expect(claims.userIsOwner).to.be.a('boolean');
    });
  });

  describe('Language Credential Flow', () => {
    it('should generate and verify language credentials', async () => {
      const repositoryData = createMockRepositoryData();
      
      // Detect languages
      const languageData = await languageDetector.detectLanguagesInRepository(repositoryData);
      
      expect(languageData.languages).to.be.an('array');
      expect(languageData.primaryLanguage).to.be.a('string');

      // Generate language credential
      const userCommitments = {
        userHash: 'test-user-hash',
        username: 'test-user'
      };

      const credential = await credentialGenerator.generateLanguageCredential(
        languageData,
        userCommitments,
        { privacyLevel: 'medium' }
      );

      expect(credential.type).to.equal('language');
      expect(credential.claims.languagesUsed).to.be.an('array');
      expect(credential.claims.primaryLanguage).to.be.a('string');

      // Verify credential
      const verificationContext = {
        trustedIssuers: ['sigil-credential-issuer'],
        issuerTrustLevels: { 'sigil-credential-issuer': 90 },
        verificationTime: Date.now()
      };

      const verificationResult = await credentialVerifier.verifyCredential(
        credential,
        verificationContext
      );

      expect(verificationResult.isValid).to.be.true;
    });

    it('should handle dynamic number of languages', async () => {
      // Test with 2 languages
      let languageData = {
        languages: ['JavaScript', 'TypeScript'],
        primaryLanguage: 'TypeScript',
        proficiencyLevels: { 'JavaScript': 8, 'TypeScript': 9 }
      };

      let credential = await credentialGenerator.generateLanguageCredential(
        languageData,
        { userHash: 'test', username: 'test' },
        { privacyLevel: 'medium' }
      );

      expect(credential.claims.languagesUsed).to.have.length(2);

      // Test with 10 languages
      languageData = {
        languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Rust', 'Go', 'Solidity', 'Ruby', 'Swift'],
        primaryLanguage: 'JavaScript',
        proficiencyLevels: {}
      };

      credential = await credentialGenerator.generateLanguageCredential(
        languageData,
        { userHash: 'test', username: 'test' },
        { privacyLevel: 'medium' }
      );

      expect(credential.claims.languagesUsed).to.have.length(10);
    });
  });

  describe('Privacy Preservation', () => {
    it('should preserve privacy in credential generation', async () => {
      const repositoryData = createMockRepositoryData();
      const userCommitments = {
        userHash: 'test-user-hash',
        username: 'test-user'
      };

      const credential = await credentialGenerator.generateRepositoryCredential(
        repositoryData,
        userCommitments,
        { privacyLevel: 'high' }
      );

      // Verify privacy-preserving ranges instead of exact values
      const claims = credential.claims;
      
      // Commit count should be in range, not exact
      expect(claims.commitCountRange.min).to.be.lessThan(claims.commitCountRange.max);
      
      // LOC should be in range, not exact
      expect(claims.locRange.min).to.be.lessThan(claims.locRange.max);
      
      // Repository should be hashed, not plain text
      expect(claims.repositoryHash).to.not.include(testRepository.name);
      expect(claims.repositoryHash).to.not.include(testRepository.owner);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid repository data gracefully', async () => {
      const invalidData = null;
      const userCommitments = { userHash: 'test', username: 'test' };

      try {
        await credentialGenerator.generateRepositoryCredential(
          invalidData,
          userCommitments,
          { privacyLevel: 'medium' }
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid repository data');
      }
    });

    it('should fail verification with untrusted issuer', async () => {
      const credential = {
        type: 'repository',
        issuer: 'untrusted-issuer',
        subject: 'test-user',
        claims: {},
        proofData: {
          zkProof: { pi_a: [], pi_b: [], pi_c: [] },
          publicInputs: { claimsHash: 'test' }
        },
        timestamp: Date.now()
      };

      const verificationContext = {
        trustedIssuers: ['trusted-issuer-only'],
        issuerTrustLevels: { 'trusted-issuer-only': 90 },
        verificationTime: Date.now()
      };

      const result = await credentialVerifier.verifyCredential(
        credential,
        verificationContext
      );

      expect(result.isValid).to.be.false;
      expect(result.reason).to.include('Untrusted issuer');
    });
  });

  // Helper function to create mock repository data
  function createMockRepositoryData() {
    return {
      name: 'test-repo',
      owner: { login: 'test-org' },
      private: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      commits: [
        {
          author: { login: 'test-user' },
          commit: {
            author: { date: '2024-01-01T00:00:00Z' },
            message: 'Test commit'
          }
        },
        {
          author: { login: 'collaborator-1' },
          commit: {
            author: { date: '2024-01-02T00:00:00Z' },
            message: 'Collaborative commit'
          }
        }
      ],
      files: [
        {
          name: 'index.ts',
          additions: 100,
          changes: 120
        },
        {
          name: 'utils.py',
          additions: 50,
          changes: 60
        }
      ],
      collaborators: [
        { login: 'test-user' },
        { login: 'collaborator-1' },
        { login: 'collaborator-2' }
      ],
      totalLOC: 500
    };
  }
}); 