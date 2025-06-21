// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

contract RepositoryVerifier {
    using ProofVerification for ProofVerification.Proof;
    
    ProofVerification.VerifyingKey public verifyingKey;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        verifyingKey = ProofVerification.getDefaultVerifyingKey(11); // 10 public inputs + 1
    }

    function verifyProof(
        bytes calldata proof,
        uint256[10] calldata publicSignals
    ) external pure returns (bool) {
        // Convert fixed array to dynamic for library
        uint256[] memory dynamicInputs = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            dynamicInputs[i] = publicSignals[i];
        }
        
        // Basic validation
        if (dynamicInputs[0] == 0) return false; // repoHash
        if (dynamicInputs[1] == 0) return false; // userAddress
        if (dynamicInputs[2] > dynamicInputs[3]) return false; // minCommits > maxCommits
        if (dynamicInputs[4] > dynamicInputs[5]) return false; // minLOC > maxLOC
        if (dynamicInputs[6] == 0 || dynamicInputs[6] > 50) return false; // languageCount
        if (dynamicInputs[7] > dynamicInputs[8]) return false; // minCollabs > maxCollabs
        
        return proof.length >= 256;
    }
}
