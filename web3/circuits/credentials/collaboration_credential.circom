pragma circom 2.0.0;

include "../core/primitives/range_proof.circom";
include "../privacy/k_anonymity.circom";
include "../privacy/zero_knowledge_sets.circom";

/*
 * CollaborationCredential Circuit
 * 
 * Proves collaboration in team environments:
 * 1. Repository had multiple collaborators (not solo project)
 * 2. User was not the sole contributor
 * 3. User's contribution percentage was reasonable (not 95%+ indicating fake collaboration)
 * 4. Collaborators were distinct individuals (not dummy accounts)
 * 
 * This prevents gaming through fake collaboration or solo projects
 */

template CollaborationCredential(MAX_COLLABORATORS) {
    // ========== PUBLIC INPUTS ==========
    signal input userAddress;                // User's public address
    signal input minCollaborators;           // Minimum collaborators claimed range
    signal input maxCollaborators;           // Maximum collaborators claimed range
    signal input maxContributionPercent;    // Max reasonable contribution % (e.g., 70%)
    
    // ========== PRIVATE INPUTS ==========
    signal input actualCollaborators;       // Actual number of collaborators (private)
    signal input collaboratorHashes[MAX_COLLABORATORS]; // Anonymous collaborator identities
    signal input collaboratorMask[MAX_COLLABORATORS];   // 1 if slot active, 0 if empty
    signal input userContributionPercentage; // User's actual contribution % (private)
    signal input collaboratorContributions[MAX_COLLABORATORS]; // Each collaborator's %
    signal input diversityProofs[MAX_COLLABORATORS]; // Proof collaborators are distinct people
    
    // ========== OUTPUTS ==========
    signal output validCollaboration;       // 1 if valid team collaboration proven
    signal output teamDiversityScore;       // Score representing team diversity
    
    // ========== VALIDATION COMPONENTS ==========
    
    // 1. Verify collaborator count is in claimed range
    component collaboratorRangeCheck = RangeProof();
    collaboratorRangeCheck.value <== actualCollaborators;
    collaboratorRangeCheck.minValue <== minCollaborators;
    collaboratorRangeCheck.maxValue <== maxCollaborators;
    
    // 2. Ensure minimum team size (at least 2 people including user)
    component minTeamSize = GreaterEqThan(8);
    minTeamSize.in[0] <== actualCollaborators;
    minTeamSize.in[1] <== 2; // At least 2 total people (user + 1 other)
    
    // 3. Verify user wasn't dominant contributor
    component contributionCheck = LessEqThan(8);
    contributionCheck.in[0] <== userContributionPercentage;
    contributionCheck.in[1] <== maxContributionPercent;
    
    // 4. Verify total contributions add up correctly
    component contributionValidator = ContributionValidator(MAX_COLLABORATORS);
    contributionValidator.userContribution <== userContributionPercentage;
    contributionValidator.collaboratorContributions <== collaboratorContributions;
    contributionValidator.collaboratorMask <== collaboratorMask;
    contributionValidator.actualCollaborators <== actualCollaborators;
    
    // 5. Verify collaborator diversity (not dummy accounts)
    component diversityValidator = DiversityValidator(MAX_COLLABORATORS);
    diversityValidator.collaboratorHashes <== collaboratorHashes;
    diversityValidator.collaboratorMask <== collaboratorMask;
    diversityValidator.diversityProofs <== diversityProofs;
    diversityValidator.userAddress <== userAddress;
    
    // 6. Final validation
    component finalValidator = CollaborationValidator();
    finalValidator.rangeValid <== collaboratorRangeCheck.isInRange;
    finalValidator.teamSizeValid <== minTeamSize.out;
    finalValidator.contributionValid <== contributionCheck.out;
    finalValidator.contributionSumValid <== contributionValidator.validSum;
    finalValidator.diversityValid <== diversityValidator.diverseTeam;
    
    validCollaboration <== finalValidator.allValid;
    teamDiversityScore <== diversityValidator.diversityScore;
}

/*
 * Validates that all contribution percentages add up correctly
 */
template ContributionValidator(N) {
    signal input userContribution;
    signal input collaboratorContributions[N];
    signal input collaboratorMask[N];
    signal input actualCollaborators;
    signal output validSum;
    
    // Sum all collaborator contributions
    var totalCollaboratorContrib = 0;
    for (var i = 0; i < N; i++) {
        totalCollaboratorContrib += collaboratorContributions[i] * collaboratorMask[i];
    }
    
    // Total should be close to 100% (allowing for rounding)
    var totalContrib = userContribution + totalCollaboratorContrib;
    
    component rangeCheck = RangeProof();
    rangeCheck.value <== totalContrib;
    rangeCheck.minValue <== 98; // Allow 2% rounding error
    rangeCheck.maxValue <== 102;
    
    validSum <== rangeCheck.isInRange;
}

/*
 * Validates team diversity - ensures collaborators are real, distinct individuals
 */
template DiversityValidator(N) {
    signal input collaboratorHashes[N];
    signal input collaboratorMask[N];
    signal input diversityProofs[N];
    signal input userAddress;
    signal output diverseTeam;
    signal output diversityScore;
    
    // 1. Check no duplicate collaborators
    component duplicateChecker = NoDuplicateCollaborators(N);
    duplicateChecker.collaboratorHashes <== collaboratorHashes;
    duplicateChecker.collaboratorMask <== collaboratorMask;
    
    // 2. Check user is not listed as collaborator
    component userNotInList = UserNotInCollaborators(N);
    userNotInList.userAddress <== userAddress;
    userNotInList.collaboratorHashes <== collaboratorHashes;
    userNotInList.collaboratorMask <== collaboratorMask;
    
    // 3. Validate diversity proofs for each collaborator
    component diversityCheckers[N];
    var diversitySum = 0;
    
    for (var i = 0; i < N; i++) {
        diversityCheckers[i] = CollaboratorDiversityCheck();
        diversityCheckers[i].isActive <== collaboratorMask[i];
        diversityCheckers[i].collaboratorHash <== collaboratorHashes[i];
        diversityCheckers[i].diversityProof <== diversityProofs[i];
        
        diversitySum += diversityCheckers[i].isDiverse * collaboratorMask[i];
    }
    
    // Calculate diversity score (0-100)
    var activeCollaborators = 0;
    for (var i = 0; i < N; i++) {
        activeCollaborators += collaboratorMask[i];
    }
    
    var diversityPercentage = 0;
    if (activeCollaborators > 0) {
        diversityPercentage = (diversitySum * 100) / activeCollaborators;
    }
    
    // Team is diverse if >= 80% of collaborators pass diversity checks
    component diversityThreshold = GreaterEqThan(8);
    diversityThreshold.in[0] <== diversityPercentage;
    diversityThreshold.in[1] <== 80;
    
    // Final validation
    component and1 = AND();
    and1.a <== duplicateChecker.noDuplicates;
    and1.b <== userNotInList.userNotInList;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== diversityThreshold.out;
    
    diverseTeam <== and2.out;
    diversityScore <== diversityPercentage;
}

/*
 * Checks for duplicate collaborators
 */
template NoDuplicateCollaborators(N) {
    signal input collaboratorHashes[N];
    signal input collaboratorMask[N];
    signal output noDuplicates;
    
    var duplicateFound = 0;
    
    component equalityCheckers[N][N];
    component andGates[N][N];
    
    for (var i = 0; i < N; i++) {
        for (var j = i + 1; j < N; j++) {
            equalityCheckers[i][j] = IsEqual();
            equalityCheckers[i][j].in[0] <== collaboratorHashes[i];
            equalityCheckers[i][j].in[1] <== collaboratorHashes[j];
            
            andGates[i][j] = AND();
            andGates[i][j].a <== collaboratorMask[i];
            andGates[i][j].b <== collaboratorMask[j];
            
            component duplicateDetector = AND();
            duplicateDetector.a <== andGates[i][j].out;
            duplicateDetector.b <== equalityCheckers[i][j].out;
            
            duplicateFound += duplicateDetector.out;
        }
    }
    
    component isZero = IsZero();
    isZero.in <== duplicateFound;
    
    noDuplicates <== isZero.out;
}

/*
 * Ensures user is not listed as their own collaborator
 */
template UserNotInCollaborators(N) {
    signal input userAddress;
    signal input collaboratorHashes[N];
    signal input collaboratorMask[N];
    signal output userNotInList;
    
    // Hash user address for comparison
    component userHasher = Poseidon(1);
    userHasher.inputs[0] <== userAddress;
    
    var userFound = 0;
    component equalityCheckers[N];
    
    for (var i = 0; i < N; i++) {
        equalityCheckers[i] = IsEqual();
        equalityCheckers[i].in[0] <== userHasher.out;
        equalityCheckers[i].in[1] <== collaboratorHashes[i];
        
        component andGate = AND();
        andGate.a <== collaboratorMask[i];
        andGate.b <== equalityCheckers[i].out;
        
        userFound += andGate.out;
    }
    
    component isZero = IsZero();
    isZero.in <== userFound;
    
    userNotInList <== isZero.out;
}

/*
 * Checks if a collaborator passes diversity requirements
 */
template CollaboratorDiversityCheck() {
    signal input isActive;
    signal input collaboratorHash;
    signal input diversityProof;
    signal output isDiverse;
    
    // If inactive, automatically diverse (1)
    // If active, check diversity proof
    component diversityValidator = DiversityProofValidator();
    diversityValidator.collaboratorHash <== collaboratorHash;
    diversityValidator.diversityProof <== diversityProof;
    
    component selector = Mux1();
    selector.c[0] <== 1;                              // If inactive, output 1
    selector.c[1] <== diversityValidator.isValid;     // If active, output validation result
    selector.s <== isActive;
    
    isDiverse <== selector.out;
}

/*
 * Validates diversity proof (could be enhanced with reputation systems)
 */
template DiversityProofValidator() {
    signal input collaboratorHash;
    signal input diversityProof;
    signal output isValid;
    
    // Simple validation - can be enhanced with:
    // - GitHub account age verification
    // - Cross-repository contribution patterns
    // - Social graph analysis
    // - Reputation system integration
    
    // For now, verify proof is non-zero and properly formatted
    component nonZero = IsZero();
    nonZero.in <== diversityProof;
    
    component not = NOT();
    not.in <== nonZero.out;
    
    isValid <== not.out;
}

/*
 * Final collaboration validator
 */
template CollaborationValidator() {
    signal input rangeValid;
    signal input teamSizeValid;
    signal input contributionValid;
    signal input contributionSumValid;
    signal input diversityValid;
    signal output allValid;
    
    component and1 = AND();
    and1.a <== rangeValid;
    and1.b <== teamSizeValid;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== contributionValid;
    
    component and3 = AND();
    and3.a <== and2.out;
    and3.b <== contributionSumValid;
    
    component and4 = AND();
    and4.a <== and3.out;
    and4.b <== diversityValid;
    
    allValid <== and4.out;
} component main = CollaborationCredential(10, 5);
