pragma circom 2.0.0;

/*
 * Merkle Tree Verifier Circuit
 * 
 * Verifies that a leaf is part of a Merkle tree with a given root
 * Used for proving commit membership in repositories
 */

template MerkleTreeVerifier(levels) {
    signal input leaf;                    // The leaf to verify
    signal input root;                    // Expected Merkle tree root
    signal input pathElements[levels];    // Sibling hashes along the path
    signal input pathIndices[levels];     // Direction at each level (0 = left, 1 = right)
    
    signal output isValid;                // 1 if leaf is in tree, 0 otherwise
    
    component hashers[levels];
    component selectors[levels][2];
    
    // Start with the leaf
    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;
    
    // Hash up the tree level by level
    for (var i = 0; i < levels; i++) {
        // Select correct order based on path index
        selectors[i][0] = Mux1();
        selectors[i][0].c[0] <== levelHashes[i];      // If pathIndices[i] == 0, current hash goes left
        selectors[i][0].c[1] <== pathElements[i];     // If pathIndices[i] == 1, current hash goes right
        selectors[i][0].s <== pathIndices[i];
        
        selectors[i][1] = Mux1();
        selectors[i][1].c[0] <== pathElements[i];     // If pathIndices[i] == 0, sibling goes right
        selectors[i][1].c[1] <== levelHashes[i];      // If pathIndices[i] == 1, sibling goes left
        selectors[i][1].s <== pathIndices[i];
        
        // Hash the ordered pair
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i][0].out;
        hashers[i].inputs[1] <== selectors[i][1].out;
        
        levelHashes[i + 1] <== hashers[i].out;
    }
    
    // Check if computed root matches expected root
    component rootChecker = IsEqual();
    rootChecker.in[0] <== levelHashes[levels];
    rootChecker.in[1] <== root;
    
    isValid <== rootChecker.out;
}

/*
 * Merkle Tree Multi-Proof Verifier
 * 
 * Efficiently verifies multiple leaves belong to the same tree
 * Useful for proving multiple commits from the same repository
 */
template MerkleTreeMultiVerifier(levels, numLeaves) {
    signal input leaves[numLeaves];                    // Multiple leaves to verify
    signal input root;                                 // Expected Merkle tree root
    signal input pathElements[numLeaves][levels];      // Sibling hashes for each leaf
    signal input pathIndices[numLeaves][levels];       // Directions for each leaf
    
    signal output allValid;                            // 1 if all leaves are in tree
    
    component verifiers[numLeaves];
    
    // Verify each leaf independently
    for (var i = 0; i < numLeaves; i++) {
        verifiers[i] = MerkleTreeVerifier(levels);
        verifiers[i].leaf <== leaves[i];
        verifiers[i].root <== root;
        
        for (var j = 0; j < levels; j++) {
            verifiers[i].pathElements[j] <== pathElements[i][j];
            verifiers[i].pathIndices[j] <== pathIndices[i][j];
        }
    }
    
    // All proofs must be valid
    var allProofsValid = 1;
    for (var i = 0; i < numLeaves; i++) {
        allProofsValid *= verifiers[i].isValid;
    }
    
    allValid <== allProofsValid;
}

/*
 * Merkle Tree Existence Proof
 * 
 * Proves a value exists in a set represented as a Merkle tree
 * Used for proving programming language usage or collaborator membership
 */
template MerkleExistenceProof(levels) {
    signal input value;                   // Value to prove exists
    signal input setRoot;                 // Root of the set's Merkle tree
    signal input pathElements[levels];    // Merkle proof path
    signal input pathIndices[levels];     // Path directions
    
    signal output exists;                 // 1 if value exists in set
    
    // Hash the value to get leaf
    component valueHasher = Poseidon(1);
    valueHasher.inputs[0] <== value;
    
    // Verify the hashed value is in the tree
    component verifier = MerkleTreeVerifier(levels);
    verifier.leaf <== valueHasher.out;
    verifier.root <== setRoot;
    verifier.pathElements <== pathElements;
    verifier.pathIndices <== pathIndices;
    
    exists <== verifier.isValid;
}

/*
 * Merkle Tree Non-Membership Proof
 * 
 * Proves a value does NOT exist in a set
 * Used for proving user is not the repository owner
 */
template MerkleNonMembershipProof(levels) {
    signal input value;                   // Value to prove doesn't exist
    signal input setRoot;                 // Root of the set's Merkle tree
    signal input pathElements[levels];    // Merkle proof to closest leaf
    signal input pathIndices[levels];     // Path directions
    signal input closestLeaf;             // The leaf that would be closest to value
    
    signal output doesNotExist;           // 1 if value definitely not in set
    
    // Hash the value
    component valueHasher = Poseidon(1);
    valueHasher.inputs[0] <== value;
    
    // Verify the closest leaf is indeed in the tree
    component verifier = MerkleTreeVerifier(levels);
    verifier.leaf <== closestLeaf;
    verifier.root <== setRoot;
    verifier.pathElements <== pathElements;
    verifier.pathIndices <== pathIndices;
    
    // Verify the value is different from the closest leaf
    component notEqual = IsEqual();
    notEqual.in[0] <== valueHasher.out;
    notEqual.in[1] <== closestLeaf;
    
    component not = NOT();
    not.in <== notEqual.out;
    
    // Both conditions must be true
    component and = AND();
    and.a <== verifier.isValid;
    and.b <== not.out;
    
    doesNotExist <== and.out;
} 