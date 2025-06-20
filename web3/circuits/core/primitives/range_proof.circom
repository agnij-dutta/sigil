pragma circom 2.0.0;

/*
 * Range Proof Circuit
 * 
 * Proves that a private value is within a specified range [min, max]
 * without revealing the actual value
 * Used for LOC counts, commit counts, collaboration percentages, etc.
 */

template RangeProof() {
    signal input value;      // Private value to prove is in range
    signal input minValue;   // Minimum allowed value (public)
    signal input maxValue;   // Maximum allowed value (public)
    
    signal output isInRange; // 1 if value is in [minValue, maxValue]
    
    // Check value >= minValue
    component geqMin = GreaterEqThan(32);
    geqMin.in[0] <== value;
    geqMin.in[1] <== minValue;
    
    // Check value <= maxValue  
    component leqMax = LessEqThan(32);
    leqMax.in[0] <== value;
    leqMax.in[1] <== maxValue;
    
    // Both conditions must be true
    component and = AND();
    and.a <== geqMin.out;
    and.b <== leqMax.out;
    
    isInRange <== and.out;
}

/*
 * Multi-Range Proof
 * 
 * Proves multiple values are each within their respective ranges
 * More efficient than individual range proofs
 */
template MultiRangeProof(n) {
    signal input values[n];       // Private values to prove
    signal input minValues[n];    // Minimum values for each
    signal input maxValues[n];    // Maximum values for each
    
    signal output allInRange;     // 1 if all values are in their ranges
    
    component rangeProofs[n];
    
    for (var i = 0; i < n; i++) {
        rangeProofs[i] = RangeProof();
        rangeProofs[i].value <== values[i];
        rangeProofs[i].minValue <== minValues[i];
        rangeProofs[i].maxValue <== maxValues[i];
    }
    
    // All proofs must be valid
    var allValid = 1;
    for (var i = 0; i < n; i++) {
        allValid *= rangeProofs[i].isInRange;
    }
    
    allInRange <== allValid;
}

/*
 * Percentage Range Proof
 * 
 * Specialized for proving percentages (0-100)
 * with additional validation
 */
template PercentageProof() {
    signal input percentage;      // Value to prove is valid percentage
    signal input minPercent;      // Minimum allowed percentage
    signal input maxPercent;      // Maximum allowed percentage
    
    signal output isValidPercent; // 1 if valid percentage in range
    
    // Basic range check
    component rangeCheck = RangeProof();
    rangeCheck.value <== percentage;
    rangeCheck.minValue <== minPercent;
    rangeCheck.maxValue <== maxPercent;
    
    // Ensure within 0-100 bounds
    component boundsCheck = RangeProof();
    boundsCheck.value <== percentage;
    boundsCheck.minValue <== 0;
    boundsCheck.maxValue <== 100;
    
    // Both checks must pass
    component and = AND();
    and.a <== rangeCheck.isInRange;
    and.b <== boundsCheck.isInRange;
    
    isValidPercent <== and.out;
}

/*
 * Sum Range Proof
 * 
 * Proves that a sum of private values is within a range
 * without revealing individual values or the exact sum
 */
template SumRangeProof(n) {
    signal input values[n];       // Private values to sum
    signal input minSum;          // Minimum allowed sum
    signal input maxSum;          // Maximum allowed sum
    
    signal output sumInRange;     // 1 if sum is in range
    
    // Calculate sum
    var sum = 0;
    for (var i = 0; i < n; i++) {
        sum += values[i];
    }
    
    // Prove sum is in range
    component rangeProof = RangeProof();
    rangeProof.value <== sum;
    rangeProof.minValue <== minSum;
    rangeProof.maxValue <== maxSum;
    
    sumInRange <== rangeProof.isInRange;
}

/*
 * Threshold Proof
 * 
 * Proves a value meets a minimum threshold
 * Used for meaningful usage proofs (minimum LOC, commits, etc.)
 */
template ThresholdProof() {
    signal input value;          // Private value to check
    signal input threshold;      // Minimum threshold (public)
    
    signal output meetsThreshold; // 1 if value >= threshold
    
    component geq = GreaterEqThan(32);
    geq.in[0] <== value;
    geq.in[1] <== threshold;
    
    meetsThreshold <== geq.out;
}

/*
 * Multi-Threshold Proof
 * 
 * Proves multiple values each meet their respective thresholds
 */
template MultiThresholdProof(n) {
    signal input values[n];       // Private values to check
    signal input thresholds[n];   // Minimum thresholds for each
    
    signal output allMeetThreshold; // 1 if all values meet thresholds
    
    component thresholdProofs[n];
    
    for (var i = 0; i < n; i++) {
        thresholdProofs[i] = ThresholdProof();
        thresholdProofs[i].value <== values[i];
        thresholdProofs[i].threshold <== thresholds[i];
    }
    
    // All proofs must be valid
    var allValid = 1;
    for (var i = 0; i < n; i++) {
        allValid *= thresholdProofs[i].meetsThreshold;
    }
    
    allMeetThreshold <== allValid;
}

/*
 * Bounded Difference Proof
 * 
 * Proves that |value1 - value2| <= maxDifference
 * Used for consistency checks
 */
template BoundedDifferenceProof() {
    signal input value1;         // First private value
    signal input value2;         // Second private value  
    signal input maxDifference;  // Maximum allowed difference
    
    signal output withinBounds;  // 1 if difference is bounded
    
    // Calculate absolute difference
    component isGreater = GreaterThan(32);
    isGreater.in[0] <== value1;
    isGreater.in[1] <== value2;
    
    component diff1 = Num2Bits(32);
    diff1.in <== value1 - value2;
    
    component diff2 = Num2Bits(32);
    diff2.in <== value2 - value1;
    
    component selector = Mux1();
    selector.c[0] <== value2 - value1;  // If value1 <= value2
    selector.c[1] <== value1 - value2;  // If value1 > value2
    selector.s <== isGreater.out;
    
    // Check absolute difference <= maxDifference
    component leq = LessEqThan(32);
    leq.in[0] <== selector.out;
    leq.in[1] <== maxDifference;
    
    withinBounds <== leq.out;
}

/*
 * Progressive Range Proof
 * 
 * Proves values are in increasing ranges (useful for experience levels)
 * junior: 0-50 commits, mid: 50-200, senior: 200+
 */
template ProgressiveRangeProof(levels) {
    signal input value;           // Value to categorize
    signal input thresholds[levels]; // Thresholds for each level
    signal input claimedLevel;    // Level user claims (0 to levels-1)
    
    signal output validLevel;     // 1 if value supports claimed level
    
    // Check value meets minimum threshold for claimed level
    component minCheck = GreaterEqThan(32);
    minCheck.in[0] <== value;
    minCheck.in[1] <== thresholds[claimedLevel];
    
    // If not at max level, check value doesn't exceed next threshold
    component maxCheck = LessEqThan(32);
    
    // Use conditional logic for max level
    component isMaxLevel = IsEqual();
    isMaxLevel.in[0] <== claimedLevel;
    isMaxLevel.in[1] <== levels - 1;
    
    component nextThresholdSelector = Mux1();
    nextThresholdSelector.c[0] <== thresholds[claimedLevel + 1]; // Next threshold
    nextThresholdSelector.c[1] <== 2**32 - 1;                   // Max value if at top level
    nextThresholdSelector.s <== isMaxLevel.out;
    
    maxCheck.in[0] <== value;
    maxCheck.in[1] <== nextThresholdSelector.out;
    
    // Both checks must pass
    component and = AND();
    and.a <== minCheck.out;
    and.b <== maxCheck.out;
    
    validLevel <== and.out;
} 