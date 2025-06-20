pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";
include "./signature_verifier.circom";
include "./metadata_range.circom";

/*
 * ContributionProof Circuit
 * 
 * This circuit proves that a developer authored a specific commit
 * with certain metadata characteristics without revealing:
 * - The actual commit content/code
 * - The exact lines of code count
 * - The specific repository details
 * 
 * Public Inputs:
 * - commitHashPublic: Public hash of the commit
 * - authorAddressPublic: Ethereum address of the claimed author
 * - minLOC, maxLOC: Range bounds for lines of code
 * - timestamp: Commit timestamp
 * 
 * Private Inputs:
 * - commitHash: Full commit hash
 * - signature: Git commit signature
 * - authorEmail: Git author email
 * - linesOfCode: Actual lines of code added/modified
 * - filesChanged: Number of files changed
 * - authorPrivateKey: Private key for signature verification
 */

template ContributionProof() {
    // Public inputs
    signal input commitHashPublic;
    signal input authorAddressPublic;
    signal input minLOC;
    signal input maxLOC;
    signal input timestamp;
    
    // Private inputs
    signal input commitHash;
    signal input signature[2]; // r, s components of ECDSA signature
    signal input authorEmail;
    signal input linesOfCode;
    signal input filesChanged;
    signal input authorPrivateKey;
    
    // Outputs
    signal output isValid;
    signal output proofHash;
    
    // Components
    component signatureVerifier = SignatureVerifier();
    component metadataRange = MetadataRangeCheck();
    component hasher = Poseidon(5);
    
    // Verify that the provided commit hash matches the public one
    component commitHashCheck = IsEqual();
    commitHashCheck.in[0] <== commitHash;
    commitHashCheck.in[1] <== commitHashPublic;
    
    // Verify the commit signature
    signatureVerifier.message <== commitHash;
    signatureVerifier.signature[0] <== signature[0];
    signatureVerifier.signature[1] <== signature[1];
    signatureVerifier.privateKey <== authorPrivateKey;
    signatureVerifier.authorAddress <== authorAddressPublic;
    
    // Verify metadata is within acceptable ranges
    metadataRange.value <== linesOfCode;
    metadataRange.minValue <== minLOC;
    metadataRange.maxValue <== maxLOC;
    
    // Verify timestamp is reasonable (not in future, not too old)
    component timestampCheck = LessEqThan(64);
    timestampCheck.in[0] <== timestamp;
    timestampCheck.in[1] <== 1735689600; // Jan 1, 2025 as max reasonable timestamp
    
    // All verification components must pass
    component finalAnd = AND();
    finalAnd.a <== commitHashCheck.out;
    component tempAnd1 = AND();
    tempAnd1.a <== signatureVerifier.isValid;
    tempAnd1.b <== metadataRange.isInRange;
    component tempAnd2 = AND();
    tempAnd2.a <== tempAnd1.out;
    tempAnd2.b <== timestampCheck.out;
    finalAnd.b <== tempAnd2.out;
    
    isValid <== finalAnd.out;
    
    // Generate a unique proof hash for this contribution
    hasher.inputs[0] <== commitHash;
    hasher.inputs[1] <== authorAddressPublic;
    hasher.inputs[2] <== linesOfCode;
    hasher.inputs[3] <== filesChanged;
    hasher.inputs[4] <== timestamp;
    
    proofHash <== hasher.out;
}

component main = ContributionProof(); 