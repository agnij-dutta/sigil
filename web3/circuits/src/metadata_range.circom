pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/gates.circom";

/*
 * MetadataRangeCheck Circuit Component
 * 
 * Verifies that commit metadata values fall within specified ranges
 * without revealing the exact values. This is crucial for privacy-preserving
 * verification of contribution significance.
 * 
 * Use cases:
 * - Prove lines of code is between 10-1000 (meaningful contribution)
 * - Prove files changed is between 1-50 (reasonable scope)
 * - Prove commit is recent (timestamp validation)
 */

template MetadataRangeCheck() {
    signal input value;        // The actual metadata value (private)
    signal input minValue;     // Minimum acceptable value (public)
    signal input maxValue;     // Maximum acceptable value (public)
    
    signal output isInRange;   // 1 if value is in range, 0 otherwise
    
    // Check if value >= minValue
    component geqMin = GreaterEqThan(64);
    geqMin.in[0] <== value;
    geqMin.in[1] <== minValue;
    
    // Check if value <= maxValue
    component leqMax = LessEqThan(64);
    leqMax.in[0] <== value;
    leqMax.in[1] <== maxValue;
    
    // Both conditions must be true
    component rangeCheck = AND();
    rangeCheck.a <== geqMin.out;
    rangeCheck.b <== leqMax.out;
    
    isInRange <== rangeCheck.out;
}

/*
 * Enhanced MetadataValidator for multiple metrics
 * Validates multiple metadata fields simultaneously
 */
template MultiMetadataValidator() {
    // Lines of code validation
    signal input linesOfCode;
    signal input minLOC;
    signal input maxLOC;
    
    // Files changed validation
    signal input filesChanged;
    signal input minFiles;
    signal input maxFiles;
    
    // Commit size validation (bytes)
    signal input commitSize;
    signal input minSize;
    signal input maxSize;
    
    signal output allValid;
    
    // Validate lines of code range
    component locValidator = MetadataRangeCheck();
    locValidator.value <== linesOfCode;
    locValidator.minValue <== minLOC;
    locValidator.maxValue <== maxLOC;
    
    // Validate files changed range
    component filesValidator = MetadataRangeCheck();
    filesValidator.value <== filesChanged;
    filesValidator.minValue <== minFiles;
    filesValidator.maxValue <== maxFiles;
    
    // Validate commit size range
    component sizeValidator = MetadataRangeCheck();
    sizeValidator.value <== commitSize;
    sizeValidator.minValue <== minSize;
    sizeValidator.maxValue <== maxSize;
    
    // All validations must pass
    component and1 = AND();
    and1.a <== locValidator.isInRange;
    and1.b <== filesValidator.isInRange;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== sizeValidator.isInRange;
    
    allValid <== and2.out;
}

/*
 * CommitQualityValidator
 * Validates that a commit meets minimum quality thresholds
 * while preserving privacy of exact metrics
 */
template CommitQualityValidator() {
    signal input linesAdded;
    signal input linesDeleted;
    signal input filesChanged;
    signal input commitMessage;  // Hash of commit message
    
    // Quality thresholds (public)
    signal input minTotalLines;
    signal input maxTotalLines;
    signal input minFiles;
    signal input maxFiles;
    
    signal output isQualityCommit;
    
    // Calculate total lines changed
    signal totalLines <== linesAdded + linesDeleted;
    
    // Validate total lines changed
    component linesValidator = MetadataRangeCheck();
    linesValidator.value <== totalLines;
    linesValidator.minValue <== minTotalLines;
    linesValidator.maxValue <== maxTotalLines;
    
    // Validate files changed
    component filesValidator = MetadataRangeCheck();
    filesValidator.value <== filesChanged;
    filesValidator.minValue <== minFiles;
    filesValidator.maxValue <== maxFiles;
    
    // Ensure commit message exists (non-zero hash)
    component messageCheck = IsZero();
    messageCheck.in <== commitMessage;
    component hasMessage = NOT();
    hasMessage.in <== messageCheck.out;
    
    // All quality checks must pass
    component quality1 = AND();
    quality1.a <== linesValidator.isInRange;
    quality1.b <== filesValidator.isInRange;
    
    component quality2 = AND();
    quality2.a <== quality1.out;
    quality2.b <== hasMessage.out;
    
    isQualityCommit <== quality2.out;
}

/*
 * TimeRangeValidator
 * Validates that timestamps fall within reasonable ranges
 */
template TimeRangeValidator() {
    signal input timestamp;
    signal input minTimestamp;  // Earliest acceptable time
    signal input maxTimestamp;  // Latest acceptable time (usually current time)
    
    signal output isValidTime;
    
    component timeValidator = MetadataRangeCheck();
    timeValidator.value <== timestamp;
    timeValidator.minValue <== minTimestamp;
    timeValidator.maxValue <== maxTimestamp;
    
    isValidTime <== timeValidator.isInRange;
} 