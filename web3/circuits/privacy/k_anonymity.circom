pragma circom 2.0.0;

include "../core/primitives/range_proof.circom";

/*
    K-Anonymity Privacy Circuit
    
    This circuit ensures k-anonymity for collaboration data by verifying that:
    1. Any group of collaborators has at least k members
    2. Individual contributors cannot be uniquely identified
    3. Quasi-identifiers are sufficiently generalized
    4. Sensitive attributes are protected through group membership
    
    K-anonymity is crucial for protecting collaborator identities while still
    proving meaningful collaboration patterns.
*/

template KAnonymity(maxGroupSize, maxAttributes) {
    // Input signals
    signal input groupSize;                    // Actual group size
    signal input k;                           // Minimum group size for anonymity
    signal input quasiIdentifiers[maxAttributes]; // Quasi-identifying attributes
    signal input sensitiveAttributes[maxAttributes]; // Sensitive attributes to protect
    signal input generalizedValues[maxAttributes]; // Generalized attribute values
    signal input suppressionFlags[maxAttributes]; // Flags for suppressed attributes
    signal input equivalenceClassSize;        // Size of equivalence class
    signal input diversityLevel;             // L-diversity level (optional)
    
    // Output signals
    signal output isKAnonymous;               // 1 if k-anonymous, 0 otherwise
    signal output privacyLevel;               // Privacy level achieved (0-100)
    signal output equivalenceClassValid;      // 1 if equivalence class is valid
    signal output diversityAchieved;          // 1 if l-diversity is achieved
    signal output suppressionCount;           // Number of suppressed attributes
    signal output generalizationLevel;       // Level of generalization applied
    
    // Intermediate signals
    signal groupSizeValid;                    // Group size validation
    signal attributeProtection[maxAttributes]; // Protection level per attribute
    signal equivalenceClassCheck;             // Equivalence class validation
    signal diversityCheck;                    // Diversity check for sensitive attributes
    signal suppressionLevel;                  // Level of suppression applied
    signal generalizationScore;               // Score for generalization quality
    
    // Components for verification
    component rangeProofs[6 + maxAttributes * 3];
    var rangeProofIndex = 0;
    
    // Validate group size is at least k
    component groupSizeGTE = GreaterThanOrEqual(16);
    groupSizeGTE.in[0] <== groupSize;
    groupSizeGTE.in[1] <== k;
    groupSizeValid <== groupSizeGTE.out;
    
    // Validate equivalence class size
    component equivalenceClassGTE = GreaterThanOrEqual(16);
    equivalenceClassGTE.in[0] <== equivalenceClassSize;
    equivalenceClassGTE.in[1] <== k;
    equivalenceClassCheck <== equivalenceClassGTE.out;
    
    // Range proof for group size
    rangeProofs[rangeProofIndex] = RangeProof(maxGroupSize + 1);
    rangeProofs[rangeProofIndex].value <== groupSize;
    rangeProofs[rangeProofIndex].minValue <== 1;
    rangeProofs[rangeProofIndex].maxValue <== maxGroupSize;
    rangeProofIndex++;
    
    // Range proof for k value
    rangeProofs[rangeProofIndex] = RangeProof(maxGroupSize + 1);
    rangeProofs[rangeProofIndex].value <== k;
    rangeProofs[rangeProofIndex].minValue <== 2;
    rangeProofs[rangeProofIndex].maxValue <== maxGroupSize;
    rangeProofIndex++;
    
    // Range proof for equivalence class size
    rangeProofs[rangeProofIndex] = RangeProof(maxGroupSize + 1);
    rangeProofs[rangeProofIndex].value <== equivalenceClassSize;
    rangeProofs[rangeProofIndex].minValue <== 1;
    rangeProofs[rangeProofIndex].maxValue <== maxGroupSize;
    rangeProofIndex++;
    
    // Range proof for diversity level
    rangeProofs[rangeProofIndex] = RangeProof(maxAttributes + 1);
    rangeProofs[rangeProofIndex].value <== diversityLevel;
    rangeProofs[rangeProofIndex].minValue <== 1;
    rangeProofs[rangeProofIndex].maxValue <== maxAttributes;
    rangeProofIndex++;
    
    // Validate attribute protection
    var totalSuppression = 0;
    var totalGeneralization = 0;
    var protectedAttributes = 0;
    
    for (var i = 0; i < maxAttributes; i++) {
        // Range proofs for quasi-identifiers
        rangeProofs[rangeProofIndex] = RangeProof(1001);
        rangeProofs[rangeProofIndex].value <== quasiIdentifiers[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 1000;
        rangeProofIndex++;
        
        // Range proofs for sensitive attributes
        rangeProofs[rangeProofIndex] = RangeProof(1001);
        rangeProofs[rangeProofIndex].value <== sensitiveAttributes[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 1000;
        rangeProofIndex++;
        
        // Range proofs for generalized values
        rangeProofs[rangeProofIndex] = RangeProof(1001);
        rangeProofs[rangeProofIndex].value <== generalizedValues[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 1000;
        rangeProofIndex++;
        
        // Calculate attribute protection level
        var isSuppressed = suppressionFlags[i];
        var isGeneralized = (generalizedValues[i] != quasiIdentifiers[i]) ? 1 : 0;
        var isProtected = (isSuppressed || isGeneralized) ? 1 : 0;
        
        attributeProtection[i] <== isProtected;
        protectedAttributes += isProtected;
        totalSuppression += isSuppressed;
        totalGeneralization += isGeneralized;
    }
    
    suppressionCount <== totalSuppression;
    suppressionLevel <== (totalSuppression * 100) / maxAttributes;
    generalizationScore <== (totalGeneralization * 100) / maxAttributes;
    generalizationLevel <== generalizationScore;
    
    // Check L-diversity for sensitive attributes
    // L-diversity ensures that sensitive attributes have at least L distinct values
    var distinctSensitiveValues = 0;
    var sensitiveValueSum = 0;
    
    for (var i = 0; i < maxAttributes; i++) {
        if (sensitiveAttributes[i] > 0) {
            distinctSensitiveValues++;
            sensitiveValueSum += sensitiveAttributes[i];
        }
    }
    
    component diversityGTE = GreaterThanOrEqual(8);
    diversityGTE.in[0] <== distinctSensitiveValues;
    diversityGTE.in[1] <== diversityLevel;
    diversityCheck <== diversityGTE.out;
    diversityAchieved <== diversityCheck;
    
    // Calculate overall privacy level
    var basePrivacyScore = (groupSizeValid * 40);  // 40% for basic k-anonymity
    var attributePrivacyScore = (protectedAttributes * 30) / maxAttributes; // 30% for attribute protection
    var equivalenceScore = (equivalenceClassCheck * 20); // 20% for equivalence class
    var diversityScore = (diversityCheck * 10); // 10% for l-diversity
    
    privacyLevel <== basePrivacyScore + attributePrivacyScore + equivalenceScore + diversityScore;
    
    // Validate equivalence class
    equivalenceClassValid <== equivalenceClassCheck;
    
    // Overall k-anonymity check
    var basicKAnonymity = groupSizeValid;
    var equivalenceValid = equivalenceClassCheck;
    var minimumProtection = (protectedAttributes >= (maxAttributes / 2)) ? 1 : 0; // At least 50% attributes protected
    
    isKAnonymous <== basicKAnonymity * equivalenceValid * minimumProtection;
    
    // Constraint: Must achieve k-anonymity
    isKAnonymous === 1;
    
    // Constraint: Group size must be at least k
    groupSizeValid === 1;
    
    // Constraint: Equivalence class must be valid
    equivalenceClassValid === 1;
    
    // Additional range proofs for output validation
    rangeProofs[rangeProofIndex] = RangeProof(101);
    rangeProofs[rangeProofIndex].value <== privacyLevel;
    rangeProofs[rangeProofIndex].minValue <== 0;
    rangeProofs[rangeProofIndex].maxValue <== 100;
    rangeProofIndex++;
    
    rangeProofs[rangeProofIndex] = RangeProof(maxAttributes + 1);
    rangeProofs[rangeProofIndex].value <== suppressionCount;
    rangeProofs[rangeProofIndex].minValue <== 0;
    rangeProofs[rangeProofIndex].maxValue <== maxAttributes;
}

/*
    Advanced K-Anonymity with T-Closeness
    
    Extends basic k-anonymity with t-closeness to ensure that the distribution
    of sensitive attributes in any equivalence class is close to the distribution
    in the overall dataset.
*/
template KAnonymityWithTCloseness(maxGroupSize, maxAttributes, precision) {
    // Input signals
    signal input groupSize;
    signal input k;
    signal input t; // T-closeness parameter (scaled for precision)
    signal input sensitiveDistribution[maxAttributes]; // Global distribution
    signal input localDistribution[maxAttributes];     // Local equivalence class distribution
    signal input equivalenceClassSize;
    
    // Output signals
    signal output isKAnonymous;
    signal output isTClose;
    signal output privacyScore;
    signal output distributionDistance;
    
    // Basic k-anonymity check
    component kAnonymityCheck = KAnonymity(maxGroupSize, maxAttributes);
    kAnonymityCheck.groupSize <== groupSize;
    kAnonymityCheck.k <== k;
    for (var i = 0; i < maxAttributes; i++) {
        kAnonymityCheck.quasiIdentifiers[i] <== 0; // Simplified for t-closeness focus
        kAnonymityCheck.sensitiveAttributes[i] <== sensitiveDistribution[i];
        kAnonymityCheck.generalizedValues[i] <== 0;
        kAnonymityCheck.suppressionFlags[i] <== 0;
    }
    kAnonymityCheck.equivalenceClassSize <== equivalenceClassSize;
    kAnonymityCheck.diversityLevel <== 2;
    
    isKAnonymous <== kAnonymityCheck.isKAnonymous;
    
    // Calculate Earth Mover's Distance (EMD) between distributions
    var totalDistance = 0;
    for (var i = 0; i < maxAttributes; i++) {
        var diff = sensitiveDistribution[i] - localDistribution[i];
        var absDiff = (diff >= 0) ? diff : -diff;
        totalDistance += absDiff;
    }
    
    distributionDistance <== totalDistance;
    
    // Check if distance is within t-closeness threshold
    component tClosenessCheck = LessThanOrEqual(precision);
    tClosenessCheck.in[0] <== distributionDistance;
    tClosenessCheck.in[1] <== t;
    isTClose <== tClosenessCheck.out;
    
    // Calculate combined privacy score
    var kScore = isKAnonymous * 60; // 60% for k-anonymity
    var tScore = isTClose * 40;     // 40% for t-closeness
    privacyScore <== kScore + tScore;
    
    // Constraint: Must satisfy both k-anonymity and t-closeness
    var combinedValid = isKAnonymous * isTClose;
    combinedValid === 1;
}

/*
    Utility templates for k-anonymity operations
*/
template GreaterThanOrEqual(n) {
    signal input in[2];
    signal output out;
    
    component gt = GreaterThan(n);
    gt.in[0] <== in[0];
    gt.in[1] <== in[1] - 1;
    out <== gt.out;
}

template LessThanOrEqual(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0] + 1;
    lt.in[1] <== in[1] + 1;
    out <== lt.out;
}

template GreaterThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n + 1);
    lt.in[0] <== in[1] + 1;
    lt.in[1] <== in[0] + (1 << n);
    out <== lt.out;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component num2Bits = Num2Bits(n + 1);
    num2Bits.in <== in[0] + (1 << n) - in[1];
    out <== 1 - num2Bits.out[n];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1 = 0;
    var e2 = 1;
    
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
} 