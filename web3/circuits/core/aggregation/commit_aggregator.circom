pragma circom 2.0.0;

include "../primitives/merkle_tree.circom";
include "../primitives/range_proof.circom";

/*
 * CommitAggregator combines multiple commit proofs into aggregate statistics
 * Proves total commits and LOC ranges across multiple repositories
 */
template CommitAggregator(maxCommits, maxRepos) {
    // Inputs: Array of commit counts per repository
    signal input commitCounts[maxRepos];
    signal input repositoryHashes[maxRepos];
    signal input validRepos; // Number of valid repositories
    
    // Outputs: Aggregated statistics
    signal output totalCommits;
    signal output repoCount;
    signal output aggregateHash;
    
    // Internal signals
    signal runningSum[maxRepos + 1];
    signal validRepoCount[maxRepos + 1];
    
    // Initialize
    runningSum[0] <== 0;
    validRepoCount[0] <== 0;
    
    // Aggregate commit counts and count valid repos
    component isPositive[maxRepos];
    for (var i = 0; i < maxRepos; i++) {
        isPositive[i] = GreaterThan(32);
        isPositive[i].in[0] <== commitCounts[i];
        isPositive[i].in[1] <== 0;
        
        runningSum[i + 1] <== runningSum[i] + commitCounts[i];
        validRepoCount[i + 1] <== validRepoCount[i] + isPositive[i].out;
    }
    
    totalCommits <== runningSum[maxRepos];
    repoCount <== validRepoCount[maxRepos];
    
    // Verify repo count matches claimed valid repos
    component countCheck = IsEqual();
    countCheck.in[0] <== repoCount;
    countCheck.in[1] <== validRepos;
    countCheck.out === 1;
    
    // Create aggregate hash of all repository hashes
    component hasher = Poseidon(maxRepos);
    for (var i = 0; i < maxRepos; i++) {
        hasher.inputs[i] <== repositoryHashes[i];
    }
    aggregateHash <== hasher.out;
    
    // Range check: total commits should be reasonable
    component rangeCheck = RangeProof(32);
    rangeCheck.value <== totalCommits;
    rangeCheck.minValue <== 1;
    rangeCheck.maxValue <== 1000000; // Max 1M commits total
    rangeCheck.isInRange === 1;
}

/*
 * LOCAggregator aggregates Lines of Code across repositories
 */
template LOCAggregator(maxRepos) {
    signal input locCounts[maxRepos];
    signal input validRepos;
    
    signal output totalLOC;
    signal output avgLOCPerRepo;
    signal output locDistributionHash;
    
    signal runningLOCSum[maxRepos + 1];
    runningLOCSum[0] <== 0;
    
    component isValidLOC[maxRepos];
    var validLOCCount = 0;
    
    for (var i = 0; i < maxRepos; i++) {
        isValidLOC[i] = GreaterThan(32);
        isValidLOC[i].in[0] <== locCounts[i];
        isValidLOC[i].in[1] <== 0;
        
        runningLOCSum[i + 1] <== runningLOCSum[i] + locCounts[i];
        validLOCCount += isValidLOC[i].out;
    }
    
    totalLOC <== runningLOCSum[maxRepos];
    
    // Calculate average (simplified division)
    component divider = SafeDivision(32);
    divider.dividend <== totalLOC;
    divider.divisor <== validRepos;
    avgLOCPerRepo <== divider.quotient;
    
    // Create distribution hash
    component locHasher = Poseidon(maxRepos);
    for (var i = 0; i < maxRepos; i++) {
        locHasher.inputs[i] <== locCounts[i];
    }
    locDistributionHash <== locHasher.out;
}

template SafeDivision(n) {
    signal input dividend;
    signal input divisor;
    signal output quotient;
    signal output remainder;
    
    quotient <-- dividend \ divisor;
    remainder <-- dividend % divisor;
    
    dividend === quotient * divisor + remainder;
    
    component ltDivisor = LessThan(n);
    ltDivisor.in[0] <== remainder;
    ltDivisor.in[1] <== divisor;
    ltDivisor.out === 1;
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

template IsEqual() {
    signal input in[2];
    signal output out;
    out <== IsZero()(in[1] - in[0]);
}

template IsZero() {
    signal input in;
    signal output out;
    signal inv;
    inv <-- in != 0 ? 1/in : 0;
    out <== -in*inv + 1;
    in*out === 0;
} 