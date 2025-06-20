pragma circom 2.0.0;

include "circomlib/circuits/ecdsa.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * SignatureVerifier Circuit Component
 * 
 * Verifies that a commit signature was created by the claimed author
 * without revealing the private key or signature details
 * 
 * This component validates:
 * 1. The ECDSA signature is valid for the commit hash
 * 2. The signature was created by the claimed Ethereum address
 * 3. The message hash matches the commit hash
 */

template SignatureVerifier() {
    // Inputs
    signal input message;           // Commit hash to verify
    signal input signature[2];      // ECDSA signature [r, s]
    signal input privateKey;        // Private key for verification
    signal input authorAddress;     // Expected Ethereum address
    
    // Output
    signal output isValid;
    
    // Components for ECDSA verification
    component ecdsaVerify = ECDSAVerifyNoPubkeyCheck(64, 4);
    component pubKeyDerive = ECDSAPrivToPub(64, 4);
    component addressDerive = PubKeyToAddress();
    
    // Derive public key from private key
    pubKeyDerive.privkey <== privateKey;
    
    // Derive Ethereum address from public key
    addressDerive.pubkey[0] <== pubKeyDerive.pubkey[0];
    addressDerive.pubkey[1] <== pubKeyDerive.pubkey[1];
    
    // Verify the address matches the claimed author
    component addressCheck = IsEqual();
    addressCheck.in[0] <== addressDerive.address;
    addressCheck.in[1] <== authorAddress;
    
    // Verify the ECDSA signature
    ecdsaVerify.r <== signature[0];
    ecdsaVerify.s <== signature[1];
    ecdsaVerify.msghash <== message;
    ecdsaVerify.pubkey[0] <== pubKeyDerive.pubkey[0];
    ecdsaVerify.pubkey[1] <== pubKeyDerive.pubkey[1];
    
    // Both address and signature must be valid
    component finalValidation = AND();
    finalValidation.a <== addressCheck.out;
    finalValidation.b <== ecdsaVerify.result;
    
    isValid <== finalValidation.out;
}

/*
 * Helper template to derive Ethereum address from public key
 * Uses Keccak256 hash and takes last 20 bytes
 */
template PubKeyToAddress() {
    signal input pubkey[2];
    signal output address;
    
    // This is a simplified version - in practice, you'd need
    // a proper Keccak256 implementation for Ethereum addresses
    component hasher = Poseidon(2);
    hasher.inputs[0] <== pubkey[0];
    hasher.inputs[1] <== pubkey[1];
    
    // Take modulo to simulate address derivation
    // In practice, this would be the last 20 bytes of Keccak256(pubkey)
    component mod = Mod(160); // 160 bits = 20 bytes
    mod.dividend <== hasher.out;
    mod.divisor <== 2**160;
    
    address <== mod.remainder;
}

/*
 * Modulo template for address derivation
 */
template Mod(bits) {
    signal input dividend;
    signal input divisor;
    signal output remainder;
    
    component lt = LessThan(bits);
    lt.in[0] <== remainder;
    lt.in[1] <== divisor;
    lt.out === 1;
    
    signal quotient;
    remainder <-- dividend % divisor;
    quotient <-- dividend \ divisor;
    
    dividend === quotient * divisor + remainder;
} 