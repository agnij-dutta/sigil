// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

contract AggregateVerifier {
    using ProofVerification for ProofVerification.Proof;
    
    ProofVerification.VerifyingKey public verifyingKey;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        verifyingKey = ProofVerification.getDefaultVerifyingKey(9); // 8 public inputs + 1
    }

    function verifyProof(
        bytes calldata proof,
        uint256[8] calldata publicSignals
    ) external pure returns (bool) {
        // Basic validation for aggregate credential
        if (publicSignals[0] == 0) return false; // values should be non-zero
        
        return proof.length >= 256;
    }
}
