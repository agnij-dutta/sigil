import { RepositoryData, CommitData, CollaboratorData, FileData } from '../../../types/index.js';

/**
 * Input Validator
 * 
 * Validates and sanitizes input data before circuit processing.
 * Ensures data integrity, format compliance, and security constraints.
 */

export interface ValidationConfig {
    maxCommits: number;
    maxCollaborators: number;
    maxFileSize: number;
    maxMessageLength: number;
    allowedFileExtensions: string[];
    securityChecks: boolean;
    privacyValidation: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    sanitizedData?: any;
    confidence: number;
}

export interface ValidationError {
    code: string;
    message: string;
    field: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
    code: string;
    message: string;
    field: string;
    suggestion: string;
}

export class InputValidator {
    private config: ValidationConfig;

    constructor(config: ValidationConfig) {
        this.config = config;
    }

    /**
     * Validate repository data for circuit processing
     */
    async validateRepositoryData(repoData: RepositoryData): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        try {
            // Validate basic structure
            this.validateBasicStructure(repoData, errors);
            
            // Validate commits
            this.validateCommits(repoData.commits || [], errors, warnings);
            
            // Validate collaborators
            this.validateCollaborators(repoData.collaborators || [], errors, warnings);
            
            // Validate repository metadata
            this.validateRepositoryMetadata(repoData, errors, warnings);
            
            // Security validation
            if (this.config.securityChecks) {
                this.performSecurityValidation(repoData, errors, warnings);
            }
            
            // Privacy validation
            if (this.config.privacyValidation) {
                this.performPrivacyValidation(repoData, errors, warnings);
            }

            // Calculate confidence score
            const confidence = this.calculateConfidenceScore(repoData, errors, warnings);
            
            // Sanitize data if validation passes
            let sanitizedData = undefined;
            if (errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0) {
                sanitizedData = this.sanitizeRepositoryData(repoData);
            }

            return {
                isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
                errors,
                warnings,
                sanitizedData,
                confidence
            };

        } catch (error) {
            errors.push({
                code: 'VALIDATION_EXCEPTION',
                message: `Validation failed: ${error.message}`,
                field: 'general',
                severity: 'critical'
            });

            return {
                isValid: false,
                errors,
                warnings,
                confidence: 0
            };
        }
    }

    /**
     * Validate circuit input format
     */
    async validateCircuitInputs(inputs: any): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        try {
            // Validate repository credential inputs
            if (inputs.repositoryCredential) {
                this.validateRepositoryCredentialInputs(inputs.repositoryCredential, errors);
            }

            // Validate language credential inputs
            if (inputs.languageCredential) {
                this.validateLanguageCredentialInputs(inputs.languageCredential, errors);
            }

            // Validate collaboration credential inputs
            if (inputs.collaborationCredential) {
                this.validateCollaborationCredentialInputs(inputs.collaborationCredential, errors);
            }

            // Validate consistency credential inputs
            if (inputs.consistencyCredential) {
                this.validateConsistencyCredentialInputs(inputs.consistencyCredential, errors);
            }

            // Validate privacy parameters
            if (inputs.privacyParameters) {
                this.validatePrivacyParameters(inputs.privacyParameters, errors);
            }

            const confidence = this.calculateCircuitInputConfidence(inputs, errors);

            return {
                isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
                errors,
                warnings,
                confidence
            };

        } catch (error) {
            errors.push({
                code: 'CIRCUIT_INPUT_VALIDATION_ERROR',
                message: `Circuit input validation failed: ${error.message}`,
                field: 'circuitInputs',
                severity: 'critical'
            });

            return {
                isValid: false,
                errors,
                warnings,
                confidence: 0
            };
        }
    }

    /**
     * Validate basic repository structure
     */
    private validateBasicStructure(repoData: RepositoryData, errors: ValidationError[]) {
        // Check required fields
        if (!repoData.name || typeof repoData.name !== 'string') {
            errors.push({
                code: 'MISSING_REPO_NAME',
                message: 'Repository name is required and must be a string',
                field: 'name',
                severity: 'critical'
            });
        }

        if (!repoData.owner || typeof repoData.owner !== 'string') {
            errors.push({
                code: 'MISSING_REPO_OWNER',
                message: 'Repository owner is required and must be a string',
                field: 'owner',
                severity: 'critical'
            });
        }

        if (!repoData.userAddress || typeof repoData.userAddress !== 'string') {
            errors.push({
                code: 'MISSING_USER_ADDRESS',
                message: 'User address is required and must be a string',
                field: 'userAddress',
                severity: 'critical'
            });
        }

        // Validate name format
        if (repoData.name && !/^[a-zA-Z0-9._-]+$/.test(repoData.name)) {
            errors.push({
                code: 'INVALID_REPO_NAME_FORMAT',
                message: 'Repository name contains invalid characters',
                field: 'name',
                severity: 'high'
            });
        }

        // Validate address format (basic check)
        if (repoData.userAddress && !/^[a-zA-Z0-9._-]+$/.test(repoData.userAddress)) {
            errors.push({
                code: 'INVALID_USER_ADDRESS_FORMAT',
                message: 'User address format appears invalid',
                field: 'userAddress',
                severity: 'medium'
            });
        }
    }

    /**
     * Validate commits data
     */
    private validateCommits(commits: CommitData[], errors: ValidationError[], warnings: ValidationWarning[]) {
        if (!Array.isArray(commits)) {
            errors.push({
                code: 'INVALID_COMMITS_FORMAT',
                message: 'Commits must be an array',
                field: 'commits',
                severity: 'critical'
            });
            return;
        }

        // Check commit count limits
        if (commits.length > this.config.maxCommits) {
            warnings.push({
                code: 'EXCESSIVE_COMMIT_COUNT',
                message: `Commit count (${commits.length}) exceeds recommended limit (${this.config.maxCommits})`,
                field: 'commits',
                suggestion: 'Consider filtering to most recent commits'
            });
        }

        // Validate individual commits
        commits.forEach((commit, index) => {
            this.validateSingleCommit(commit, index, errors, warnings);
        });

        // Check for duplicate commits
        const shaSet = new Set();
        const duplicates: string[] = [];
        commits.forEach(commit => {
            if (commit.sha) {
                if (shaSet.has(commit.sha)) {
                    duplicates.push(commit.sha);
                } else {
                    shaSet.add(commit.sha);
                }
            }
        });

        if (duplicates.length > 0) {
            warnings.push({
                code: 'DUPLICATE_COMMITS',
                message: `Found ${duplicates.length} duplicate commits`,
                field: 'commits',
                suggestion: 'Remove duplicate commits to improve data quality'
            });
        }
    }

    /**
     * Validate single commit
     */
    private validateSingleCommit(commit: CommitData, index: number, errors: ValidationError[], warnings: ValidationWarning[]) {
        const fieldPrefix = `commits[${index}]`;

        // Required fields
        if (!commit.sha || typeof commit.sha !== 'string') {
            errors.push({
                code: 'MISSING_COMMIT_SHA',
                message: 'Commit SHA is required',
                field: `${fieldPrefix}.sha`,
                severity: 'high'
            });
        }

        if (!commit.author || typeof commit.author !== 'string') {
            errors.push({
                code: 'MISSING_COMMIT_AUTHOR',
                message: 'Commit author is required',
                field: `${fieldPrefix}.author`,
                severity: 'high'
            });
        }

        if (!commit.timestamp) {
            errors.push({
                code: 'MISSING_COMMIT_TIMESTAMP',
                message: 'Commit timestamp is required',
                field: `${fieldPrefix}.timestamp`,
                severity: 'high'
            });
        }

        // Validate SHA format
        if (commit.sha && !/^[a-f0-9]{40}$/i.test(commit.sha)) {
            warnings.push({
                code: 'INVALID_SHA_FORMAT',
                message: 'Commit SHA does not match expected format',
                field: `${fieldPrefix}.sha`,
                suggestion: 'Ensure SHA is a valid 40-character hexadecimal string'
            });
        }

        // Validate timestamp
        if (commit.timestamp) {
            const date = new Date(commit.timestamp);
            if (isNaN(date.getTime())) {
                errors.push({
                    code: 'INVALID_TIMESTAMP',
                    message: 'Commit timestamp is not a valid date',
                    field: `${fieldPrefix}.timestamp`,
                    severity: 'medium'
                });
            } else {
                // Check for future dates
                if (date > new Date()) {
                    warnings.push({
                        code: 'FUTURE_TIMESTAMP',
                        message: 'Commit timestamp is in the future',
                        field: `${fieldPrefix}.timestamp`,
                        suggestion: 'Verify timestamp accuracy'
                    });
                }

                // Check for very old dates (before Git was created)
                if (date < new Date('2005-01-01')) {
                    warnings.push({
                        code: 'ANCIENT_TIMESTAMP',
                        message: 'Commit timestamp predates Git creation',
                        field: `${fieldPrefix}.timestamp`,
                        suggestion: 'Verify timestamp accuracy'
                    });
                }
            }
        }

        // Validate message
        if (commit.message) {
            if (commit.message.length > this.config.maxMessageLength) {
                warnings.push({
                    code: 'LONG_COMMIT_MESSAGE',
                    message: `Commit message exceeds ${this.config.maxMessageLength} characters`,
                    field: `${fieldPrefix}.message`,
                    suggestion: 'Consider truncating very long messages'
                });
            }

            // Check for potentially malicious content
            if (this.containsSuspiciousContent(commit.message)) {
                errors.push({
                    code: 'SUSPICIOUS_COMMIT_MESSAGE',
                    message: 'Commit message contains potentially malicious content',
                    field: `${fieldPrefix}.message`,
                    severity: 'high'
                });
            }
        }

        // Validate files
        if (commit.files) {
            if (!Array.isArray(commit.files)) {
                errors.push({
                    code: 'INVALID_FILES_FORMAT',
                    message: 'Commit files must be an array',
                    field: `${fieldPrefix}.files`,
                    severity: 'medium'
                });
            } else {
                commit.files.forEach((file, fileIndex) => {
                    this.validateCommitFile(file, `${fieldPrefix}.files[${fileIndex}]`, errors, warnings);
                });
            }
        }

        // Validate numeric fields
        if (commit.additions !== undefined && (typeof commit.additions !== 'number' || commit.additions < 0)) {
            errors.push({
                code: 'INVALID_ADDITIONS',
                message: 'Commit additions must be a non-negative number',
                field: `${fieldPrefix}.additions`,
                severity: 'medium'
            });
        }

        if (commit.deletions !== undefined && (typeof commit.deletions !== 'number' || commit.deletions < 0)) {
            errors.push({
                code: 'INVALID_DELETIONS',
                message: 'Commit deletions must be a non-negative number',
                field: `${fieldPrefix}.deletions`,
                severity: 'medium'
            });
        }
    }

    /**
     * Validate commit file data
     */
    private validateCommitFile(file: FileData, fieldPrefix: string, errors: ValidationError[], warnings: ValidationWarning[]) {
        // Required fields
        if (!file.filename || typeof file.filename !== 'string') {
            errors.push({
                code: 'MISSING_FILENAME',
                message: 'File filename is required',
                field: `${fieldPrefix}.filename`,
                severity: 'medium'
            });
            return;
        }

        // Validate filename
        if (file.filename.length > 255) {
            warnings.push({
                code: 'LONG_FILENAME',
                message: 'Filename is unusually long',
                field: `${fieldPrefix}.filename`,
                suggestion: 'Very long filenames may indicate data issues'
            });
        }

        // Check for suspicious file paths
        if (file.filename.includes('..') || file.filename.includes('~')) {
            warnings.push({
                code: 'SUSPICIOUS_FILE_PATH',
                message: 'Filename contains potentially suspicious path elements',
                field: `${fieldPrefix}.filename`,
                suggestion: 'Review file path for security implications'
            });
        }

        // Validate file extension
        const extension = file.filename.split('.').pop()?.toLowerCase();
        if (extension && this.config.allowedFileExtensions.length > 0) {
            if (!this.config.allowedFileExtensions.includes(extension)) {
                warnings.push({
                    code: 'UNRECOGNIZED_FILE_EXTENSION',
                    message: `File extension '${extension}' is not in allowed list`,
                    field: `${fieldPrefix}.filename`,
                    suggestion: 'Consider adding extension to allowed list if legitimate'
                });
            }
        }

        // Validate numeric fields
        if (file.additions !== undefined && (typeof file.additions !== 'number' || file.additions < 0)) {
            errors.push({
                code: 'INVALID_FILE_ADDITIONS',
                message: 'File additions must be a non-negative number',
                field: `${fieldPrefix}.additions`,
                severity: 'low'
            });
        }

        if (file.deletions !== undefined && (typeof file.deletions !== 'number' || file.deletions < 0)) {
            errors.push({
                code: 'INVALID_FILE_DELETIONS',
                message: 'File deletions must be a non-negative number',
                field: `${fieldPrefix}.deletions`,
                severity: 'low'
            });
        }

        // Check for extremely large changes
        const totalChanges = (file.additions || 0) + (file.deletions || 0);
        if (totalChanges > this.config.maxFileSize) {
            warnings.push({
                code: 'LARGE_FILE_CHANGES',
                message: `File has ${totalChanges} line changes, which is unusually large`,
                field: `${fieldPrefix}`,
                suggestion: 'Large changes might indicate generated files or data issues'
            });
        }
    }

    /**
     * Validate collaborators data
     */
    private validateCollaborators(collaborators: CollaboratorData[], errors: ValidationError[], warnings: ValidationWarning[]) {
        if (!Array.isArray(collaborators)) {
            errors.push({
                code: 'INVALID_COLLABORATORS_FORMAT',
                message: 'Collaborators must be an array',
                field: 'collaborators',
                severity: 'high'
            });
            return;
        }

        if (collaborators.length > this.config.maxCollaborators) {
            warnings.push({
                code: 'EXCESSIVE_COLLABORATOR_COUNT',
                message: `Collaborator count (${collaborators.length}) exceeds recommended limit (${this.config.maxCollaborators})`,
                field: 'collaborators',
                suggestion: 'Consider filtering to most active collaborators'
            });
        }

        // Validate individual collaborators
        collaborators.forEach((collaborator, index) => {
            this.validateSingleCollaborator(collaborator, index, errors, warnings);
        });

        // Check for duplicate collaborators
        const loginSet = new Set();
        const duplicates: string[] = [];
        collaborators.forEach(collaborator => {
            if (collaborator.login) {
                if (loginSet.has(collaborator.login)) {
                    duplicates.push(collaborator.login);
                } else {
                    loginSet.add(collaborator.login);
                }
            }
        });

        if (duplicates.length > 0) {
            warnings.push({
                code: 'DUPLICATE_COLLABORATORS',
                message: `Found ${duplicates.length} duplicate collaborators`,
                field: 'collaborators',
                suggestion: 'Remove duplicate collaborators'
            });
        }
    }

    /**
     * Validate single collaborator
     */
    private validateSingleCollaborator(collaborator: CollaboratorData, index: number, errors: ValidationError[], warnings: ValidationWarning[]) {
        const fieldPrefix = `collaborators[${index}]`;

        // Required fields
        if (!collaborator.login || typeof collaborator.login !== 'string') {
            errors.push({
                code: 'MISSING_COLLABORATOR_LOGIN',
                message: 'Collaborator login is required',
                field: `${fieldPrefix}.login`,
                severity: 'medium'
            });
        }

        // Validate login format
        if (collaborator.login && !/^[a-zA-Z0-9._-]+$/.test(collaborator.login)) {
            warnings.push({
                code: 'UNUSUAL_LOGIN_FORMAT',
                message: 'Collaborator login contains unusual characters',
                field: `${fieldPrefix}.login`,
                suggestion: 'Verify login format is correct'
            });
        }

        // Validate contributions
        if (collaborator.contributions !== undefined) {
            if (typeof collaborator.contributions !== 'number' || collaborator.contributions < 0) {
                errors.push({
                    code: 'INVALID_CONTRIBUTIONS',
                    message: 'Collaborator contributions must be a non-negative number',
                    field: `${fieldPrefix}.contributions`,
                    severity: 'low'
                });
            }
        }

        // Check for suspicious patterns
        if (collaborator.login && this.containsSuspiciousContent(collaborator.login)) {
            errors.push({
                code: 'SUSPICIOUS_COLLABORATOR_LOGIN',
                message: 'Collaborator login contains potentially suspicious content',
                field: `${fieldPrefix}.login`,
                severity: 'high'
            });
        }
    }

    /**
     * Validate repository metadata
     */
    private validateRepositoryMetadata(repoData: RepositoryData, errors: ValidationError[], warnings: ValidationWarning[]) {
        // Check for reasonable data relationships
        const commits = repoData.commits || [];
        const collaborators = repoData.collaborators || [];

        // Check if user is in commits but not in collaborators
        const userInCommits = commits.some(c => c.author === repoData.userAddress);
        const userInCollaborators = collaborators.some(c => c.login === repoData.userAddress);

        if (userInCommits && !userInCollaborators) {
            warnings.push({
                code: 'USER_NOT_IN_COLLABORATORS',
                message: 'User has commits but is not listed as a collaborator',
                field: 'general',
                suggestion: 'Add user to collaborators list or verify data consistency'
            });
        }

        // Check for commits without corresponding collaborators
        const commitAuthors = new Set(commits.map(c => c.author));
        const collaboratorLogins = new Set(collaborators.map(c => c.login));
        const orphanedAuthors = Array.from(commitAuthors).filter(author => !collaboratorLogins.has(author));

        if (orphanedAuthors.length > 0) {
            warnings.push({
                code: 'ORPHANED_COMMIT_AUTHORS',
                message: `Found ${orphanedAuthors.length} commit authors not in collaborators list`,
                field: 'general',
                suggestion: 'Ensure all commit authors are included in collaborators'
            });
        }

        // Validate timestamp consistency
        if (commits.length > 1) {
            const timestamps = commits.map(c => new Date(c.timestamp).getTime()).filter(t => !isNaN(t));
            if (timestamps.length > 1) {
                const sorted = [...timestamps].sort();
                const span = sorted[sorted.length - 1] - sorted[0];
                const daySpan = span / (1000 * 60 * 60 * 24);

                if (daySpan > 365 * 10) { // More than 10 years
                    warnings.push({
                        code: 'LARGE_TIME_SPAN',
                        message: `Repository spans ${Math.round(daySpan / 365)} years`,
                        field: 'commits',
                        suggestion: 'Verify timestamp accuracy for very old repositories'
                    });
                }
            }
        }
    }

    /**
     * Perform security validation
     */
    private performSecurityValidation(repoData: RepositoryData, errors: ValidationError[], warnings: ValidationWarning[]) {
        // Check for potentially malicious patterns in repository name
        if (this.containsSuspiciousContent(repoData.name)) {
            errors.push({
                code: 'SUSPICIOUS_REPO_NAME',
                message: 'Repository name contains potentially malicious content',
                field: 'name',
                severity: 'high'
            });
        }

        // Check for SQL injection patterns
        const textFields = [repoData.name, repoData.owner];
        textFields.forEach((field, index) => {
            if (field && this.containsSqlInjectionPatterns(field)) {
                errors.push({
                    code: 'SQL_INJECTION_PATTERN',
                    message: 'Field contains potential SQL injection patterns',
                    field: index === 0 ? 'name' : 'owner',
                    severity: 'critical'
                });
            }
        });

        // Check for XSS patterns in commit messages
        const commits = repoData.commits || [];
        commits.forEach((commit, index) => {
            if (commit.message && this.containsXssPatterns(commit.message)) {
                errors.push({
                    code: 'XSS_PATTERN',
                    message: 'Commit message contains potential XSS patterns',
                    field: `commits[${index}].message`,
                    severity: 'high'
                });
            }
        });
    }

    /**
     * Perform privacy validation
     */
    private performPrivacyValidation(repoData: RepositoryData, errors: ValidationError[], warnings: ValidationWarning[]) {
        // Check for PII in commit messages
        const commits = repoData.commits || [];
        commits.forEach((commit, index) => {
            if (commit.message && this.containsPII(commit.message)) {
                warnings.push({
                    code: 'POTENTIAL_PII',
                    message: 'Commit message may contain personally identifiable information',
                    field: `commits[${index}].message`,
                    suggestion: 'Review and sanitize any personal information'
                });
            }
        });

        // Check for email addresses in author fields
        commits.forEach((commit, index) => {
            if (commit.author && this.containsEmail(commit.author)) {
                warnings.push({
                    code: 'EMAIL_IN_AUTHOR',
                    message: 'Author field contains email address',
                    field: `commits[${index}].author`,
                    suggestion: 'Consider using usernames instead of email addresses'
                });
            }
        });
    }

    /**
     * Validate repository credential inputs
     */
    private validateRepositoryCredentialInputs(inputs: any, errors: ValidationError[]) {
        const required = ['repoCommitment', 'commitCountRange', 'locRange', 'collaboratorCount'];
        required.forEach(field => {
            if (inputs[field] === undefined || inputs[field] === null) {
                errors.push({
                    code: 'MISSING_REPO_CREDENTIAL_FIELD',
                    message: `Missing required field: ${field}`,
                    field: `repositoryCredential.${field}`,
                    severity: 'critical'
                });
            }
        });

        // Validate ranges
        if (inputs.commitCountRange && typeof inputs.commitCountRange === 'object') {
            if (inputs.commitCountRange.min > inputs.commitCountRange.max) {
                errors.push({
                    code: 'INVALID_COMMIT_RANGE',
                    message: 'Commit count range min is greater than max',
                    field: 'repositoryCredential.commitCountRange',
                    severity: 'high'
                });
            }
        }

        if (inputs.locRange && typeof inputs.locRange === 'object') {
            if (inputs.locRange.min > inputs.locRange.max) {
                errors.push({
                    code: 'INVALID_LOC_RANGE',
                    message: 'LOC range min is greater than max',
                    field: 'repositoryCredential.locRange',
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Validate language credential inputs
     */
    private validateLanguageCredentialInputs(inputs: any, errors: ValidationError[]) {
        const required = ['languageCount', 'languageHashes', 'proficiencyScores'];
        required.forEach(field => {
            if (inputs[field] === undefined || inputs[field] === null) {
                errors.push({
                    code: 'MISSING_LANGUAGE_CREDENTIAL_FIELD',
                    message: `Missing required field: ${field}`,
                    field: `languageCredential.${field}`,
                    severity: 'critical'
                });
            }
        });

        // Validate arrays have consistent lengths
        if (inputs.languageHashes && inputs.proficiencyScores) {
            if (inputs.languageHashes.length !== inputs.proficiencyScores.length) {
                errors.push({
                    code: 'INCONSISTENT_LANGUAGE_ARRAYS',
                    message: 'Language arrays have inconsistent lengths',
                    field: 'languageCredential',
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Validate collaboration credential inputs
     */
    private validateCollaborationCredentialInputs(inputs: any, errors: ValidationError[]) {
        const required = ['collaboratorHashes', 'contributionPercentage', 'teamDiversityScore'];
        required.forEach(field => {
            if (inputs[field] === undefined || inputs[field] === null) {
                errors.push({
                    code: 'MISSING_COLLABORATION_CREDENTIAL_FIELD',
                    message: `Missing required field: ${field}`,
                    field: `collaborationCredential.${field}`,
                    severity: 'critical'
                });
            }
        });

        // Validate percentage ranges
        if (inputs.contributionPercentage !== undefined) {
            if (inputs.contributionPercentage < 0 || inputs.contributionPercentage > 100) {
                errors.push({
                    code: 'INVALID_CONTRIBUTION_PERCENTAGE',
                    message: 'Contribution percentage must be between 0 and 100',
                    field: 'collaborationCredential.contributionPercentage',
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Validate consistency credential inputs
     */
    private validateConsistencyCredentialInputs(inputs: any, errors: ValidationError[]) {
        const required = ['consistencyScore', 'activityDays', 'repositoryAge'];
        required.forEach(field => {
            if (inputs[field] === undefined || inputs[field] === null) {
                errors.push({
                    code: 'MISSING_CONSISTENCY_CREDENTIAL_FIELD',
                    message: `Missing required field: ${field}`,
                    field: `consistencyCredential.${field}`,
                    severity: 'critical'
                });
            }
        });

        // Validate score ranges
        if (inputs.consistencyScore !== undefined) {
            if (inputs.consistencyScore < 0 || inputs.consistencyScore > 100) {
                errors.push({
                    code: 'INVALID_CONSISTENCY_SCORE',
                    message: 'Consistency score must be between 0 and 100',
                    field: 'consistencyCredential.consistencyScore',
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Validate privacy parameters
     */
    private validatePrivacyParameters(inputs: any, errors: ValidationError[]) {
        // Validate epsilon for differential privacy
        if (inputs.epsilon !== undefined) {
            if (typeof inputs.epsilon !== 'number' || inputs.epsilon <= 0) {
                errors.push({
                    code: 'INVALID_EPSILON',
                    message: 'Epsilon must be a positive number',
                    field: 'privacyParameters.epsilon',
                    severity: 'high'
                });
            }
        }

        // Validate k for k-anonymity
        if (inputs.k !== undefined) {
            if (typeof inputs.k !== 'number' || inputs.k < 2 || !Number.isInteger(inputs.k)) {
                errors.push({
                    code: 'INVALID_K_VALUE',
                    message: 'K must be an integer >= 2',
                    field: 'privacyParameters.k',
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Calculate confidence score based on validation results
     */
    private calculateConfidenceScore(repoData: RepositoryData, errors: ValidationError[], warnings: ValidationWarning[]): number {
        let confidence = 100;

        // Deduct points for errors
        errors.forEach(error => {
            switch (error.severity) {
                case 'critical': confidence -= 25; break;
                case 'high': confidence -= 15; break;
                case 'medium': confidence -= 10; break;
                case 'low': confidence -= 5; break;
            }
        });

        // Deduct points for warnings
        warnings.forEach(warning => {
            confidence -= 2;
        });

        // Bonus points for data completeness
        const commits = repoData.commits || [];
        const collaborators = repoData.collaborators || [];

        if (commits.length > 10) confidence += 5;
        if (collaborators.length > 1) confidence += 5;
        if (commits.every(c => c.files && c.files.length > 0)) confidence += 5;

        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * Calculate circuit input confidence
     */
    private calculateCircuitInputConfidence(inputs: any, errors: ValidationError[]): number {
        let confidence = 100;

        // Deduct points for errors
        errors.forEach(error => {
            switch (error.severity) {
                case 'critical': confidence -= 30; break;
                case 'high': confidence -= 20; break;
                case 'medium': confidence -= 10; break;
                case 'low': confidence -= 5; break;
            }
        });

        // Bonus for completeness
        const requiredSections = ['repositoryCredential', 'languageCredential', 'collaborationCredential', 'consistencyCredential'];
        const presentSections = requiredSections.filter(section => inputs[section]).length;
        confidence += (presentSections / requiredSections.length) * 10;

        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * Sanitize repository data
     */
    private sanitizeRepositoryData(repoData: RepositoryData): RepositoryData {
        const sanitized = { ...repoData };

        // Sanitize string fields
        sanitized.name = this.sanitizeString(repoData.name);
        sanitized.owner = this.sanitizeString(repoData.owner);
        sanitized.userAddress = this.sanitizeString(repoData.userAddress);

        // Sanitize commits
        if (repoData.commits) {
            sanitized.commits = repoData.commits.map(commit => ({
                ...commit,
                message: commit.message ? this.sanitizeString(commit.message) : commit.message,
                author: this.sanitizeString(commit.author)
            }));
        }

        // Sanitize collaborators
        if (repoData.collaborators) {
            sanitized.collaborators = repoData.collaborators.map(collaborator => ({
                ...collaborator,
                login: this.sanitizeString(collaborator.login)
            }));
        }

        return sanitized;
    }

    /**
     * Sanitize string input
     */
    private sanitizeString(input: string): string {
        if (!input) return input;

        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Check for suspicious content
     */
    private containsSuspiciousContent(text: string): boolean {
        const suspiciousPatterns = [
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /onload/i,
            /onerror/i,
            /eval\(/i,
            /document\.cookie/i,
            /window\.location/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Check for SQL injection patterns
     */
    private containsSqlInjectionPatterns(text: string): boolean {
        const sqlPatterns = [
            /(\s|^)(union|select|insert|update|delete|drop|create|alter)\s/i,
            /(\s|^)(or|and)\s+\d+\s*=\s*\d+/i,
            /(\s|^)(or|and)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/i,
            /--/,
            /\/\*/,
            /\*\//
        ];

        return sqlPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Check for XSS patterns
     */
    private containsXssPatterns(text: string): boolean {
        const xssPatterns = [
            /<script/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /javascript:/i,
            /on\w+\s*=/i
        ];

        return xssPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Check for personally identifiable information
     */
    private containsPII(text: string): boolean {
        const piiPatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
            /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
            /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP address
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
        ];

        return piiPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Check for email addresses
     */
    private containsEmail(text: string): boolean {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        return emailPattern.test(text);
    }
}

export default InputValidator;