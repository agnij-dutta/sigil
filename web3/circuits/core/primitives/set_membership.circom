pragma circom 2.0.0;

/*
 * SetMembership proves that a value exists in a predefined set
 * without revealing which position in the set
 */
template SetMembership(setSize) {
    signal input value;
    signal input set[setSize];
    signal output isMember;
    
    component equalChecks[setSize];
    signal sumEquals;
    var tempSum = 0;
    
    for (var i = 0; i < setSize; i++) {
        equalChecks[i] = IsEqual();
        equalChecks[i].in[0] <== value;
        equalChecks[i].in[1] <== set[i];
        tempSum += equalChecks[i].out;
    }
    
    sumEquals <== tempSum;
    
    // At least one match should exist
    component memberCheck = GreaterThan(8);
    memberCheck.in[0] <== sumEquals;
    memberCheck.in[1] <== 0;
    isMember <== memberCheck.out;
}

/*
 * PrivateSetMembership proves membership without revealing the set
 * Uses commitment to the set and merkle proof
 */
template PrivateSetMembership(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal input root;
    signal output isMember;
    
    component merkleProof = MerkleTreeChecker(depth);
    merkleProof.leaf <== leaf;
    merkleProof.root <== root;
    
    for (var i = 0; i < depth; i++) {
        merkleProof.pathElements[i] <== pathElements[i];
        merkleProof.pathIndices[i] <== pathIndices[i];
    }
    
    isMember <== 1; // If constraints pass, membership is proven
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

template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    component selectors[levels];
    component hashers[levels];
    
    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].c[0] <== i == 0 ? leaf : hashers[i-1].out;
        selectors[i].c[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];
        
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
    }
    
    root === hashers[levels-1].out;
}

template DualMux() {
    signal input c[2];
    signal input s;
    signal output out[2];
    
    s * (1 - s) === 0;
    out[0] <== (c[1] - c[0]) * s + c[0];
    out[1] <== (c[0] - c[1]) * s + c[1];
} 