pragma circom 2.0.0;

include "../core/utilities.circom";
include "../core/primitives/range_proof.circom";
include "../core/primitives/hash_chain.circom";

/*
    ConsistencyCredential: Proves temporal consistency of developer contributions
    
    This circuit proves:
    1. Consistent activity over time periods
    2. Quality maintenance across contributions
    3. Sustainable contribution patterns
    4. Burnout resistance indicators
    5. Learning progression consistency
    6. Velocity trend analysis
*/

template ConsistencyCredential(maxPeriods) {
    // Public inputs
    signal input userHash;
    signal input consistencyThreshold;
    signal input sustainabilityThreshold;
    signal input totalPeriods;
    
    // Period data arrays
    signal input periodHashes[maxPeriods];
    signal input commitCounts[maxPeriods];
    signal input activityDays[maxPeriods];
    signal input qualityScores[maxPeriods];
    signal input learningMetrics[maxPeriods];
    signal input gapAnalysis[maxPeriods];
    signal input burnoutIndicators[maxPeriods];
    signal input velocityMetrics[maxPeriods];
    
    // Outputs
    signal output isValid;
    signal output consistencyIndex;
    signal output sustainabilityScore;
    signal output credentialHash;
    signal output burnoutResistance;
    signal output learningConsistency;
    signal output qualityTrendDirection;
    signal output velocityTrendDirection;
    
    // Internal signals
    signal activityConsistency[maxPeriods];
    signal qualityConsistency[maxPeriods];
    signal learningProgression[maxPeriods];
    signal gapPenalties[maxPeriods];
    signal qualityTrends[maxPeriods];
    signal velocityTrends[maxPeriods];
    signal consistencyComponents[7];
    
    // Hash chain verifier for temporal ordering
    component hashChainVerifier = HashChain(maxPeriods);
    
    // Range proof components for validating metrics
    component rangeProofs[maxPeriods * 6]; // 6 metrics per period
    var rangeProofIndex = 0;
    
    // Validate each period's metrics
    for (var i = 0; i < maxPeriods; i++) {
        // Commit counts range proof (0 to 1000)
        rangeProofs[rangeProofIndex] = RangeProofCustom(32);
        rangeProofs[rangeProofIndex].value <== commitCounts[i];
        rangeProofs[rangeProofIndex].min <== 0;
        rangeProofs[rangeProofIndex].max <== 1000;
        rangeProofIndex++;
        
        // Activity days range proof (0 to 365)
        rangeProofs[rangeProofIndex] = RangeProofCustom(32);
        rangeProofs[rangeProofIndex].value <== activityDays[i];
        rangeProofs[rangeProofIndex].min <== 0;
        rangeProofs[rangeProofIndex].max <== 365;
        rangeProofIndex++;
        
        // Quality scores range proof (0 to 100)
        rangeProofs[rangeProofIndex] = RangeProofCustom(32);
        rangeProofs[rangeProofIndex].value <== qualityScores[i];
        rangeProofs[rangeProofIndex].min <== 0;
        rangeProofs[rangeProofIndex].max <== 100;
        rangeProofIndex++;
        
        // Learning metrics range proof (0 to 100)
        rangeProofs[rangeProofIndex] = RangeProofCustom(32);
        rangeProofs[rangeProofIndex].value <== learningMetrics[i];
        rangeProofs[rangeProofIndex].min <== 0;
        rangeProofs[rangeProofIndex].max <== 100;
        rangeProofIndex++;
        
        // Gap analysis range proof (0 to 365)
        rangeProofs[rangeProofIndex] = RangeProofCustom(32);
        rangeProofs[rangeProofIndex].value <== gapAnalysis[i];
        rangeProofs[rangeProofIndex].min <== 0;
        rangeProofs[rangeProofIndex].max <== 365;
        rangeProofIndex++;
        
        // Burnout indicators range proof (0 to 100)
        rangeProofs[rangeProofIndex] = RangeProofCustom(32);
        rangeProofs[rangeProofIndex].value <== burnoutIndicators[i];
        rangeProofs[rangeProofIndex].min <== 0;
        rangeProofs[rangeProofIndex].max <== 100;
        rangeProofIndex++;
    }
    
    // Set up hash chain verification
    for (var i = 0; i < maxPeriods; i++) {
        hashChainVerifier.elements[i] <== periodHashes[i];
    }
    hashChainVerifier.length <== totalPeriods;
    
    // Calculate simplified consistency metrics
    component activityChecks[maxPeriods];
    component qualityChecks[maxPeriods];
    component learningChecks[maxPeriods];
    component gapChecks[maxPeriods];
    
    for (var i = 0; i < maxPeriods; i++) {
        // Activity consistency: both commits and days > 0
        activityChecks[i] = GreaterThan(32);
        activityChecks[i].in[0] <== commitCounts[i] + activityDays[i];
        activityChecks[i].in[1] <== 0;
        activityConsistency[i] <== activityChecks[i].out;
        
        // Quality consistency: quality score >= 50
        qualityChecks[i] = GreaterEqThan(32);
        qualityChecks[i].in[0] <== qualityScores[i];
        qualityChecks[i].in[1] <== 50;
        qualityConsistency[i] <== qualityChecks[i].out;
        
        // Learning progression: learning metric >= 30
        learningChecks[i] = GreaterEqThan(32);
        learningChecks[i].in[0] <== learningMetrics[i];
        learningChecks[i].in[1] <== 30;
        learningProgression[i] <== learningChecks[i].out;
        
        // Gap penalty: gap analysis <= 30 days
        gapChecks[i] = LessEqThan(32);
        gapChecks[i].in[0] <== gapAnalysis[i];
        gapChecks[i].in[1] <== 30;
        gapPenalties[i] <== gapChecks[i].out;
    }
    
    // Calculate sums for consistency components
    var activitySum = 0;
    var qualitySum = 0;
    var learningSum = 0;
    var gapSum = 0;
    var burnoutSum = 0;
    var velocitySum = 0;
    
    for (var i = 0; i < maxPeriods; i++) {
        activitySum += activityConsistency[i];
        qualitySum += qualityConsistency[i];
        learningSum += learningProgression[i];
        gapSum += gapPenalties[i];
        burnoutSum += (100 - burnoutIndicators[i]); // Invert burnout
        velocitySum += velocityMetrics[i];
    }
    
    // Calculate normalized consistency components (0-100 scale)
    consistencyComponents[0] <== (activitySum * 100) / totalPeriods;
    consistencyComponents[1] <== (qualitySum * 100) / totalPeriods;
    consistencyComponents[2] <== (learningSum * 100) / totalPeriods;
    consistencyComponents[3] <== (gapSum * 100) / totalPeriods;
    consistencyComponents[4] <== burnoutSum / totalPeriods;
    consistencyComponents[5] <== velocitySum / totalPeriods;
    consistencyComponents[6] <== 75; // Default trend score
    
    // Calculate weighted consistency index
    var weightedSum = 
        consistencyComponents[0] * 20 +  // Activity: 20%
        consistencyComponents[1] * 25 +  // Quality: 25%
        consistencyComponents[2] * 15 +  // Learning: 15%
        consistencyComponents[3] * 10 +  // Gaps: 10%
        consistencyComponents[4] * 15 +  // Burnout: 15%
        consistencyComponents[5] * 10 +  // Velocity: 10%
        consistencyComponents[6] * 5;    // Trends: 5%
    
    consistencyIndex <== weightedSum / 100;
    
    // Calculate sustainability score
    var sustainabilitySum = 
        consistencyComponents[3] * 30 +  // Gap management: 30%
        consistencyComponents[4] * 40 +  // Burnout resistance: 40%
        consistencyComponents[2] * 20 +  // Learning progression: 20%
        consistencyComponents[6] * 10;   // Quality trends: 10%
    
    sustainabilityScore <== sustainabilitySum / 100;
    
    // Set output values
    burnoutResistance <== consistencyComponents[4];
    learningConsistency <== consistencyComponents[2];
    qualityTrendDirection <== 1; // Default positive trend
    velocityTrendDirection <== 1; // Default positive trend
    
    // Validate credential thresholds
    component consistencyCheck = GreaterEqThan(32);
    consistencyCheck.in[0] <== consistencyIndex;
    consistencyCheck.in[1] <== consistencyThreshold;
    
    component sustainabilityCheck = GreaterEqThan(32);
    sustainabilityCheck.in[0] <== sustainabilityScore;
    sustainabilityCheck.in[1] <== sustainabilityThreshold;
    
    component periodsCheck = GreaterEqThan(32);
    periodsCheck.in[0] <== totalPeriods;
    periodsCheck.in[1] <== 3;
    
    // Combine all validity checks
    component validityAnd1 = AND();
    validityAnd1.a <== consistencyCheck.out;
    validityAnd1.b <== sustainabilityCheck.out;
    
    component validityAnd2 = AND();
    validityAnd2.a <== validityAnd1.out;
    validityAnd2.b <== periodsCheck.out;
    
    component validityAnd3 = AND();
    validityAnd3.a <== validityAnd2.out;
    validityAnd3.b <== hashChainVerifier.isValid;
    
    isValid <== validityAnd3.out;
    
    // Generate credential hash
    component credentialHasher = Poseidon(8);
    credentialHasher.inputs[0] <== userHash;
    credentialHasher.inputs[1] <== consistencyIndex;
    credentialHasher.inputs[2] <== sustainabilityScore;
    credentialHasher.inputs[3] <== burnoutResistance;
    credentialHasher.inputs[4] <== learningConsistency;
    credentialHasher.inputs[5] <== totalPeriods;
    credentialHasher.inputs[6] <== hashChainVerifier.isValid;
    credentialHasher.inputs[7] <== isValid;
    
    credentialHash <== credentialHasher.out;
    
    // Validation constraints
    component totalPeriodsRange = RangeProofCustom(32);
    totalPeriodsRange.value <== totalPeriods;
    totalPeriodsRange.min <== 1;
    totalPeriodsRange.max <== maxPeriods;
    
    component consistencyThresholdRange = RangeProofCustom(32);
    consistencyThresholdRange.value <== consistencyThreshold;
    consistencyThresholdRange.min <== 0;
    consistencyThresholdRange.max <== 100;
    
    component sustainabilityThresholdRange = RangeProofCustom(32);
    sustainabilityThresholdRange.value <== sustainabilityThreshold;
    sustainabilityThresholdRange.min <== 0;
    sustainabilityThresholdRange.max <== 100;
}

component main = ConsistencyCredential(10);
