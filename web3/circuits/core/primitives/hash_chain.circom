pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

/*
 * HashChain verifies a chain of hash computations
 * Used for proving sequential operations without revealing intermediates
 */
template HashChain(n) {
    signal input startHash;
    signal input values[n];
    signal input finalHash;
    signal output isValid;
    
    component hasher[n];
    signal chainHashes[n+1];
    
    chainHashes[0] <== startHash;
    
    for (var i = 0; i < n; i++) {
        hasher[i] = Poseidon(2);
        hasher[i].inputs[0] <== chainHashes[i];
        hasher[i].inputs[1] <== values[i];
        chainHashes[i+1] <== hasher[i].out;
    }
    
    // Verify final hash matches
    component finalCheck = IsEqual();
    finalCheck.in[0] <== chainHashes[n];
    finalCheck.in[1] <== finalHash;
    isValid <== finalCheck.out;
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