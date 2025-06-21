pragma circom 2.0.0;

// Include core primitives
include "../primitives/merkle_tree.circom";
include "../primitives/range_proof.circom";
include "../primitives/hash_chain.circom";
include "../primitives/set_membership.circom";

/*
 * RepoAggregator - Aggregate contributions across multiple repositories
 * 
 * This circuit proves:
 * 1. Total commits across repositories (with privacy ranges)
 * 2. Total LOC across repositories (with privacy ranges) 
 * 3. Repository diversity score (unique repos)
 * 4. Temporal consistency across repositories
 * 5. Non-ownership proof (user is not owner of all repos)
 */
template RepoAggregator(MAX_REPOS) {
    // Input signals
    signal input repoHashes[MAX_REPOS];           // Hashed repository identifiers
    signal input commitCounts[MAX_REPOS];         // Commit counts per repo
    signal input locCounts[MAX_REPOS];            // LOC counts per repo
    signal input timeRanges[MAX_REPOS][2];        // [start_timestamp, end_timestamp] per repo
    signal input ownershipFlags[MAX_REPOS];       // 1 if user owns repo, 0 otherwise
    signal input collaboratorCounts[MAX_REPOS];   // Number of collaborators per repo
    signal input minCommitThreshold;              // Minimum commits to count as active repo
    signal input privacyK;                        // K-anonymity parameter
    
    // Output signals
    signal output aggregatedCommits;              // Total commits (privacy range)
    signal output aggregatedLOC;                  // Total LOC (privacy range)  
    signal output diversityScore;                 // Repository diversity measure
    signal output consistencyScore;               // Temporal consistency measure
    signal output nonOwnershipProof;              // Proof user doesn't own all repos
    signal output collaborationProof;             // Proof of meaningful collaboration
    
    // Internal signals
    signal activeRepos[MAX_REPOS];                // 1 if repo meets threshold, 0 otherwise
    signal diversityContrib[MAX_REPOS];           // Diversity contribution per repo
    signal consistencyContrib[MAX_REPOS];         // Consistency contribution per repo
    signal validCollaboration[MAX_REPOS];         // 1 if repo has k+ collaborators
    
    // Components for aggregation
    component commitSum = SumWithThreshold(MAX_REPOS);
    component locSum = SumWithThreshold(MAX_REPOS);
    component diversityCalc = DiversityCalculator(MAX_REPOS);
    component consistencyCalc = ConsistencyAnalyzer(MAX_REPOS);
    component ownershipChecker = NonOwnershipVerifier(MAX_REPOS);
    component collaborationChecker = CollaborationVerifier(MAX_REPOS);
    
    // Range proof components for privacy
    component commitRangeProof = RangeProof(32); // 32-bit range
    component locRangeProof = RangeProof(32);
    
    // Merkle tree for repository membership proofs
    component repoMerkle = MerkleTree(MAX_REPOS);
    
    // Calculate active repositories (meet minimum commit threshold)
    for (var i = 0; i < MAX_REPOS; i++) {
        component thresholdCheck = GreaterEqualThan(16);
        thresholdCheck.in[0] <== commitCounts[i];
        thresholdCheck.in[1] <== minCommitThreshold;
        activeRepos[i] <== thresholdCheck.out;
    }
    
    // Aggregate commits with threshold filtering
    for (var i = 0; i < MAX_REPOS; i++) {
        commitSum.values[i] <== commitCounts[i];
        commitSum.activeFlags[i] <== activeRepos[i];
    }
    
    // Aggregate LOC with threshold filtering
    for (var i = 0; i < MAX_REPOS; i++) {
        locSum.values[i] <== locCounts[i];
        locSum.activeFlags[i] <== activeRepos[i];
    }
    
    // Apply privacy ranges to aggregated values
    commitRangeProof.value <== commitSum.total;
    commitRangeProof.minRange <== 0;
    commitRangeProof.maxRange <== 1000000; // Max reasonable commits
    aggregatedCommits <== commitRangeProof.rangeValue;
    
    locRangeProof.value <== locSum.total;
    locRangeProof.minRange <== 0;
    locRangeProof.maxRange <== 10000000; // Max reasonable LOC
    aggregatedLOC <== locRangeProof.rangeValue;
    
    // Calculate repository diversity score
    for (var i = 0; i < MAX_REPOS; i++) {
        diversityCalc.repoHashes[i] <== repoHashes[i];
        diversityCalc.activeFlags[i] <== activeRepos[i];
    }
    diversityScore <== diversityCalc.score;
    
    // Calculate temporal consistency across repositories
    for (var i = 0; i < MAX_REPOS; i++) {
        consistencyCalc.startTimes[i] <== timeRanges[i][0];
        consistencyCalc.endTimes[i] <== timeRanges[i][1];
        consistencyCalc.commitCounts[i] <== commitCounts[i];
        consistencyCalc.activeFlags[i] <== activeRepos[i];
    }
    consistencyScore <== consistencyCalc.score;
    
    // Verify non-ownership (user doesn't own all active repositories)
    for (var i = 0; i < MAX_REPOS; i++) {
        ownershipChecker.ownershipFlags[i] <== ownershipFlags[i];
        ownershipChecker.activeFlags[i] <== activeRepos[i];
    }
    nonOwnershipProof <== ownershipChecker.isNonOwner;
    
    // Verify meaningful collaboration (repos have k+ collaborators)
    for (var i = 0; i < MAX_REPOS; i++) {
        component kAnonCheck = GreaterEqualThan(8);
        kAnonCheck.in[0] <== collaboratorCounts[i];
        kAnonCheck.in[1] <== privacyK;
        validCollaboration[i] <== kAnonCheck.out;
        
        collaborationChecker.collaboratorCounts[i] <== collaboratorCounts[i];
        collaborationChecker.activeFlags[i] <== activeRepos[i];
        collaborationChecker.validFlags[i] <== validCollaboration[i];
    }
    collaborationProof <== collaborationChecker.hasCollaboration;
    
    // Build Merkle tree of repository hashes for membership proofs
    for (var i = 0; i < MAX_REPOS; i++) {
        repoMerkle.leaves[i] <== repoHashes[i];
    }
    
    // Constraint: At least one repository must be active
    component hasActiveRepo = OR(MAX_REPOS);
    for (var i = 0; i < MAX_REPOS; i++) {
        hasActiveRepo.in[i] <== activeRepos[i];
    }
    hasActiveRepo.out === 1;
    
    // Constraint: Diversity score must be reasonable (0-100 scale)
    component diversityRange = RangeProof(8);
    diversityRange.value <== diversityScore;
    diversityRange.minRange <== 0;
    diversityRange.maxRange <== 100;
    diversityRange.isValid === 1;
    
    // Constraint: Consistency score must be reasonable (0-100 scale)
    component consistencyRange = RangeProof(8);
    consistencyRange.value <== consistencyScore;
    consistencyRange.minRange <== 0;
    consistencyRange.maxRange <== 100;
    consistencyRange.isValid === 1;
}

/*
 * Helper template: Sum values with threshold filtering
 */
template SumWithThreshold(N) {
    signal input values[N];
    signal input activeFlags[N];
    signal output total;
    
    component sum = Sum(N);
    for (var i = 0; i < N; i++) {
        sum.values[i] <== values[i] * activeFlags[i];
    }
    total <== sum.out;
}

/*
 * Helper template: Calculate repository diversity
 */
template DiversityCalculator(N) {
    signal input repoHashes[N];
    signal input activeFlags[N];
    signal output score;
    
    // Count unique active repositories
    signal uniqueCount;
    component uniqueCounter = CountUnique(N);
    for (var i = 0; i < N; i++) {
        uniqueCounter.values[i] <== repoHashes[i];
        uniqueCounter.activeFlags[i] <== activeFlags[i];
    }
    uniqueCount <== uniqueCounter.count;
    
    // Calculate diversity score (0-100 scale)
    component diversityCalc = Multiplier();
    diversityCalc.in[0] <== uniqueCount;
    diversityCalc.in[1] <== 100;
    
    component activeTotal = Sum(N);
    for (var i = 0; i < N; i++) {
        activeTotal.values[i] <== activeFlags[i];
    }
    
    component divider = SafeDivision();
    divider.dividend <== diversityCalc.out;
    divider.divisor <== activeTotal.out;
    score <== divider.quotient;
}

/*
 * Helper template: Analyze temporal consistency
 */
template ConsistencyAnalyzer(N) {
    signal input startTimes[N];
    signal input endTimes[N];
    signal input commitCounts[N];
    signal input activeFlags[N];
    signal output score;
    
    // Calculate activity periods and overlaps
    signal activitySpans[N];
    signal weightedConsistency;
    
    component consistencyCalc = TemporalConsistency(N);
    for (var i = 0; i < N; i++) {
        consistencyCalc.startTimes[i] <== startTimes[i];
        consistencyCalc.endTimes[i] <== endTimes[i];
        consistencyCalc.commitCounts[i] <== commitCounts[i];
        consistencyCalc.activeFlags[i] <== activeFlags[i];
    }
    score <== consistencyCalc.consistencyIndex;
}

/*
 * Helper template: Verify non-ownership
 */
template NonOwnershipVerifier(N) {
    signal input ownershipFlags[N];
    signal input activeFlags[N];
    signal output isNonOwner;
    
    // Count owned active repositories
    signal ownedCount;
    component ownedCounter = Sum(N);
    for (var i = 0; i < N; i++) {
        ownedCounter.values[i] <== ownershipFlags[i] * activeFlags[i];
    }
    ownedCount <== ownedCounter.out;
    
    // Count total active repositories
    signal activeCount;
    component activeCounter = Sum(N);
    for (var i = 0; i < N; i++) {
        activeCounter.values[i] <== activeFlags[i];
    }
    activeCount <== activeCounter.out;
    
    // Verify user doesn't own ALL active repositories
    component notAllOwned = LessThan(8);
    notAllOwned.in[0] <== ownedCount;
    notAllOwned.in[1] <== activeCount;
    isNonOwner <== notAllOwned.out;
}

/*
 * Helper template: Verify meaningful collaboration
 */
template CollaborationVerifier(N) {
    signal input collaboratorCounts[N];
    signal input activeFlags[N];
    signal input validFlags[N];
    signal output hasCollaboration;
    
    // Count repositories with meaningful collaboration
    signal collaborativeCount;
    component collabCounter = Sum(N);
    for (var i = 0; i < N; i++) {
        collabCounter.values[i] <== validFlags[i] * activeFlags[i];
    }
    collaborativeCount <== collabCounter.out;
    
    // Require at least one repository with meaningful collaboration
    component hasCollab = GreaterThan(8);
    hasCollab.in[0] <== collaborativeCount;
    hasCollab.in[1] <== 0;
    hasCollaboration <== hasCollab.out;
} 