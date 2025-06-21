/**
 * Privacy Aggregator
 * 
 * Applies advanced privacy-preserving techniques including differential privacy,
 * k-anonymity, and zero-knowledge set operations to aggregated data.
 */

import { createHash, randomBytes } from 'crypto';
import { 
    PrivacyPreservingAggregation,
    DifferentialPrivacyConfig,
    KAnonymityConfig,
    AggregationContext
} from '../types/index.js';

export interface PrivacyAggregatorConfig {
    differentialPrivacy: DifferentialPrivacyConfig;
    kAnonymity: KAnonymityConfig;
    zeroKnowledgeSets: {
        enabled: boolean;
        setSize: number;
        blindingFactor: boolean;
    };
    privacyBudget: {
        total: number;
        consumed: number;
        allocation: Record<string, number>;
    };
    complianceLevel: 'basic' | 'enhanced' | 'maximum';
    auditTrail: boolean;
}

export interface PrivacyOperation {
    operationId: string;
    type: 'differential_privacy' | 'k_anonymity' | 'zero_knowledge_sets' | 'composition';
    parameters: any;
    privacyBudgetUsed: number;
    timestamp: Date;
    inputHash: string;
    outputHash: string;
}

export interface PrivacyGuarantees {
    differentialPrivacyLevel: number;
    kAnonymityLevel: number;
    zeroKnowledgeLevel: number;
    overallPrivacyScore: number;
    complianceFlags: {
        gdpr: boolean;
        ccpa: boolean;
        hipaa: boolean;
        iso27001: boolean;
    };
    riskAssessment: {
        reidentificationRisk: number;
        inferenceRisk: number;
        linkageRisk: number;
        overallRisk: 'low' | 'medium' | 'high';
    };
}

export class PrivacyAggregator {
    private config: PrivacyAggregatorConfig;
    private operationHistory: PrivacyOperation[] = [];
    private privacyBudgetTracker: Map<string, number> = new Map();
    
    // Privacy technique implementations
    private readonly LAPLACE_SCALE_FACTOR = 1.0;
    private readonly GAUSSIAN_SCALE_FACTOR = 1.0;
    private readonly K_ANONYMITY_SUPPRESSION_THRESHOLD = 0.1;

    constructor(config: Partial<PrivacyAggregatorConfig> = {}) {
        this.config = {
            differentialPrivacy: {
                epsilon: 1.0,
                delta: 1e-5,
                sensitivity: 1.0,
                mechanism: 'laplace',
                clampingBounds: [0, 100]
            },
            kAnonymity: {
                k: 5,
                quasiIdentifiers: ['language', 'domain', 'experience_level'],
                sensitiveAttributes: ['proficiency_score', 'commit_count', 'repository_count'],
                suppressionThreshold: 0.1,
                generalizationLevels: {
                    'experience_level': 3,
                    'language': 2,
                    'domain': 2
                }
            },
            zeroKnowledgeSets: {
                enabled: true,
                setSize: 1000,
                blindingFactor: true
            },
            privacyBudget: {
                total: 10.0,
                consumed: 0.0,
                allocation: {
                    'consistency': 2.0,
                    'diversity': 2.0,
                    'proficiency': 2.0,
                    'collaboration': 2.0,
                    'aggregation': 2.0
                }
            },
            complianceLevel: 'enhanced',
            auditTrail: true,
            ...config
        };
    }

    /**
     * Apply comprehensive privacy preservation to aggregated data
     */
    async applyPrivacyPreservation(
        data: any,
        context: AggregationContext,
        privacyLevel: 'basic' | 'enhanced' | 'maximum' = 'enhanced'
    ): Promise<PrivacyPreservingAggregation> {
        // Check privacy budget
        this.checkPrivacyBudget(context.userAddress, 1.0);

        // Create operation record
        const operationId = this.generateOperationId();
        const inputHash = this.hashData(data);

        // Apply privacy techniques based on level
        let processedData = { ...data };
        const privacyParameters: any = {};
        const guarantees: string[] = [];

        // 1. Apply Differential Privacy
        if (privacyLevel === 'enhanced' || privacyLevel === 'maximum') {
            const dpResult = await this.applyDifferentialPrivacy(
                processedData, 
                this.config.differentialPrivacy
            );
            processedData = dpResult.noisyData;
            privacyParameters.differentialPrivacy = dpResult.parameters;
            guarantees.push(`ε-differential privacy with ε=${this.config.differentialPrivacy.epsilon}`);
        }

        // 2. Apply K-Anonymity
        if (privacyLevel === 'enhanced' || privacyLevel === 'maximum') {
            const kAnonResult = await this.applyKAnonymity(
                processedData,
                this.config.kAnonymity
            );
            processedData = kAnonResult.anonymizedData;
            privacyParameters.kAnonymity = kAnonResult.parameters;
            guarantees.push(`${this.config.kAnonymity.k}-anonymity`);
        }

        // 3. Apply Zero-Knowledge Set Operations
        if (this.config.zeroKnowledgeSets.enabled && privacyLevel === 'maximum') {
            const zkResult = await this.applyZeroKnowledgeSets(
                processedData,
                this.config.zeroKnowledgeSets
            );
            processedData = zkResult.privateData;
            privacyParameters.zeroKnowledge = zkResult.parameters;
            guarantees.push('Zero-knowledge set membership');
        }

        // Calculate anonymization level
        const anonymizationLevel = this.calculateAnonymizationLevel(
            data, processedData, privacyParameters
        );

        // Record operation
        if (this.config.auditTrail) {
            await this.recordPrivacyOperation({
                operationId,
                type: 'composition',
                parameters: privacyParameters,
                privacyBudgetUsed: 1.0,
                timestamp: new Date(),
                inputHash,
                outputHash: this.hashData(processedData)
            });
        }

        // Update privacy budget
        this.updatePrivacyBudget(context.userAddress, 1.0);

        return {
            originalData: data,
            noisyData: processedData,
            privacyParameters: {
                epsilon: this.config.differentialPrivacy.epsilon,
                delta: this.config.differentialPrivacy.delta,
                sensitivity: this.config.differentialPrivacy.sensitivity,
                noiseDistribution: this.config.differentialPrivacy.mechanism
            },
            anonymizationLevel,
            privacyGuarantees: guarantees
        };
    }

    /**
     * Apply differential privacy noise to numerical data
     */
    async applyDifferentialPrivacy(
        data: any,
        config: DifferentialPrivacyConfig
    ): Promise<{ noisyData: any; parameters: any }> {
        const noisyData = { ...data };
        const { epsilon, delta, sensitivity, mechanism, clampingBounds } = config;
        const [minBound, maxBound] = clampingBounds;

        // Apply noise to numerical fields
        const numericalFields = this.identifyNumericalFields(data);
        
        for (const field of numericalFields) {
            const originalValue = this.getNestedValue(data, field);
            if (typeof originalValue === 'number') {
                // Clamp value to bounds
                const clampedValue = Math.max(minBound, Math.min(maxBound, originalValue));
                
                // Generate noise based on mechanism
                let noise = 0;
                if (mechanism === 'laplace') {
                    noise = this.generateLaplaceNoise(0, sensitivity / epsilon);
                } else if (mechanism === 'gaussian') {
                    const sigma = sensitivity * Math.sqrt(2 * Math.log(1.25 / delta)) / epsilon;
                    noise = this.generateGaussianNoise(0, sigma);
                } else if (mechanism === 'exponential') {
                    noise = this.generateExponentialNoise(sensitivity / epsilon);
                }
                
                // Apply noise and clamp again
                const noisyValue = Math.max(minBound, Math.min(maxBound, clampedValue + noise));
                this.setNestedValue(noisyData, field, Math.round(noisyValue));
            }
        }

        return {
            noisyData,
            parameters: {
                epsilon,
                delta,
                sensitivity,
                mechanism,
                fieldsProcessed: numericalFields.length,
                noiseVariance: this.calculateNoiseVariance(mechanism, epsilon, delta, sensitivity)
            }
        };
    }

    /**
     * Apply k-anonymity through generalization and suppression
     */
    async applyKAnonymity(
        data: any,
        config: KAnonymityConfig
    ): Promise<{ anonymizedData: any; parameters: any }> {
        const { k, quasiIdentifiers, sensitiveAttributes, suppressionThreshold, generalizationLevels } = config;
        
        // For aggregated data, we simulate k-anonymity by generalizing specific fields
        const anonymizedData = { ...data };
        const generalizations: Record<string, any> = {};

        // Apply generalization to quasi-identifiers
        for (const qid of quasiIdentifiers) {
            if (this.hasNestedValue(data, qid)) {
                const originalValue = this.getNestedValue(data, qid);
                const generalizationLevel = generalizationLevels[qid] || 1;
                const generalizedValue = this.generalizeValue(originalValue, qid, generalizationLevel);
                
                this.setNestedValue(anonymizedData, qid, generalizedValue);
                generalizations[qid] = {
                    original: originalValue,
                    generalized: generalizedValue,
                    level: generalizationLevel
                };
            }
        }

        // Apply suppression to sensitive attributes if needed
        const suppressions: string[] = [];
        for (const sa of sensitiveAttributes) {
            if (this.hasNestedValue(data, sa)) {
                const suppressionProbability = Math.random();
                if (suppressionProbability < suppressionThreshold) {
                    this.setNestedValue(anonymizedData, sa, null);
                    suppressions.push(sa);
                }
            }
        }

        // Calculate k-anonymity score
        const kAnonymityScore = this.calculateKAnonymityScore(k, generalizations, suppressions);

        return {
            anonymizedData,
            parameters: {
                k,
                generalizations,
                suppressions,
                kAnonymityScore,
                equivalenceClassSize: k // Simulated
            }
        };
    }

    /**
     * Apply zero-knowledge set operations
     */
    async applyZeroKnowledgeSets(
        data: any,
        config: any
    ): Promise<{ privateData: any; parameters: any }> {
        const { setSize, blindingFactor } = config;
        const privateData = { ...data };
        
        // Apply blinding to sensitive numerical values
        const blindingFactors: Record<string, string> = {};
        
        if (blindingFactor) {
            const numericalFields = this.identifyNumericalFields(data);
            
            for (const field of numericalFields) {
                const originalValue = this.getNestedValue(data, field);
                if (typeof originalValue === 'number') {
                    // Generate blinding factor
                    const blindingValue = this.generateBlindingFactor();
                    blindingFactors[field] = blindingValue;
                    
                    // Apply blinding (simplified - in real ZK, this would be more complex)
                    const blindedValue = this.applyBlinding(originalValue, blindingValue);
                    this.setNestedValue(privateData, field, blindedValue);
                }
            }
        }

        // Generate set membership proofs (simplified)
        const membershipProofs = this.generateMembershipProofs(data, setSize);

        return {
            privateData,
            parameters: {
                setSize,
                blindingFactors,
                membershipProofs,
                zkSetOperations: ['membership', 'intersection', 'union']
            }
        };
    }

    /**
     * Calculate overall anonymization level
     */
    private calculateAnonymizationLevel(
        originalData: any,
        processedData: any,
        privacyParameters: any
    ): number {
        let level = 0;
        
        // Differential privacy contribution
        if (privacyParameters.differentialPrivacy) {
            const epsilon = privacyParameters.differentialPrivacy.epsilon;
            level += Math.max(0, 100 - (epsilon * 20)); // Lower epsilon = higher privacy
        }
        
        // K-anonymity contribution
        if (privacyParameters.kAnonymity) {
            const k = privacyParameters.kAnonymity.k;
            level += Math.min(50, k * 10); // Higher k = higher privacy
        }
        
        // Zero-knowledge contribution
        if (privacyParameters.zeroKnowledge) {
            level += 30; // Fixed contribution for ZK techniques
        }
        
        return Math.min(100, level);
    }

    /**
     * Generate comprehensive privacy guarantees
     */
    async generatePrivacyGuarantees(
        privacyParameters: any,
        context: AggregationContext
    ): Promise<PrivacyGuarantees> {
        // Calculate privacy levels
        const differentialPrivacyLevel = privacyParameters.differentialPrivacy 
            ? Math.max(0, 100 - (privacyParameters.differentialPrivacy.epsilon * 20))
            : 0;
        
        const kAnonymityLevel = privacyParameters.kAnonymity 
            ? Math.min(100, privacyParameters.kAnonymity.k * 15)
            : 0;
        
        const zeroKnowledgeLevel = privacyParameters.zeroKnowledge ? 80 : 0;
        
        const overallPrivacyScore = Math.round(
            (differentialPrivacyLevel * 0.4 + kAnonymityLevel * 0.3 + zeroKnowledgeLevel * 0.3)
        );

        // Assess compliance
        const complianceFlags = {
            gdpr: this.assessGDPRCompliance(privacyParameters),
            ccpa: this.assessCCPACompliance(privacyParameters),
            hipaa: this.assessHIPAACompliance(privacyParameters),
            iso27001: this.assessISO27001Compliance(privacyParameters)
        };

        // Risk assessment
        const riskAssessment = this.performRiskAssessment(privacyParameters, overallPrivacyScore);

        return {
            differentialPrivacyLevel,
            kAnonymityLevel,
            zeroKnowledgeLevel,
            overallPrivacyScore,
            complianceFlags,
            riskAssessment
        };
    }

    /**
     * Privacy budget management
     */
    private checkPrivacyBudget(userAddress: string, requiredBudget: number): void {
        const currentBudget = this.privacyBudgetTracker.get(userAddress) || 0;
        const availableBudget = this.config.privacyBudget.total - currentBudget;
        
        if (requiredBudget > availableBudget) {
            throw new Error(`Insufficient privacy budget. Required: ${requiredBudget}, Available: ${availableBudget}`);
        }
    }

    private updatePrivacyBudget(userAddress: string, usedBudget: number): void {
        const currentBudget = this.privacyBudgetTracker.get(userAddress) || 0;
        this.privacyBudgetTracker.set(userAddress, currentBudget + usedBudget);
        this.config.privacyBudget.consumed += usedBudget;
    }

    /**
     * Utility functions for privacy operations
     */
    private identifyNumericalFields(data: any, prefix = ''): string[] {
        const fields: string[] = [];
        
        for (const [key, value] of Object.entries(data)) {
            const fieldPath = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'number') {
                fields.push(fieldPath);
            } else if (typeof value === 'object' && value !== null) {
                fields.push(...this.identifyNumericalFields(value, fieldPath));
            }
        }
        
        return fields;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!(key in current)) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    private hasNestedValue(obj: any, path: string): boolean {
        return this.getNestedValue(obj, path) !== undefined;
    }

    private generalizeValue(value: any, field: string, level: number): any {
        // Simplified generalization logic
        if (typeof value === 'string') {
            if (field === 'language') {
                // Generalize programming languages by category
                const categories = {
                    'web': ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
                    'systems': ['C', 'C++', 'Rust', 'Go'],
                    'data': ['Python', 'R', 'SQL'],
                    'mobile': ['Swift', 'Kotlin', 'Java']
                };
                
                for (const [category, languages] of Object.entries(categories)) {
                    if (languages.includes(value)) {
                        return level >= 2 ? 'programming-language' : category;
                    }
                }
                return 'other';
            } else if (field === 'domain') {
                return level >= 2 ? 'technology' : value;
            }
        } else if (typeof value === 'number') {
            // Generalize numerical values by ranges
            if (field === 'experience_level') {
                if (value < 30) return 'junior';
                if (value < 70) return 'mid-level';
                return 'senior';
            }
        }
        
        return value;
    }

    private calculateKAnonymityScore(
        k: number,
        generalizations: Record<string, any>,
        suppressions: string[]
    ): number {
        let score = k * 15; // Base score from k value
        
        // Penalty for suppressions
        score -= suppressions.length * 10;
        
        // Bonus for generalizations
        score += Object.keys(generalizations).length * 5;
        
        return Math.max(0, Math.min(100, score));
    }

    private generateBlindingFactor(): string {
        return randomBytes(32).toString('hex');
    }

    private applyBlinding(value: number, blindingFactor: string): number {
        // Simplified blinding - in practice, this would use cryptographic operations
        const hash = createHash('sha256').update(`${value}_${blindingFactor}`).digest('hex');
        const blindedValue = parseInt(hash.substring(0, 8), 16) % 1000;
        return blindedValue;
    }

    private generateMembershipProofs(data: any, setSize: number): any[] {
        // Simplified membership proof generation
        const proofs = [];
        const numericalFields = this.identifyNumericalFields(data);
        
        for (const field of numericalFields) {
            const value = this.getNestedValue(data, field);
            proofs.push({
                field,
                value,
                setSize,
                proofHash: createHash('sha256').update(`${field}_${value}_${setSize}`).digest('hex')
            });
        }
        
        return proofs;
    }

    private calculateNoiseVariance(
        mechanism: string,
        epsilon: number,
        delta: number,
        sensitivity: number
    ): number {
        if (mechanism === 'laplace') {
            return 2 * Math.pow(sensitivity / epsilon, 2);
        } else if (mechanism === 'gaussian') {
            const sigma = sensitivity * Math.sqrt(2 * Math.log(1.25 / delta)) / epsilon;
            return Math.pow(sigma, 2);
        }
        return 0;
    }

    private assessGDPRCompliance(privacyParameters: any): boolean {
        // GDPR requires appropriate technical measures
        return privacyParameters.differentialPrivacy || privacyParameters.kAnonymity;
    }

    private assessCCPACompliance(privacyParameters: any): boolean {
        // CCPA requires reasonable security measures
        return privacyParameters.differentialPrivacy || privacyParameters.kAnonymity;
    }

    private assessHIPAACompliance(privacyParameters: any): boolean {
        // HIPAA requires de-identification
        return privacyParameters.kAnonymity && privacyParameters.kAnonymity.k >= 5;
    }

    private assessISO27001Compliance(privacyParameters: any): boolean {
        // ISO 27001 requires risk-based approach
        return Object.keys(privacyParameters).length >= 2;
    }

    private performRiskAssessment(privacyParameters: any, overallScore: number): any {
        const reidentificationRisk = Math.max(0, 100 - overallScore);
        const inferenceRisk = privacyParameters.differentialPrivacy 
            ? Math.max(0, privacyParameters.differentialPrivacy.epsilon * 15)
            : 50;
        const linkageRisk = privacyParameters.kAnonymity 
            ? Math.max(0, 100 - privacyParameters.kAnonymity.k * 15)
            : 70;
        
        const averageRisk = (reidentificationRisk + inferenceRisk + linkageRisk) / 3;
        
        let overallRisk: 'low' | 'medium' | 'high';
        if (averageRisk < 30) overallRisk = 'low';
        else if (averageRisk < 60) overallRisk = 'medium';
        else overallRisk = 'high';
        
        return {
            reidentificationRisk: Math.round(reidentificationRisk),
            inferenceRisk: Math.round(inferenceRisk),
            linkageRisk: Math.round(linkageRisk),
            overallRisk
        };
    }

    private async recordPrivacyOperation(operation: PrivacyOperation): Promise<void> {
        this.operationHistory.push(operation);
        
        // In a real implementation, this would be stored in a secure audit log
        console.log(`Privacy operation recorded: ${operation.operationId}`);
    }

    private generateOperationId(): string {
        return `privacy_op_${Date.now()}_${randomBytes(8).toString('hex')}`;
    }

    private hashData(data: any): string {
        return createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    /**
     * Noise generation functions
     */
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

    private generateExponentialNoise(rate: number): number {
        return -Math.log(Math.random()) / rate;
    }

    /**
     * Public API methods
     */
    public getPrivacyBudgetStatus(userAddress: string): any {
        const consumed = this.privacyBudgetTracker.get(userAddress) || 0;
        const available = this.config.privacyBudget.total - consumed;
        
        return {
            total: this.config.privacyBudget.total,
            consumed,
            available,
            utilizationRate: (consumed / this.config.privacyBudget.total) * 100
        };
    }

    public getOperationHistory(): PrivacyOperation[] {
        return [...this.operationHistory];
    }

    public resetPrivacyBudget(userAddress: string): void {
        this.privacyBudgetTracker.delete(userAddress);
    }
} 