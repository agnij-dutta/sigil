/**
 * Aggregation Validator
 * 
 * Performs comprehensive validation of aggregated data, ensuring data integrity,
 * consistency, and compliance with privacy and security requirements.
 */

import { createHash } from 'crypto';
import { 
    AggregationValidation,
    ValidationError,
    ValidationWarning,
    CrossRepoAggregation,
    AggregationContext,
    PrivacyPreservingAggregation
} from '../types/index.js';

export interface ValidationConfig {
    strictMode: boolean;
    enablePrivacyValidation: boolean;
    enableConsistencyChecks: boolean;
    enableRangeValidation: boolean;
    enableIntegrityChecks: boolean;
    thresholds: {
        minRepositories: number;
        maxRepositories: number;
        minCommits: number;
        maxCommits: number;
        minLanguages: number;
        maxLanguages: number;
        minConsistencyScore: number;
        maxInconsistencyRatio: number;
        minPrivacyScore: number;
    };
    complianceStandards: {
        gdpr: boolean;
        ccpa: boolean;
        iso27001: boolean;
        nist: boolean;
    };
    customRules: ValidationRule[];
}

export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    type: 'range' | 'pattern' | 'custom' | 'dependency' | 'consistency';
    field: string;
    constraint: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    errorMessage: string;
    warningMessage?: string;
    enabled: boolean;
}

export interface ValidationContext {
    userAddress: string;
    aggregationType: string;
    dataSource: string;
    timestamp: Date;
    privacyLevel: string;
    complianceRequirements: string[];
}

export interface ValidationReport {
    isValid: boolean;
    overallScore: number;
    validationId: string;
    timestamp: Date;
    context: ValidationContext;
    results: {
        dataIntegrity: ValidationResult;
        rangeValidation: ValidationResult;
        consistencyChecks: ValidationResult;
        privacyCompliance: ValidationResult;
        securityValidation: ValidationResult;
        businessLogic: ValidationResult;
    };
    errors: ValidationError[];
    warnings: ValidationWarning[];
    recommendations: string[];
    auditTrail: ValidationOperation[];
}

export interface ValidationResult {
    passed: boolean;
    score: number;
    details: string;
    checkCount: number;
    failureCount: number;
    executionTime: number;
}

export interface ValidationOperation {
    operationId: string;
    ruleName: string;
    field: string;
    originalValue: any;
    validatedValue: any;
    result: 'pass' | 'fail' | 'warning';
    message: string;
    timestamp: Date;
}

export class AggregationValidator {
    private config: ValidationConfig;
    private validationHistory: Map<string, ValidationReport> = new Map();
    private ruleEngine: ValidationRuleEngine;

    constructor(config: Partial<ValidationConfig> = {}) {
        this.config = {
            strictMode: false,
            enablePrivacyValidation: true,
            enableConsistencyChecks: true,
            enableRangeValidation: true,
            enableIntegrityChecks: true,
            thresholds: {
                minRepositories: 1,
                maxRepositories: 1000,
                minCommits: 1,
                maxCommits: 100000,
                minLanguages: 1,
                maxLanguages: 50,
                minConsistencyScore: 0,
                maxInconsistencyRatio: 0.5,
                minPrivacyScore: 50
            },
            complianceStandards: {
                gdpr: true,
                ccpa: true,
                iso27001: false,
                nist: false
            },
            customRules: [],
            ...config
        };

        this.ruleEngine = new ValidationRuleEngine(this.config);
    }

    /**
     * Validate aggregated data comprehensively
     */
    async validateAggregation(
        aggregation: CrossRepoAggregation,
        context: AggregationContext,
        privacyData?: PrivacyPreservingAggregation
    ): Promise<ValidationReport> {
        const validationId = this.generateValidationId();
        const startTime = Date.now();
        const auditTrail: ValidationOperation[] = [];

        const validationContext: ValidationContext = {
            userAddress: context.userAddress,
            aggregationType: 'cross_repo',
            dataSource: 'github',
            timestamp: new Date(),
            privacyLevel: context.config.privacyLevel,
            complianceRequirements: this.getComplianceRequirements()
        };

        try {
            // 1. Data Integrity Validation
            const dataIntegrity = await this.validateDataIntegrity(
                aggregation, context, auditTrail
            );

            // 2. Range Validation
            const rangeValidation = await this.validateRanges(
                aggregation, context, auditTrail
            );

            // 3. Consistency Checks
            const consistencyChecks = await this.validateConsistency(
                aggregation, context, auditTrail
            );

            // 4. Privacy Compliance
            const privacyCompliance = await this.validatePrivacyCompliance(
                aggregation, privacyData, context, auditTrail
            );

            // 5. Security Validation
            const securityValidation = await this.validateSecurity(
                aggregation, context, auditTrail
            );

            // 6. Business Logic Validation
            const businessLogic = await this.validateBusinessLogic(
                aggregation, context, auditTrail
            );

            // Compile results
            const results = {
                dataIntegrity,
                rangeValidation,
                consistencyChecks,
                privacyCompliance,
                securityValidation,
                businessLogic
            };

            // Calculate overall score and validity
            const overallScore = this.calculateOverallScore(results);
            const isValid = this.determineOverallValidity(results);

            // Extract errors and warnings
            const errors = auditTrail
                .filter(op => op.result === 'fail')
                .map(op => this.operationToError(op));

            const warnings = auditTrail
                .filter(op => op.result === 'warning')
                .map(op => this.operationToWarning(op));

            // Generate recommendations
            const recommendations = this.generateRecommendations(results, errors, warnings);

            const report: ValidationReport = {
                isValid,
                overallScore,
                validationId,
                timestamp: new Date(),
                context: validationContext,
                results,
                errors,
                warnings,
                recommendations,
                auditTrail
            };

            // Store validation history
            this.validationHistory.set(validationId, report);

            return report;

        } catch (error) {
            throw new Error(`Validation failed: ${error.message}`);
        }
    }

    /**
     * Validate data integrity and structure
     */
    private async validateDataIntegrity(
        aggregation: CrossRepoAggregation,
        context: AggregationContext,
        auditTrail: ValidationOperation[]
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        let checkCount = 0;
        let failureCount = 0;

        // Check required fields
        const requiredFields = [
            'userAddress',
            'repositoryCount',
            'aggregatedMetrics',
            'generatedAt'
        ];

        for (const field of requiredFields) {
            checkCount++;
            if (!this.hasProperty(aggregation, field)) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'required_field',
                    field,
                    originalValue: undefined,
                    validatedValue: undefined,
                    result: 'fail',
                    message: `Required field '${field}' is missing`,
                    timestamp: new Date()
                });
            }
        }

        // Validate data types
        const typeValidations = [
            { field: 'userAddress', type: 'string' },
            { field: 'repositoryCount', type: 'number' },
            { field: 'generatedAt', type: 'object' }
        ];

        for (const validation of typeValidations) {
            checkCount++;
            const value = this.getProperty(aggregation, validation.field);
            if (value !== undefined && typeof value !== validation.type) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'type_validation',
                    field: validation.field,
                    originalValue: value,
                    validatedValue: undefined,
                    result: 'fail',
                    message: `Field '${validation.field}' must be of type ${validation.type}`,
                    timestamp: new Date()
                });
            }
        }

        // Validate nested structures
        if (aggregation.aggregatedMetrics) {
            const nestedStructures = [
                'commits',
                'languages',
                'collaboration',
                'consistency',
                'diversity',
                'proficiency'
            ];

            for (const structure of nestedStructures) {
                checkCount++;
                if (!aggregation.aggregatedMetrics[structure]) {
                    failureCount++;
                    auditTrail.push({
                        operationId: this.generateOperationId(),
                        ruleName: 'nested_structure',
                        field: `aggregatedMetrics.${structure}`,
                        originalValue: undefined,
                        validatedValue: undefined,
                        result: 'fail',
                        message: `Missing aggregated metrics for '${structure}'`,
                        timestamp: new Date()
                    });
                }
            }
        }

        // Validate data freshness
        checkCount++;
        if (aggregation.generatedAt) {
            const ageInHours = (Date.now() - aggregation.generatedAt.getTime()) / (1000 * 60 * 60);
            if (ageInHours > 24) {
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'data_freshness',
                    field: 'generatedAt',
                    originalValue: aggregation.generatedAt,
                    validatedValue: new Date(),
                    result: 'warning',
                    message: `Data is ${Math.round(ageInHours)} hours old`,
                    timestamp: new Date()
                });
            }
        }

        const executionTime = Date.now() - startTime;
        const score = Math.max(0, 100 - (failureCount / checkCount) * 100);

        return {
            passed: failureCount === 0,
            score: Math.round(score),
            details: `Checked ${checkCount} integrity rules, ${failureCount} failures`,
            checkCount,
            failureCount,
            executionTime
        };
    }

    /**
     * Validate numerical ranges and bounds
     */
    private async validateRanges(
        aggregation: CrossRepoAggregation,
        context: AggregationContext,
        auditTrail: ValidationOperation[]
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        let checkCount = 0;
        let failureCount = 0;

        const rangeChecks = [
            {
                field: 'repositoryCount',
                min: this.config.thresholds.minRepositories,
                max: this.config.thresholds.maxRepositories
            },
            {
                field: 'aggregatedMetrics.commits.totalCommits',
                min: this.config.thresholds.minCommits,
                max: this.config.thresholds.maxCommits
            },
            {
                field: 'aggregatedMetrics.languages.languageCount',
                min: this.config.thresholds.minLanguages,
                max: this.config.thresholds.maxLanguages
            }
        ];

        for (const check of rangeChecks) {
            checkCount++;
            const value = this.getProperty(aggregation, check.field);
            
            if (typeof value === 'number') {
                if (value < check.min || value > check.max) {
                    failureCount++;
                    auditTrail.push({
                        operationId: this.generateOperationId(),
                        ruleName: 'range_validation',
                        field: check.field,
                        originalValue: value,
                        validatedValue: Math.max(check.min, Math.min(check.max, value)),
                        result: 'fail',
                        message: `Value ${value} is outside valid range [${check.min}, ${check.max}]`,
                        timestamp: new Date()
                    });
                }
            }
        }

        // Validate percentage fields (0-100)
        const percentageFields = [
            'aggregatedMetrics.consistency.overallConsistency',
            'aggregatedMetrics.diversity.projectDiversity',
            'aggregatedMetrics.proficiency.overallProficiency'
        ];

        for (const field of percentageFields) {
            checkCount++;
            const value = this.getProperty(aggregation, field);
            
            if (typeof value === 'number' && (value < 0 || value > 100)) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'percentage_validation',
                    field,
                    originalValue: value,
                    validatedValue: Math.max(0, Math.min(100, value)),
                    result: 'fail',
                    message: `Percentage value ${value} must be between 0 and 100`,
                    timestamp: new Date()
                });
            }
        }

        const executionTime = Date.now() - startTime;
        const score = Math.max(0, 100 - (failureCount / checkCount) * 100);

        return {
            passed: failureCount === 0,
            score: Math.round(score),
            details: `Checked ${checkCount} range validations, ${failureCount} failures`,
            checkCount,
            failureCount,
            executionTime
        };
    }

    /**
     * Validate internal consistency of aggregated data
     */
    private async validateConsistency(
        aggregation: CrossRepoAggregation,
        context: AggregationContext,
        auditTrail: ValidationOperation[]
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        let checkCount = 0;
        let failureCount = 0;

        // Check consistency between repository count and metrics
        checkCount++;
        const repoCount = aggregation.repositoryCount;
        const avgCommitsPerRepo = this.getProperty(aggregation, 'aggregatedMetrics.commits.averageCommitsPerRepo');
        
        if (typeof avgCommitsPerRepo === 'number' && repoCount > 0) {
            const totalCommits = this.getProperty(aggregation, 'aggregatedMetrics.commits.totalCommits');
            const expectedAverage = totalCommits / repoCount;
            const deviation = Math.abs(avgCommitsPerRepo - expectedAverage) / expectedAverage;
            
            if (deviation > this.config.thresholds.maxInconsistencyRatio) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'consistency_check',
                    field: 'aggregatedMetrics.commits.averageCommitsPerRepo',
                    originalValue: avgCommitsPerRepo,
                    validatedValue: expectedAverage,
                    result: 'fail',
                    message: `Average commits per repo (${avgCommitsPerRepo}) inconsistent with total/count ratio (${expectedAverage})`,
                    timestamp: new Date()
                });
            }
        }

        // Validate score consistency (all scores should be 0-100)
        const scoreFields = [
            'aggregatedMetrics.consistency.overallConsistency',
            'aggregatedMetrics.diversity.projectDiversity',
            'aggregatedMetrics.proficiency.overallProficiency',
            'aggregatedMetrics.collaboration.leadershipScore'
        ];

        for (const field of scoreFields) {
            checkCount++;
            const score = this.getProperty(aggregation, field);
            
            if (typeof score === 'number') {
                // Check if score is within reasonable bounds for its context
                if (field.includes('consistency') && score < this.config.thresholds.minConsistencyScore) {
                    auditTrail.push({
                        operationId: this.generateOperationId(),
                        ruleName: 'score_consistency',
                        field,
                        originalValue: score,
                        validatedValue: this.config.thresholds.minConsistencyScore,
                        result: 'warning',
                        message: `Consistency score ${score} is unusually low`,
                        timestamp: new Date()
                    });
                }
            }
        }

        // Validate temporal consistency
        checkCount++;
        const generatedAt = aggregation.generatedAt;
        if (generatedAt && generatedAt > new Date()) {
            failureCount++;
            auditTrail.push({
                operationId: this.generateOperationId(),
                ruleName: 'temporal_consistency',
                field: 'generatedAt',
                originalValue: generatedAt,
                validatedValue: new Date(),
                result: 'fail',
                message: 'Generated timestamp cannot be in the future',
                timestamp: new Date()
            });
        }

        const executionTime = Date.now() - startTime;
        const score = Math.max(0, 100 - (failureCount / checkCount) * 100);

        return {
            passed: failureCount === 0,
            score: Math.round(score),
            details: `Checked ${checkCount} consistency rules, ${failureCount} failures`,
            checkCount,
            failureCount,
            executionTime
        };
    }

    /**
     * Validate privacy compliance and protection measures
     */
    private async validatePrivacyCompliance(
        aggregation: CrossRepoAggregation,
        privacyData: PrivacyPreservingAggregation | undefined,
        context: AggregationContext,
        auditTrail: ValidationOperation[]
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        let checkCount = 0;
        let failureCount = 0;

        if (!this.config.enablePrivacyValidation) {
            return {
                passed: true,
                score: 100,
                details: 'Privacy validation disabled',
                checkCount: 0,
                failureCount: 0,
                executionTime: Date.now() - startTime
            };
        }

        // Check if privacy measures are applied
        checkCount++;
        if (!privacyData) {
            if (this.config.strictMode) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'privacy_required',
                    field: 'privacyData',
                    originalValue: undefined,
                    validatedValue: 'required',
                    result: 'fail',
                    message: 'Privacy preservation is required but not applied',
                    timestamp: new Date()
                });
            } else {
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'privacy_recommended',
                    field: 'privacyData',
                    originalValue: undefined,
                    validatedValue: 'recommended',
                    result: 'warning',
                    message: 'Privacy preservation is recommended',
                    timestamp: new Date()
                });
            }
        } else {
            // Validate privacy parameters
            checkCount++;
            const epsilon = privacyData.privacyParameters.epsilon;
            if (epsilon > 2.0) {
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'privacy_epsilon',
                    field: 'privacyParameters.epsilon',
                    originalValue: epsilon,
                    validatedValue: 1.0,
                    result: 'warning',
                    message: `Epsilon value ${epsilon} may provide insufficient privacy`,
                    timestamp: new Date()
                });
            }

            // Check anonymization level
            checkCount++;
            if (privacyData.anonymizationLevel < this.config.thresholds.minPrivacyScore) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'anonymization_level',
                    field: 'anonymizationLevel',
                    originalValue: privacyData.anonymizationLevel,
                    validatedValue: this.config.thresholds.minPrivacyScore,
                    result: 'fail',
                    message: `Anonymization level ${privacyData.anonymizationLevel} below minimum threshold`,
                    timestamp: new Date()
                });
            }
        }

        // Validate compliance requirements
        if (this.config.complianceStandards.gdpr) {
            checkCount++;
            const hasGDPRCompliance = this.validateGDPRCompliance(aggregation, privacyData);
            if (!hasGDPRCompliance) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'gdpr_compliance',
                    field: 'compliance',
                    originalValue: false,
                    validatedValue: true,
                    result: 'fail',
                    message: 'Data processing does not meet GDPR requirements',
                    timestamp: new Date()
                });
            }
        }

        const executionTime = Date.now() - startTime;
        const score = Math.max(0, 100 - (failureCount / checkCount) * 100);

        return {
            passed: failureCount === 0,
            score: Math.round(score),
            details: `Checked ${checkCount} privacy rules, ${failureCount} failures`,
            checkCount,
            failureCount,
            executionTime
        };
    }

    /**
     * Validate security aspects of aggregated data
     */
    private async validateSecurity(
        aggregation: CrossRepoAggregation,
        context: AggregationContext,
        auditTrail: ValidationOperation[]
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        let checkCount = 0;
        let failureCount = 0;

        // Validate user address format
        checkCount++;
        if (!this.isValidEthereumAddress(aggregation.userAddress)) {
            failureCount++;
            auditTrail.push({
                operationId: this.generateOperationId(),
                ruleName: 'address_format',
                field: 'userAddress',
                originalValue: aggregation.userAddress,
                validatedValue: 'valid_ethereum_address',
                result: 'fail',
                message: 'Invalid Ethereum address format',
                timestamp: new Date()
            });
        }

        // Check for credential hash integrity
        checkCount++;
        if (aggregation.credentialHashes && aggregation.credentialHashes.length > 0) {
            for (const hash of aggregation.credentialHashes) {
                if (!this.isValidHash(hash)) {
                    failureCount++;
                    auditTrail.push({
                        operationId: this.generateOperationId(),
                        ruleName: 'hash_integrity',
                        field: 'credentialHashes',
                        originalValue: hash,
                        validatedValue: 'valid_hash',
                        result: 'fail',
                        message: `Invalid credential hash format: ${hash}`,
                        timestamp: new Date()
                    });
                }
            }
        }

        // Validate data tampering protection
        checkCount++;
        const dataHash = this.calculateDataHash(aggregation);
        // In a real implementation, this would compare against a stored hash
        
        const executionTime = Date.now() - startTime;
        const score = Math.max(0, 100 - (failureCount / checkCount) * 100);

        return {
            passed: failureCount === 0,
            score: Math.round(score),
            details: `Checked ${checkCount} security rules, ${failureCount} failures`,
            checkCount,
            failureCount,
            executionTime
        };
    }

    /**
     * Validate business logic and domain-specific rules
     */
    private async validateBusinessLogic(
        aggregation: CrossRepoAggregation,
        context: AggregationContext,
        auditTrail: ValidationOperation[]
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        let checkCount = 0;
        let failureCount = 0;

        // Validate repository count vs. metrics consistency
        checkCount++;
        if (aggregation.repositoryCount === 0) {
            const hasMetrics = Object.values(aggregation.aggregatedMetrics || {}).some(
                metric => metric && Object.values(metric).some(value => value > 0)
            );
            
            if (hasMetrics) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'business_logic',
                    field: 'repositoryCount',
                    originalValue: 0,
                    validatedValue: 1,
                    result: 'fail',
                    message: 'Cannot have metrics without repositories',
                    timestamp: new Date()
                });
            }
        }

        // Validate language proficiency logic
        checkCount++;
        const languageCount = this.getProperty(aggregation, 'aggregatedMetrics.languages.languageCount');
        const proficiencyScore = this.getProperty(aggregation, 'aggregatedMetrics.proficiency.overallProficiency');
        
        if (typeof languageCount === 'number' && typeof proficiencyScore === 'number') {
            if (languageCount === 0 && proficiencyScore > 0) {
                failureCount++;
                auditTrail.push({
                    operationId: this.generateOperationId(),
                    ruleName: 'proficiency_logic',
                    field: 'aggregatedMetrics.proficiency.overallProficiency',
                    originalValue: proficiencyScore,
                    validatedValue: 0,
                    result: 'fail',
                    message: 'Cannot have proficiency score without languages',
                    timestamp: new Date()
                });
            }
        }

        // Apply custom business rules
        for (const rule of this.config.customRules) {
            if (rule.enabled && rule.type === 'custom') {
                checkCount++;
                const isValid = await this.ruleEngine.executeCustomRule(rule, aggregation);
                if (!isValid) {
                    if (rule.severity === 'critical' || rule.severity === 'high') {
                        failureCount++;
                    }
                    auditTrail.push({
                        operationId: this.generateOperationId(),
                        ruleName: rule.id,
                        field: rule.field,
                        originalValue: this.getProperty(aggregation, rule.field),
                        validatedValue: undefined,
                        result: rule.severity === 'critical' || rule.severity === 'high' ? 'fail' : 'warning',
                        message: rule.errorMessage,
                        timestamp: new Date()
                    });
                }
            }
        }

        const executionTime = Date.now() - startTime;
        const score = Math.max(0, 100 - (failureCount / checkCount) * 100);

        return {
            passed: failureCount === 0,
            score: Math.round(score),
            details: `Checked ${checkCount} business rules, ${failureCount} failures`,
            checkCount,
            failureCount,
            executionTime
        };
    }

    /**
     * Helper methods for validation
     */
    private calculateOverallScore(results: any): number {
        const scores = Object.values(results).map((result: any) => result.score);
        return Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length);
    }

    private determineOverallValidity(results: any): boolean {
        return Object.values(results).every((result: any) => result.passed);
    }

    private operationToError(operation: ValidationOperation): ValidationError {
        return {
            code: operation.ruleName,
            message: operation.message,
            field: operation.field,
            severity: 'high',
            suggestedFix: `Update ${operation.field} to ${operation.validatedValue}`
        };
    }

    private operationToWarning(operation: ValidationOperation): ValidationWarning {
        return {
            code: operation.ruleName,
            message: operation.message,
            field: operation.field,
            impact: 'moderate',
            recommendation: `Consider updating ${operation.field}`
        };
    }

    private generateRecommendations(
        results: any,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): string[] {
        const recommendations: string[] = [];

        if (errors.length > 0) {
            recommendations.push('Address critical validation errors before proceeding');
        }

        if (warnings.length > 5) {
            recommendations.push('Consider reviewing data quality processes');
        }

        if (results.privacyCompliance.score < 80) {
            recommendations.push('Enhance privacy protection measures');
        }

        if (results.consistencyChecks.score < 90) {
            recommendations.push('Review data aggregation logic for consistency');
        }

        return recommendations;
    }

    private validateGDPRCompliance(
        aggregation: CrossRepoAggregation,
        privacyData?: PrivacyPreservingAggregation
    ): boolean {
        // Simplified GDPR compliance check
        return privacyData !== undefined && privacyData.anonymizationLevel >= 70;
    }

    private isValidEthereumAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    private isValidHash(hash: string): boolean {
        return /^[a-fA-F0-9]{64}$/.test(hash);
    }

    private calculateDataHash(data: any): string {
        return createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    private hasProperty(obj: any, path: string): boolean {
        return this.getProperty(obj, path) !== undefined;
    }

    private getProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private getComplianceRequirements(): string[] {
        const requirements: string[] = [];
        
        if (this.config.complianceStandards.gdpr) requirements.push('GDPR');
        if (this.config.complianceStandards.ccpa) requirements.push('CCPA');
        if (this.config.complianceStandards.iso27001) requirements.push('ISO27001');
        if (this.config.complianceStandards.nist) requirements.push('NIST');
        
        return requirements;
    }

    private generateValidationId(): string {
        return `validation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    private generateOperationId(): string {
        return `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }

    /**
     * Public API methods
     */
    public getValidationHistory(): ValidationReport[] {
        return Array.from(this.validationHistory.values());
    }

    public getValidationReport(validationId: string): ValidationReport | undefined {
        return this.validationHistory.get(validationId);
    }

    public addCustomRule(rule: ValidationRule): void {
        this.config.customRules.push(rule);
    }

    public removeCustomRule(ruleId: string): boolean {
        const index = this.config.customRules.findIndex(rule => rule.id === ruleId);
        if (index >= 0) {
            this.config.customRules.splice(index, 1);
            return true;
        }
        return false;
    }

    public updateThresholds(thresholds: Partial<ValidationConfig['thresholds']>): void {
        this.config.thresholds = { ...this.config.thresholds, ...thresholds };
    }
}

/**
 * Validation Rule Engine for executing custom rules
 */
class ValidationRuleEngine {
    constructor(private config: ValidationConfig) {}

    async executeCustomRule(rule: ValidationRule, data: any): Promise<boolean> {
        try {
            switch (rule.type) {
                case 'range':
                    return this.executeRangeRule(rule, data);
                case 'pattern':
                    return this.executePatternRule(rule, data);
                case 'dependency':
                    return this.executeDependencyRule(rule, data);
                case 'consistency':
                    return this.executeConsistencyRule(rule, data);
                case 'custom':
                    return this.executeCustomLogic(rule, data);
                default:
                    return true;
            }
        } catch (error) {
            console.warn(`Error executing rule ${rule.id}:`, error);
            return false;
        }
    }

    private executeRangeRule(rule: ValidationRule, data: any): boolean {
        const value = this.getNestedValue(data, rule.field);
        const { min, max } = rule.constraint;
        return typeof value === 'number' && value >= min && value <= max;
    }

    private executePatternRule(rule: ValidationRule, data: any): boolean {
        const value = this.getNestedValue(data, rule.field);
        const pattern = new RegExp(rule.constraint.pattern);
        return typeof value === 'string' && pattern.test(value);
    }

    private executeDependencyRule(rule: ValidationRule, data: any): boolean {
        const value = this.getNestedValue(data, rule.field);
        const dependentField = rule.constraint.dependentField;
        const dependentValue = this.getNestedValue(data, dependentField);
        
        // Simple dependency logic
        if (rule.constraint.condition === 'required_if') {
            return dependentValue ? value !== undefined : true;
        }
        
        return true;
    }

    private executeConsistencyRule(rule: ValidationRule, data: any): boolean {
        const value1 = this.getNestedValue(data, rule.field);
        const value2 = this.getNestedValue(data, rule.constraint.compareField);
        
        switch (rule.constraint.operator) {
            case 'equal':
                return value1 === value2;
            case 'greater':
                return value1 > value2;
            case 'less':
                return value1 < value2;
            default:
                return true;
        }
    }

    private executeCustomLogic(rule: ValidationRule, data: any): boolean {
        // This would execute custom JavaScript logic
        // For security, this should be sandboxed in production
        try {
            const func = new Function('data', rule.constraint.logic);
            return func(data);
        } catch (error) {
            return false;
        }
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
} 