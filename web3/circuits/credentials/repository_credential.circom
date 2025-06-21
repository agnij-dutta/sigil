pragma circom 2.0.0;

include "../core/primitives/merkle_tree.circom";
include "../core/primitives/range_proof.circom";
include "../core/primitives/set_membership.circom";
include "../core/primitives/signature_verify.circom";
include "./language_credential.circom";
include "./collaboration_credential.circom";

/*
 * RepositoryCredential Circuit
 * 
 * Comprehensive circuit that proves commits belong to a specific repository, user contributed X commits, LOC range, languages used, collaboration proof, and non-ownership - all the requirements we discussed.
 * 
 * This circuit maintains complete privacy while proving all claims
 */

template RepositoryCredential(MAX_COMMITS, MAX_LANGUAGES, MAX_COLLABORATORS) {
    // ========== PUBLIC INPUTS (visible to verifiers) ==========
    signal input repoHash;                    // Hashed repository identifier
    signal input userAddressPublic;          // User's Ethereum address
    signal input minCommits;                  // Minimum commits claimed range
    signal input maxCommits;                  // Maximum commits claimed range
    signal input minLOC;                      // Minimum LOC range
    signal input maxLOC;                      // Maximum LOC range
    signal input languageCount;               // Number of languages used
    signal input minCollaborators;            // Minimum collaborators range
    signal input maxCollaborators;            // Maximum collaborators range
    signal input proofTimestamp;              // When proof was generated

    // ========== PRIVATE INPUTS (hidden from verifiers) ==========
    signal input actualCommits;               // Actual number of commits (private)
    signal input commitHashes[MAX_COMMITS];   // User's commit hashes in this repo
    signal input commitMerkleProofs[MAX_COMMITS][32]; // Merkle proofs for each commit
    signal input repoMerkleRoot;              // Repository's commit Merkle tree root
    
    signal input actualLOC;                   // Actual total LOC (private)
    signal input locPerCommit[MAX_COMMITS];   // LOC per commit (private)
    
    signal input languageHashes[MAX_LANGUAGES];  // Languages used (hashed)
    signal input languageUsageProofs[MAX_LANGUAGES]; // Proof of actual usage
    signal input languageMask[MAX_LANGUAGES];    // 1 if language used, 0 if not
    
    signal input actualCollaborators;         // Actual collaborator count (private)
    signal input collaboratorHashes[MAX_COLLABORATORS]; // Anonymous collaborator IDs
    signal input collaboratorMask[MAX_COLLABORATORS];   // 1 if active, 0 if not
    signal input userContributionPercentage;  // User's % of total contributions
    
    signal input repoOwnerHash;               // Repository owner's hashed identity
    signal input ownershipProof;              // Proof of ownership status
    signal input userPrivateKey;              // User's private key for signature

    // ========== OUTPUTS ==========
    signal output isValidCredential;          // 1 if all proofs valid
    signal output credentialHash;             // Unique credential identifier

    // ========== COMPONENTS ==========
    
    // 1. COMMIT MEMBERSHIP PROOFS
    component commitMembershipVerifiers[MAX_COMMITS];
    component commitCounter = CommitCounter(MAX_COMMITS);
    
    for (var i = 0; i < MAX_COMMITS; i++) {
        commitMembershipVerifiers[i] = MerkleTreeVerifier(32);
        commitMembershipVerifiers[i].leaf <== commitHashes[i];
        commitMembershipVerifiers[i].root <== repoMerkleRoot;
        for (var j = 0; j < 32; j++) {
            commitMembershipVerifiers[i].pathElements[j] <== commitMerkleProofs[i][j];
        }
    }
    
    // Count actual commits and verify against claimed range
    commitCounter.commitHashes <== commitHashes;
    commitCounter.actualCount <== actualCommits;
    
    component commitRangeCheck = RangeProof();
    commitRangeCheck.value <== actualCommits;
    commitRangeCheck.minValue <== minCommits;
    commitRangeCheck.maxValue <== maxCommits;

    // 2. LOC RANGE PROOFS
    component locAggregator = LOCAggregator(MAX_COMMITS);
    locAggregator.locPerCommit <== locPerCommit;
    locAggregator.actualTotal <== actualLOC;
    
    component locRangeCheck = RangeProof();
    locRangeCheck.value <== actualLOC;
    locRangeCheck.minValue <== minLOC;
    locRangeCheck.maxValue <== maxLOC;

    // 3. DYNAMIC LANGUAGE PROOFS
    component languageCredential = DynamicLanguageCredential(MAX_LANGUAGES);
    languageCredential.languageCount <== languageCount;
    languageCredential.languageHashes <== languageHashes;
    languageCredential.usageProofs <== languageUsageProofs;
    languageCredential.languageMask <== languageMask;

    // 4. COLLABORATION PROOFS
    component collaborationCredential = CollaborationCredential(MAX_COLLABORATORS);
    collaborationCredential.userAddress <== userAddressPublic;
    collaborationCredential.actualCollaborators <== actualCollaborators;
    collaborationCredential.minCollaborators <== minCollaborators;
    collaborationCredential.maxCollaborators <== maxCollaborators;
    collaborationCredential.collaboratorHashes <== collaboratorHashes;
    collaborationCredential.collaboratorMask <== collaboratorMask;
    collaborationCredential.userContributionPercentage <== userContributionPercentage;

    // 5. NON-OWNERSHIP PROOF
    component nonOwnershipProof = NonOwnershipProof();
    nonOwnershipProof.userAddressPublic <== userAddressPublic;
    nonOwnershipProof.repoOwnerHash <== repoOwnerHash;
    nonOwnershipProof.ownershipProof <== ownershipProof;

    // 6. SIGNATURE VERIFICATION
    component signatureVerifier = ECDSAVerifier();
    signatureVerifier.message <== repoHash;
    signatureVerifier.privateKey <== userPrivateKey;
    signatureVerifier.expectedAddress <== userAddressPublic;

    // ========== FINAL VALIDATION ==========
    component finalValidator = ComprehensiveValidator();
    finalValidator.commitProofValid <== commitRangeCheck.isInRange;
    finalValidator.locProofValid <== locRangeCheck.isInRange;
    finalValidator.languageProofValid <== languageCredential.allLanguagesProven;
    finalValidator.collaborationProofValid <== collaborationCredential.validCollaboration;
    finalValidator.nonOwnershipProofValid <== nonOwnershipProof.isNotOwner;
    finalValidator.signatureValid <== signatureVerifier.isValid;
    
    isValidCredential <== finalValidator.allValid;

    // Generate unique credential hash
    component hasher = Poseidon(8);
    hasher.inputs[0] <== repoHash;
    hasher.inputs[1] <== userAddressPublic;
    hasher.inputs[2] <== actualCommits;
    hasher.inputs[3] <== actualLOC;
    hasher.inputs[4] <== languageCount;
    hasher.inputs[5] <== actualCollaborators;
    hasher.inputs[6] <== userContributionPercentage;
    hasher.inputs[7] <== proofTimestamp;
    
    credentialHash <== hasher.out;
}

/*
 * Helper template for counting actual commits
 */
template CommitCounter(N) {
    signal input commitHashes[N];
    signal input actualCount;
    signal output validCount;
    
    var count = 0;
    for (var i = 0; i < N; i++) {
        // Count non-zero commit hashes
        if (commitHashes[i] != 0) {
            count++;
        }
    }
    
    component isEqual = IsEqual();
    isEqual.in[0] <== count;
    isEqual.in[1] <== actualCount;
    
    validCount <== isEqual.out;
}

/*
 * Helper template for aggregating LOC across commits
 */
template LOCAggregator(N) {
    signal input locPerCommit[N];
    signal input actualTotal;
    signal output validTotal;
    
    var total = 0;
    for (var i = 0; i < N; i++) {
        total += locPerCommit[i];
    }
    
    component isEqual = IsEqual();
    isEqual.in[0] <== total;
    isEqual.in[1] <== actualTotal;
    
    validTotal <== isEqual.out;
}

/*
 * Comprehensive validator that combines all proof results
 */
template ComprehensiveValidator() {
    signal input commitProofValid;
    signal input locProofValid;
    signal input languageProofValid;
    signal input collaborationProofValid;
    signal input nonOwnershipProofValid;
    signal input signatureValid;
    
    signal output allValid;
    
    component and1 = AND();
    and1.a <== commitProofValid;
    and1.b <== locProofValid;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== languageProofValid;
    
    component and3 = AND();
    and3.a <== and2.out;
    and3.b <== collaborationProofValid;
    
    component and4 = AND();
    and4.a <== and3.out;
    and4.b <== nonOwnershipProofValid;
    
    component and5 = AND();
    and5.a <== and4.out;
    and5.b <== signatureValid;
    
    allValid <== and5.out;
}

/*
 * Non-ownership proof template
 */
template NonOwnershipProof() {
    signal input userAddressPublic;
    signal input repoOwnerHash;
    signal input ownershipProof;
    
    signal output isNotOwner;
    
    // Hash user address to compare with owner hash
    component userHasher = Poseidon(1);
    userHasher.inputs[0] <== userAddressPublic;
    
    // Verify user hash != owner hash
    component isEqual = IsEqual();
    isEqual.in[0] <== userHasher.out;
    isEqual.in[1] <== repoOwnerHash;
    
    component not = NOT();
    not.in <== isEqual.out;
    
    isNotOwner <== not.out;
}

// Main component - parameterized for different repository sizes
component main = RepositoryCredential(100, 20, 50);
