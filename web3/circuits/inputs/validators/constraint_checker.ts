/**
 * Constraint Checker
 * 
 * Validates mathematical constraints and circuit requirements for ZK proofs.
 * Ensures inputs satisfy all necessary conditions for successful proof generation.
 */

export interface ConstraintConfig {
    maxFieldSize: bigint;
    minCommitments: number;
    maxCommitments: number;
    rangeProofBits: number;
    merkleTreeDepth: number;
    privacyThresholds: PrivacyThresholds;
}

export interface PrivacyThresholds {
    minEpsilon: number;
    maxEpsilon: number;
    minKValue: number;
    maxKValue: number;
    minGroupSize: number;
}

export interface ConstraintResult {
    isValid: boolean;
    violations: ConstraintViolation[];
    warnings: ConstraintWarning[];
    recommendations: string[];
}

export interface ConstraintViolation {
    constraint: string;
    description: string;
    severity: 'critical' | 'high' | 'medium';
    actualValue: any;
    expectedValue: any;
    field: string;
}

export interface ConstraintWarning {
    constraint: string;
    description: string;
    actualValue: any;
    recommendedValue: any;
    field: string;
}

export class ConstraintChecker {
    private config: ConstraintConfig;

    constructor(config: ConstraintConfig) {
        this.config = config;
    }

    /**
     * Check all constraints for circuit inputs
     */
    async checkAllConstraints(circuitInputs: any): Promise<ConstraintResult> {
        const violations: ConstraintViolation[] = [];
        const warnings: ConstraintWarning[] = [];
        const recommendations: string[] = [];

        try {
            // Check field size constraints
            this.checkFieldSizeConstraints(circuitInputs, violations);
            
            // Check range proof constraints
            this.checkRangeProofConstraints(circuitInputs, violations, warnings);
            
            // Check Merkle tree constraints
            this.checkMerkleTreeConstraints(circuitInputs, violations);
            
            // Check privacy constraints
            this.checkPrivacyConstraints(circuitInputs, violations, warnings);
            
            // Check commitment constraints
            this.checkCommitmentConstraints(circuitInputs, violations, warnings);
            
            // Check array length constraints
            this.checkArrayConstraints(circuitInputs, violations);
            
            // Check mathematical relationships
            this.checkMathematicalRelationships(circuitInputs, violations, warnings);
            
            // Generate recommendations
            this.generateRecommendations(violations, warnings, recommendations);

            return {
                isValid: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
                violations,
                warnings,
                recommendations
            };

        } catch (error) {
            violations.push({
                constraint: 'CONSTRAINT_CHECK_ERROR',
                description: `Constraint checking failed: ${error.message}`,
                severity: 'critical',
                actualValue: error.message,
                expectedValue: 'successful validation',
                field: 'general'
            });

            return {
                isValid: false,
                violations,
                warnings,
                recommendations: ['Fix constraint checking errors before proceeding']
            };
        }
    }

    /**
     * Check field size constraints for circuit compatibility
     */
    private checkFieldSizeConstraints(inputs: any, violations: ConstraintViolation[]) {
        const checkFieldValue = (value: any, fieldName: string) => {
            if (typeof value === 'number') {
                if (value < 0) {
                    violations.push({
                        constraint: 'NEGATIVE_FIELD_VALUE',
                        description: 'Field values must be non-negative',
                        severity: 'critical',
                        actualValue: value,
                        expectedValue: '≥ 0',
                        field: fieldName
                    });
                }

                const bigIntValue = BigInt(Math.floor(Math.abs(value)));
                if (bigIntValue >= this.config.maxFieldSize) {
                    violations.push({
                        constraint: 'FIELD_SIZE_OVERFLOW',
                        description: 'Value exceeds maximum field size',
                        severity: 'critical',
                        actualValue: bigIntValue.toString(),
                        expectedValue: `< ${this.config.maxFieldSize.toString()}`,
                        field: fieldName
                    });
                }
            }
        };

        // Check all numeric fields recursively
        this.traverseObject(inputs, '', checkFieldValue);
    }

    /**
     * Check range proof constraints
     */
    private checkRangeProofConstraints(inputs: any, violations: ConstraintViolation[], warnings: ConstraintWarning[]) {
        const maxRangeValue = (1 << this.config.rangeProofBits) - 1;

        // Check repository credential ranges
        if (inputs.repositoryCredential) {
            const repo = inputs.repositoryCredential;
            
            if (repo.commitCountRange) {
                if (repo.commitCountRange.min < 0 || repo.commitCountRange.max < 0) {
                    violations.push({
                        constraint: 'NEGATIVE_RANGE_VALUE',
                        description: 'Range values must be non-negative',
                        severity: 'high',
                        actualValue: `min: ${repo.commitCountRange.min}, max: ${repo.commitCountRange.max}`,
                        expectedValue: '≥ 0',
                        field: 'repositoryCredential.commitCountRange'
                    });
                }

                if (repo.commitCountRange.max > maxRangeValue) {
                    violations.push({
                        constraint: 'RANGE_PROOF_OVERFLOW',
                        description: 'Range value exceeds range proof capacity',
                        severity: 'critical',
                        actualValue: repo.commitCountRange.max,
                        expectedValue: `≤ ${maxRangeValue}`,
                        field: 'repositoryCredential.commitCountRange.max'
                    });
                }

                if (repo.commitCountRange.min >= repo.commitCountRange.max) {
                    violations.push({
                        constraint: 'INVALID_RANGE',
                        description: 'Range minimum must be less than maximum',
                        severity: 'high',
                        actualValue: `min: ${repo.commitCountRange.min}, max: ${repo.commitCountRange.max}`,
                        expectedValue: 'min < max',
                        field: 'repositoryCredential.commitCountRange'
                    });
                }
            }

            if (repo.locRange) {
                if (repo.locRange.max > maxRangeValue) {
                    violations.push({
                        constraint: 'LOC_RANGE_OVERFLOW',
                        description: 'Lines of code range exceeds range proof capacity',
                        severity: 'critical',
                        actualValue: repo.locRange.max,
                        expectedValue: `≤ ${maxRangeValue}`,
                        field: 'repositoryCredential.locRange.max'
                    });
                }
            }
        }

        // Check language proficiency scores
        if (inputs.languageCredential && inputs.languageCredential.proficiencyScores) {
            inputs.languageCredential.proficiencyScores.forEach((score: number, index: number) => {
                if (score < 0 || score > 100) {
                    violations.push({
                        constraint: 'INVALID_PROFICIENCY_SCORE',
                        description: 'Proficiency scores must be between 0 and 100',
                        severity: 'high',
                        actualValue: score,
                        expectedValue: '0 ≤ score ≤ 100',
                        field: `languageCredential.proficiencyScores[${index}]`
                    });
                }
            });
        }
    }

    /**
     * Check Merkle tree constraints
     */
    private checkMerkleTreeConstraints(inputs: any, violations: ConstraintViolation[]) {
        const maxLeaves = 1 << this.config.merkleTreeDepth;

        // Check repository commitments
        if (inputs.repositoryCredential && inputs.repositoryCredential.merkleProof) {
            const proof = inputs.repositoryCredential.merkleProof;
            
            if (proof.pathElements && proof.pathElements.length !== this.config.merkleTreeDepth) {
                violations.push({
                    constraint: 'INVALID_MERKLE_DEPTH',
                    description: 'Merkle proof depth does not match expected depth',
                    severity: 'critical',
                    actualValue: proof.pathElements.length,
                    expectedValue: this.config.merkleTreeDepth,
                    field: 'repositoryCredential.merkleProof.pathElements'
                });
            }

            if (proof.pathIndices && proof.pathIndices.length !== this.config.merkleTreeDepth) {
                violations.push({
                    constraint: 'INVALID_MERKLE_INDICES',
                    description: 'Merkle proof indices length does not match depth',
                    severity: 'critical',
                    actualValue: proof.pathIndices.length,
                    expectedValue: this.config.merkleTreeDepth,
                    field: 'repositoryCredential.merkleProof.pathIndices'
                });
            }

            // Check leaf index is within bounds
            if (proof.leafIndex !== undefined && proof.leafIndex >= maxLeaves) {
                violations.push({
                    constraint: 'MERKLE_LEAF_INDEX_OVERFLOW',
                    description: 'Merkle tree leaf index exceeds maximum capacity',
                    severity: 'critical',
                    actualValue: proof.leafIndex,
                    expectedValue: `< ${maxLeaves}`,
                    field: 'repositoryCredential.merkleProof.leafIndex'
                });
            }
        }

        // Check zero knowledge set proofs
        if (inputs.privacyParameters && inputs.privacyParameters.zkSetProof) {
            const zkProof = inputs.privacyParameters.zkSetProof;
            
            if (zkProof.merkleProofs) {
                zkProof.merkleProofs.forEach((proof: any, index: number) => {
                    if (proof.pathElements && proof.pathElements.length > this.config.merkleTreeDepth) {
                        violations.push({
                            constraint: 'ZK_SET_MERKLE_DEPTH_OVERFLOW',
                            description: 'ZK set Merkle proof depth exceeds maximum',
                            severity: 'high',
                            actualValue: proof.pathElements.length,
                            expectedValue: `≤ ${this.config.merkleTreeDepth}`,
                            field: `privacyParameters.zkSetProof.merkleProofs[${index}].pathElements`
                        });
                    }
                });
            }
        }
    }

    /**
     * Check privacy constraints
     */
    private checkPrivacyConstraints(inputs: any, violations: ConstraintViolation[], warnings: ConstraintWarning[]) {
        if (inputs.privacyParameters) {
            const privacy = inputs.privacyParameters;

            // Check differential privacy epsilon
            if (privacy.epsilon !== undefined) {
                if (privacy.epsilon <= 0) {
                    violations.push({
                        constraint: 'INVALID_EPSILON',
                        description: 'Differential privacy epsilon must be positive',
                        severity: 'high',
                        actualValue: privacy.epsilon,
                        expectedValue: '> 0',
                        field: 'privacyParameters.epsilon'
                    });
                }

                if (privacy.epsilon < this.config.privacyThresholds.minEpsilon) {
                    warnings.push({
                        constraint: 'LOW_EPSILON_WARNING',
                        description: 'Epsilon value may provide excessive privacy at cost of utility',
                        actualValue: privacy.epsilon,
                        recommendedValue: `≥ ${this.config.privacyThresholds.minEpsilon}`,
                        field: 'privacyParameters.epsilon'
                    });
                }

                if (privacy.epsilon > this.config.privacyThresholds.maxEpsilon) {
                    warnings.push({
                        constraint: 'HIGH_EPSILON_WARNING',
                        description: 'Epsilon value may provide insufficient privacy protection',
                        actualValue: privacy.epsilon,
                        recommendedValue: `≤ ${this.config.privacyThresholds.maxEpsilon}`,
                        field: 'privacyParameters.epsilon'
                    });
                }
            }

            // Check k-anonymity parameter
            if (privacy.k !== undefined) {
                if (privacy.k < 2 || !Number.isInteger(privacy.k)) {
                    violations.push({
                        constraint: 'INVALID_K_ANONYMITY',
                        description: 'K-anonymity parameter must be an integer ≥ 2',
                        severity: 'high',
                        actualValue: privacy.k,
                        expectedValue: 'integer ≥ 2',
                        field: 'privacyParameters.k'
                    });
                }

                if (privacy.k < this.config.privacyThresholds.minKValue) {
                    warnings.push({
                        constraint: 'LOW_K_VALUE_WARNING',
                        description: 'K value may provide insufficient anonymity',
                        actualValue: privacy.k,
                        recommendedValue: `≥ ${this.config.privacyThresholds.minKValue}`,
                        field: 'privacyParameters.k'
                    });
                }

                if (privacy.k > this.config.privacyThresholds.maxKValue) {
                    warnings.push({
                        constraint: 'HIGH_K_VALUE_WARNING',
                        description: 'K value may be unnecessarily restrictive',
                        actualValue: privacy.k,
                        recommendedValue: `≤ ${this.config.privacyThresholds.maxKValue}`,
                        field: 'privacyParameters.k'
                    });
                }
            }

            // Check group size for k-anonymity
            if (privacy.groupSize !== undefined) {
                if (privacy.groupSize < this.config.privacyThresholds.minGroupSize) {
                    violations.push({
                        constraint: 'INSUFFICIENT_GROUP_SIZE',
                        description: 'Group size insufficient for privacy requirements',
                        severity: 'high',
                        actualValue: privacy.groupSize,
                        expectedValue: `≥ ${this.config.privacyThresholds.minGroupSize}`,
                        field: 'privacyParameters.groupSize'
                    });
                }

                if (privacy.k && privacy.groupSize < privacy.k) {
                    violations.push({
                        constraint: 'GROUP_SIZE_LESS_THAN_K',
                        description: 'Group size must be at least k for k-anonymity',
                        severity: 'critical',
                        actualValue: privacy.groupSize,
                        expectedValue: `≥ ${privacy.k}`,
                        field: 'privacyParameters.groupSize'
                    });
                }
            }
        }
    }

    /**
     * Check commitment constraints
     */
    private checkCommitmentConstraints(inputs: any, violations: ConstraintViolation[], warnings: ConstraintWarning[]) {
        let commitmentCount = 0;

        // Count commitments across all credentials
        if (inputs.repositoryCredential && inputs.repositoryCredential.repoCommitment) {
            commitmentCount++;
        }

        if (inputs.languageCredential && inputs.languageCredential.languageCommitments) {
            commitmentCount += inputs.languageCredential.languageCommitments.length;
        }

        if (inputs.collaborationCredential && inputs.collaborationCredential.collaboratorCommitments) {
            commitmentCount += inputs.collaborationCredential.collaboratorCommitments.length;
        }

        // Check minimum commitments
        if (commitmentCount < this.config.minCommitments) {
            violations.push({
                constraint: 'INSUFFICIENT_COMMITMENTS',
                description: 'Insufficient number of commitments for proof generation',
                severity: 'critical',
                actualValue: commitmentCount,
                expectedValue: `≥ ${this.config.minCommitments}`,
                field: 'commitments'
            });
        }

        // Check maximum commitments
        if (commitmentCount > this.config.maxCommitments) {
            violations.push({
                constraint: 'EXCESSIVE_COMMITMENTS',
                description: 'Too many commitments may cause performance issues',
                severity: 'medium',
                actualValue: commitmentCount,
                expectedValue: `≤ ${this.config.maxCommitments}`,
                field: 'commitments'
            });
        }

        // Validate commitment format
        this.validateCommitmentFormats(inputs, violations);
    }

    /**
     * Check array length constraints
     */
    private checkArrayConstraints(inputs: any, violations: ConstraintViolation[]) {
        // Check language arrays consistency
        if (inputs.languageCredential) {
            const lang = inputs.languageCredential;
            
            if (lang.languageHashes && lang.proficiencyScores) {
                if (lang.languageHashes.length !== lang.proficiencyScores.length) {
                    violations.push({
                        constraint: 'INCONSISTENT_LANGUAGE_ARRAYS',
                        description: 'Language arrays must have equal lengths',
                        severity: 'critical',
                        actualValue: `hashes: ${lang.languageHashes.length}, scores: ${lang.proficiencyScores.length}`,
                        expectedValue: 'equal lengths',
                        field: 'languageCredential'
                    });
                }
            }

            if (lang.languageCount !== undefined && lang.languageHashes) {
                if (lang.languageCount !== lang.languageHashes.length) {
                    violations.push({
                        constraint: 'LANGUAGE_COUNT_MISMATCH',
                        description: 'Language count does not match array length',
                        severity: 'high',
                        actualValue: `count: ${lang.languageCount}, array: ${lang.languageHashes.length}`,
                        expectedValue: 'matching values',
                        field: 'languageCredential.languageCount'
                    });
                }
            }
        }

        // Check collaboration arrays consistency
        if (inputs.collaborationCredential) {
            const collab = inputs.collaborationCredential;
            
            if (collab.collaboratorHashes && collab.contributionPercentages) {
                if (collab.collaboratorHashes.length !== collab.contributionPercentages.length) {
                    violations.push({
                        constraint: 'INCONSISTENT_COLLABORATION_ARRAYS',
                        description: 'Collaboration arrays must have equal lengths',
                        severity: 'critical',
                        actualValue: `hashes: ${collab.collaboratorHashes.length}, percentages: ${collab.contributionPercentages.length}`,
                        expectedValue: 'equal lengths',
                        field: 'collaborationCredential'
                    });
                }
            }
        }
    }

    /**
     * Check mathematical relationships between values
     */
    private checkMathematicalRelationships(inputs: any, violations: ConstraintViolation[], warnings: ConstraintWarning[]) {
        // Check contribution percentages sum to reasonable total
        if (inputs.collaborationCredential && inputs.collaborationCredential.contributionPercentages) {
            const percentages = inputs.collaborationCredential.contributionPercentages;
            const sum = percentages.reduce((total: number, pct: number) => total + pct, 0);
            
            if (Math.abs(sum - 100) > 5) { // Allow 5% tolerance
                warnings.push({
                    constraint: 'CONTRIBUTION_PERCENTAGE_SUM',
                    description: 'Contribution percentages should sum to approximately 100%',
                    actualValue: sum,
                    recommendedValue: '100',
                    field: 'collaborationCredential.contributionPercentages'
                });
            }
        }

        // Check consistency between repository age and activity
        if (inputs.consistencyCredential) {
            const consistency = inputs.consistencyCredential;
            
            if (consistency.repositoryAge !== undefined && consistency.activityDays !== undefined) {
                if (consistency.activityDays > consistency.repositoryAge) {
                    violations.push({
                        constraint: 'ACTIVITY_EXCEEDS_AGE',
                        description: 'Active days cannot exceed repository age',
                        severity: 'high',
                        actualValue: `activity: ${consistency.activityDays}, age: ${consistency.repositoryAge}`,
                        expectedValue: 'activity ≤ age',
                        field: 'consistencyCredential'
                    });
                }
            }
        }

        // Check range relationships
        if (inputs.repositoryCredential) {
            const repo = inputs.repositoryCredential;
            
            if (repo.commitCountRange && repo.locRange) {
                // Very rough heuristic: more commits usually mean more LOC
                const avgLocPerCommit = repo.locRange.max / Math.max(1, repo.commitCountRange.max);
                
                if (avgLocPerCommit > 10000) { // More than 10k LOC per commit seems unusual
                    warnings.push({
                        constraint: 'HIGH_LOC_PER_COMMIT',
                        description: 'Average lines of code per commit seems unusually high',
                        actualValue: Math.round(avgLocPerCommit),
                        recommendedValue: '< 10000',
                        field: 'repositoryCredential'
                    });
                }
            }
        }
    }

    /**
     * Validate commitment formats
     */
    private validateCommitmentFormats(inputs: any, violations: ConstraintViolation[]) {
        const validateCommitment = (commitment: any, fieldName: string) => {
            if (typeof commitment === 'string') {
                // Check if it's a valid hex string
                if (!/^[0-9a-fA-F]+$/.test(commitment)) {
                    violations.push({
                        constraint: 'INVALID_COMMITMENT_FORMAT',
                        description: 'Commitment must be a valid hexadecimal string',
                        severity: 'high',
                        actualValue: commitment,
                        expectedValue: 'hexadecimal string',
                        field: fieldName
                    });
                }
                
                // Check length (assuming 32-byte commitments)
                if (commitment.length !== 64) {
                    violations.push({
                        constraint: 'INVALID_COMMITMENT_LENGTH',
                        description: 'Commitment must be 64 characters (32 bytes)',
                        severity: 'high',
                        actualValue: commitment.length,
                        expectedValue: '64',
                        field: fieldName
                    });
                }
            }
        };

        // Check repository commitment
        if (inputs.repositoryCredential && inputs.repositoryCredential.repoCommitment) {
            validateCommitment(inputs.repositoryCredential.repoCommitment, 'repositoryCredential.repoCommitment');
        }

        // Check language commitments
        if (inputs.languageCredential && inputs.languageCredential.languageCommitments) {
            inputs.languageCredential.languageCommitments.forEach((commitment: any, index: number) => {
                validateCommitment(commitment, `languageCredential.languageCommitments[${index}]`);
            });
        }

        // Check collaborator commitments
        if (inputs.collaborationCredential && inputs.collaborationCredential.collaboratorCommitments) {
            inputs.collaborationCredential.collaboratorCommitments.forEach((commitment: any, index: number) => {
                validateCommitment(commitment, `collaborationCredential.collaboratorCommitments[${index}]`);
            });
        }
    }

    /**
     * Generate recommendations based on violations and warnings
     */
    private generateRecommendations(
        violations: ConstraintViolation[], 
        warnings: ConstraintWarning[], 
        recommendations: string[]
    ) {
        // Critical violations
        const criticalViolations = violations.filter(v => v.severity === 'critical');
        if (criticalViolations.length > 0) {
            recommendations.push('Fix all critical constraint violations before proceeding with proof generation');
        }

        // High severity violations
        const highViolations = violations.filter(v => v.severity === 'high');
        if (highViolations.length > 0) {
            recommendations.push('Address high-severity constraint violations to ensure proof validity');
        }

        // Privacy warnings
        const privacyWarnings = warnings.filter(w => w.field.includes('privacy'));
        if (privacyWarnings.length > 0) {
            recommendations.push('Review privacy parameters to balance security and utility');
        }

        // Performance warnings
        if (warnings.some(w => w.constraint.includes('EXCESSIVE'))) {
            recommendations.push('Consider reducing input size for better performance');
        }

        // Mathematical relationship warnings
        if (warnings.some(w => w.constraint.includes('SUM') || w.constraint.includes('RELATIONSHIP'))) {
            recommendations.push('Verify mathematical relationships between input values');
        }

        // General recommendations
        if (violations.length === 0 && warnings.length === 0) {
            recommendations.push('All constraints satisfied - inputs are ready for circuit processing');
        } else if (violations.filter(v => v.severity !== 'medium').length === 0) {
            recommendations.push('Minor constraint issues detected - consider addressing warnings for optimal results');
        }
    }

    /**
     * Recursively traverse object to apply function to all values
     */
    private traverseObject(obj: any, path: string, fn: (value: any, path: string) => void) {
        if (obj === null || obj === undefined) return;

        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    this.traverseObject(item, `${path}[${index}]`, fn);
                });
            } else {
                Object.keys(obj).forEach(key => {
                    const newPath = path ? `${path}.${key}` : key;
                    this.traverseObject(obj[key], newPath, fn);
                });
            }
        } else {
            fn(obj, path);
        }
    }
}

export default ConstraintChecker;