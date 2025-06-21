// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofVerification
 * @dev Library for zero-knowledge proof verification utilities
 */
library ProofVerification {
    // Groth16 proof structure
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    // Verification key structure with fixed-size arrays
    struct VerifyingKey {
        uint256[2] alpha;
        uint256[2][2] beta;
        uint256[2][2] gamma;
        uint256[2][2] delta;
        uint256[2][20] ic; // Fixed size array
        uint256 icLength; // Actual length
    }

    // Custom errors
    error InvalidProofFormat();
    error InvalidPublicInputsLength();

    /**
     * @dev Simplified proof verification for testing
     */
    function verifyProofSimplified(
        Proof memory proof,
        uint256[] memory publicInputs,
        VerifyingKey memory vk
    ) internal pure returns (bool) {
        if (!isValidProofFormat(proof)) {
            return false;
        }
        
        if (publicInputs.length == 0) {
            return false;
        }
        
        return true;
    }

    /**
     * @dev Create a default verifying key for testing
     */
    function getDefaultVerifyingKey(uint256 icLength) internal pure returns (VerifyingKey memory) {
        VerifyingKey memory vk;
        vk.alpha = [uint256(1), uint256(2)];
        vk.beta = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        vk.gamma = [[uint256(7), uint256(8)], [uint256(9), uint256(10)]];
        vk.delta = [[uint256(11), uint256(12)], [uint256(13), uint256(14)]];
        vk.icLength = icLength;
        
        for (uint256 i = 0; i < icLength && i < 20; i++) {
            vk.ic[i] = [uint256(15 + i * 2), uint256(16 + i * 2)];
        }
        
        return vk;
    }

    /**
     * @dev Validate proof format
     */
    function isValidProofFormat(Proof memory proof) internal pure returns (bool) {
        return (proof.a[0] != 0 || proof.a[1] != 0) &&
               (proof.b[0][0] != 0 || proof.b[0][1] != 0 || proof.b[1][0] != 0 || proof.b[1][1] != 0) &&
               (proof.c[0] != 0 || proof.c[1] != 0);
    }

    /**
     * @dev Decode proof from bytes
     */
    function decodeProof(bytes memory proofData) internal pure returns (Proof memory) {
        require(proofData.length >= 256, "Invalid proof data length");
        
        Proof memory proof;
        assembly {
            let dataPtr := add(proofData, 0x20)
            mstore(proof, mload(dataPtr))
            mstore(add(proof, 0x20), mload(add(dataPtr, 0x20)))
            mstore(add(proof, 0x40), mload(add(dataPtr, 0x40)))
            mstore(add(proof, 0x60), mload(add(dataPtr, 0x60)))
            mstore(add(proof, 0x80), mload(add(dataPtr, 0x80)))
            mstore(add(proof, 0xa0), mload(add(dataPtr, 0xa0)))
            mstore(add(proof, 0xc0), mload(add(dataPtr, 0xc0)))
            mstore(add(proof, 0xe0), mload(add(dataPtr, 0xe0)))
        }
        
        return proof;
    }

    /**
     * @dev Hash credential data
     */
    function hashCredential(
        address user,
        uint256 credentialType,
        uint256[] memory publicInputs,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, credentialType, publicInputs, timestamp));
    }
}
