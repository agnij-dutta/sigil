pragma circom 2.0.0;

include "../core/primitives/merkle_tree.circom";
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

template ConsistencyCredential(
    maxPeriods,      // Maximum number of time periods to analyze
    maxCommits,      // Maximum commits per period
    maxQualityLevels // Maximum quality levels (1-10)
) {
    // Input signals
    signal input userHash;                    // Hash of user identity
    signal input periodHashes[maxPeriods];    // Hashes of time periods
    signal input commitCounts[maxPeriods];    // Commits per period
    signal input qualityScores[maxPeriods];   // Quality scores per period
    signal input activityDays[maxPeriods];    // Active days per period
    signal input learningMetrics[maxPeriods]; // Learning progression metrics
    signal input burnoutIndicators[maxPeriods]; // Burnout resistance scores
    signal input velocityMetrics[maxPeriods]; // Development velocity per period
    signal input gapAnalysis[maxPeriods];     // Gap analysis between periods
    signal input totalPeriods;               // Actual number of periods
    signal input consistencyThreshold;       // Minimum consistency score required
    signal input sustainabilityThreshold;    // Minimum sustainability score required

    // Output signals
    signal output credentialHash;            // Hash of the credential
    signal output consistencyIndex;          // Overall consistency score (0-100)
    signal output sustainabilityScore;       // Sustainability score (0-100)
    signal output burnoutResistance;         // Burnout resistance score (0-100)
    signal output qualityTrendDirection;     // 1=improving, 0=stable, -1=declining
    signal output velocityTrendDirection;    // 1=improving, 0=stable, -1=declining
    signal output learningConsistency;       // Learning consistency score (0-100)
    signal output isValid;                   // 1 if credential is valid, 0 otherwise

    // Intermediate signals
    signal consistencyComponents[7];         // Individual consistency components
    signal qualityTrends[maxPeriods-1];     // Quality trend between periods
    signal velocityTrends[maxPeriods-1];    // Velocity trend between periods
    signal activityConsistency[maxPeriods]; // Activity consistency per period
    signal qualityConsistency[maxPeriods];  // Quality consistency per period
    signal learningProgression[maxPeriods]; // Learning progression per period
    signal gapPenalties[maxPeriods];        // Penalties for gaps in activity
    signal normalizedMetrics[maxPeriods * 4]; // Normalized metrics for analysis

    // Components for verification
    component userHashVerifier = MerkleTreeVerifier(8);
    component periodVerifiers[maxPeriods];
    component rangeProofs[maxPeriods * 6];
    component hashChainVerifier = HashChainVerifier(maxPeriods);

    // Initialize range proof components
    var rangeProofIndex = 0;
    for (var i = 0; i < maxPeriods; i++) {
        // Commit count range proofs (0 to maxCommits)
        rangeProofs[rangeProofIndex] = RangeProof(maxCommits + 1);
        rangeProofs[rangeProofIndex].value <== commitCounts[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== maxCommits;
        rangeProofIndex++;

        // Quality score range proofs (0 to maxQualityLevels)
        rangeProofs[rangeProofIndex] = RangeProof(maxQualityLevels + 1);
        rangeProofs[rangeProofIndex].value <== qualityScores[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== maxQualityLevels;
        rangeProofIndex++;

        // Activity days range proofs (0 to 31)
        rangeProofs[rangeProofIndex] = RangeProof(32);
        rangeProofs[rangeProofIndex].value <== activityDays[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 31;
        rangeProofIndex++;

        // Learning metrics range proofs (0 to 100)
        rangeProofs[rangeProofIndex] = RangeProof(101);
        rangeProofs[rangeProofIndex].value <== learningMetrics[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 100;
        rangeProofIndex++;

        // Burnout indicators range proofs (0 to 100)
        rangeProofs[rangeProofIndex] = RangeProof(101);
        rangeProofs[rangeProofIndex].value <== burnoutIndicators[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 100;
        rangeProofIndex++;

        // Velocity metrics range proofs (0 to 100)
        rangeProofs[rangeProofIndex] = RangeProof(101);
        rangeProofs[rangeProofIndex].value <== velocityMetrics[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 100;
        rangeProofIndex++;
    }

    // Verify hash chain of periods for temporal ordering
    hashChainVerifier.hashes <== periodHashes;
    hashChainVerifier.length <== totalPeriods;

    // Calculate activity consistency for each period
    for (var i = 0; i < maxPeriods; i++) {
        // Activity consistency based on commits and active days
        var expectedActivity = (commitCounts[i] > 0) ? 1 : 0;
        var actualActivity = (activityDays[i] > 0) ? 1 : 0;
        activityConsistency[i] <== expectedActivity * actualActivity;

        // Quality consistency (penalize dramatic quality drops)
        if (i > 0) {
            var qualityDiff = qualityScores[i] - qualityScores[i-1];
            var qualityPenalty = (qualityDiff < -2) ? 1 : 0;
            qualityConsistency[i] <== 1 - qualityPenalty;
        } else {
            qualityConsistency[i] <== 1;
        }

        // Learning progression (should be non-negative)
        var learningGrowth = (i > 0) ? learningMetrics[i] - learningMetrics[i-1] : 0;
        learningProgression[i] <== (learningGrowth >= 0) ? 1 : 0;

        // Gap penalties (penalize long gaps in activity)
        var gapPenalty = (gapAnalysis[i] > 90) ? 1 : 0; // 90+ day gaps penalized
        gapPenalties[i] <== 1 - gapPenalty;
    }

    // Calculate quality trends between periods
    for (var i = 0; i < maxPeriods - 1; i++) {
        var qualityChange = qualityScores[i+1] - qualityScores[i];
        if (qualityChange > 0) {
            qualityTrends[i] <== 1;  // Improving
        } else if (qualityChange < 0) {
            qualityTrends[i] <== -1; // Declining
        } else {
            qualityTrends[i] <== 0;  // Stable
        }
    }

    // Calculate velocity trends between periods
    for (var i = 0; i < maxPeriods - 1; i++) {
        var velocityChange = velocityMetrics[i+1] - velocityMetrics[i];
        if (velocityChange > 0) {
            velocityTrends[i] <== 1;  // Improving
        } else if (velocityChange < 0) {
            velocityTrends[i] <== -1; // Declining
        } else {
            velocityTrends[i] <== 0;  // Stable
        }
    }

    // Calculate consistency components
    var activitySum = 0;
    var qualitySum = 0;
    var learningSum = 0;
    var gapSum = 0;
    var burnoutSum = 0;
    var velocitySum = 0;
    var qualityTrendSum = 0;

    for (var i = 0; i < maxPeriods; i++) {
        activitySum += activityConsistency[i];
        qualitySum += qualityConsistency[i];
        learningSum += learningProgression[i];
        gapSum += gapPenalties[i];
        burnoutSum += burnoutIndicators[i];
        velocitySum += velocityMetrics[i];
    }

    for (var i = 0; i < maxPeriods - 1; i++) {
        qualityTrendSum += qualityTrends[i];
    }

    // Normalize consistency components (0-100 scale)
    consistencyComponents[0] <== (activitySum * 100) / totalPeriods;      // Activity consistency
    consistencyComponents[1] <== (qualitySum * 100) / totalPeriods;       // Quality consistency
    consistencyComponents[2] <== (learningSum * 100) / totalPeriods;      // Learning consistency
    consistencyComponents[3] <== (gapSum * 100) / totalPeriods;           // Gap management
    consistencyComponents[4] <== (burnoutSum) / totalPeriods;             // Burnout resistance
    consistencyComponents[5] <== (velocitySum) / totalPeriods;            // Velocity consistency
    consistencyComponents[6] <== ((qualityTrendSum + maxPeriods) * 50) / maxPeriods; // Quality trend

    // Calculate overall consistency index (weighted average)
    var weightedSum = 
        consistencyComponents[0] * 20 +  // Activity: 20%
        consistencyComponents[1] * 25 +  // Quality: 25%
        consistencyComponents[2] * 15 +  // Learning: 15%
        consistencyComponents[3] * 10 +  // Gaps: 10%
        consistencyComponents[4] * 15 +  // Burnout: 15%
        consistencyComponents[5] * 10 +  // Velocity: 10%
        consistencyComponents[6] * 5;    // Trends: 5%

    consistencyIndex <== weightedSum / 100;

    // Calculate sustainability score (focus on long-term patterns)
    var sustainabilitySum = 
        consistencyComponents[3] * 30 +  // Gap management: 30%
        consistencyComponents[4] * 40 +  // Burnout resistance: 40%
        consistencyComponents[2] * 20 +  // Learning progression: 20%
        consistencyComponents[6] * 10;   // Quality trends: 10%

    sustainabilityScore <== sustainabilitySum / 100;

    // Set output values
    burnoutResistance <== consistencyComponents[4];
    learningConsistency <== consistencyComponents[2];

    // Determine overall quality trend direction
    var avgQualityTrend = qualityTrendSum / (maxPeriods - 1);
    if (avgQualityTrend > 0.3) {
        qualityTrendDirection <== 1;   // Improving
    } else if (avgQualityTrend < -0.3) {
        qualityTrendDirection <== -1;  // Declining
    } else {
        qualityTrendDirection <== 0;   // Stable
    }

    // Determine overall velocity trend direction
    var velocityTrendSum = 0;
    for (var i = 0; i < maxPeriods - 1; i++) {
        velocityTrendSum += velocityTrends[i];
    }
    var avgVelocityTrend = velocityTrendSum / (maxPeriods - 1);
    if (avgVelocityTrend > 0.3) {
        velocityTrendDirection <== 1;   // Improving
    } else if (avgVelocityTrend < -0.3) {
        velocityTrendDirection <== -1;  // Declining
    } else {
        velocityTrendDirection <== 0;   // Stable
    }

    // Validate credential (must meet minimum thresholds)
    var consistencyValid = (consistencyIndex >= consistencyThreshold) ? 1 : 0;
    var sustainabilityValid = (sustainabilityScore >= sustainabilityThreshold) ? 1 : 0;
    var periodsValid = (totalPeriods >= 3) ? 1 : 0; // Minimum 3 periods for consistency

    isValid <== consistencyValid * sustainabilityValid * periodsValid;

    // Generate credential hash
    component credentialHasher = Poseidon(10);
    credentialHasher.inputs[0] <== userHash;
    credentialHasher.inputs[1] <== consistencyIndex;
    credentialHasher.inputs[2] <== sustainabilityScore;
    credentialHasher.inputs[3] <== burnoutResistance;
    credentialHasher.inputs[4] <== qualityTrendDirection + 2; // Normalize to positive
    credentialHasher.inputs[5] <== velocityTrendDirection + 2; // Normalize to positive
    credentialHasher.inputs[6] <== learningConsistency;
    credentialHasher.inputs[7] <== totalPeriods;
    credentialHasher.inputs[8] <== hashChainVerifier.isValid;
    credentialHasher.inputs[9] <== isValid;

    credentialHash <== credentialHasher.out;

    // Constraint: Credential must be valid
    isValid === 1;

    // Constraint: Hash chain must be valid
    hashChainVerifier.isValid === 1;

    // Constraint: Total periods must be reasonable
    component totalPeriodsRange = RangeProof(maxPeriods + 1);
    totalPeriodsRange.value <== totalPeriods;
    totalPeriodsRange.minValue <== 1;
    totalPeriodsRange.maxValue <== maxPeriods;

    // Constraint: Thresholds must be reasonable
    component consistencyThresholdRange = RangeProof(101);
    consistencyThresholdRange.value <== consistencyThreshold;
    consistencyThresholdRange.minValue <== 0;
    consistencyThresholdRange.maxValue <== 100;

    component sustainabilityThresholdRange = RangeProof(101);
    sustainabilityThresholdRange.value <== sustainabilityThreshold;
    sustainabilityThresholdRange.minValue <== 0;
    sustainabilityThresholdRange.maxValue <== 100;
}