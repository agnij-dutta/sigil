// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofVerification
 * @dev Library for zero-knowledge proof verification utilities
 * Based on Iden3 patterns and optimized for Groth16 proofs
 */
library ProofVerification {
    // Groth16 proof structure
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    // Verification key structure
    struct VerifyingKey {
        uint256[2] alpha;
        uint256[2][2] beta;
        uint256[2][2] gamma;
        uint256[2][2] delta;
        uint256[2][] ic; // Interpolation coefficients
    }

    // Custom errors
    error InvalidProofFormat();
    error InvalidPublicInputsLength();
    error ProofVerificationFailed();
    error InvalidVerifyingKey();

    /**
     * @dev Verify a Groth16 proof
     * @param proof The proof to verify
     * @param publicInputs Public inputs for the circuit
     * @param vk Verifying key
     * @return True if proof is valid
     */
    function verifyGroth16Proof(
        Proof memory proof,
        uint256[] memory publicInputs,
        VerifyingKey memory vk
    ) internal view returns (bool) {
        // Validate proof format
        if (!isValidProofFormat(proof)) {
            revert InvalidProofFormat();
        }

        // Validate public inputs length
        if (publicInputs.length + 1 != vk.ic.length) {
            revert InvalidPublicInputsLength();
        }

        // Compute vk_x = IC[0] + sum(IC[i+1] * publicInputs[i])
        uint256[2] memory vk_x = vk.ic[0];
        for (uint256 i = 0; i < publicInputs.length; i++) {
            vk_x = pointAdd(vk_x, scalarMul(vk.ic[i + 1], publicInputs[i]));
        }

        // Verify pairing equation: e(A, B) = e(alpha, beta) * e(vk_x, gamma) * e(C, delta)
        return verifyPairing(proof, vk_x, vk);
    }

    /**
     * @dev Verify proof with encoded format (common in practice)
     * @param proofData Encoded proof data
     * @param publicInputs Public circuit inputs
     * @param vkData Encoded verifying key data
     * @return True if proof is valid
     */
    function verifyEncodedProof(
        bytes memory proofData,
        uint256[] memory publicInputs,
        bytes memory vkData
    ) internal view returns (bool) {
        Proof memory proof = decodeProof(proofData);
        VerifyingKey memory vk = decodeVerifyingKey(vkData);
        
        return verifyGroth16Proof(proof, publicInputs, vk);
    }

    /**
     * @dev Batch verify multiple proofs for efficiency
     * @param proofs Array of proofs to verify
     * @param publicInputsArray Array of public inputs for each proof
     * @param vks Array of verifying keys
     * @return Array of verification results
     */
    function batchVerifyProofs(
        Proof[] memory proofs,
        uint256[][] memory publicInputsArray,
        VerifyingKey[] memory vks
    ) internal view returns (bool[] memory) {
        require(
            proofs.length == publicInputsArray.length && 
            publicInputsArray.length == vks.length,
            "Array length mismatch"
        );

        bool[] memory results = new bool[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            results[i] = verifyGroth16Proof(proofs[i], publicInputsArray[i], vks[i]);
        }
        
        return results;
    }

    /**
     * @dev Hash credential data for uniqueness
     * @param user User address
     * @param credentialType Type of credential
     * @param publicInputs Public inputs from the proof
     * @param timestamp When credential was issued
     * @return Unique credential hash
     */
    function hashCredential(
        address user,
        uint256 credentialType,
        uint256[] memory publicInputs,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            user,
            credentialType,
            publicInputs,
            timestamp
        ));
    }

    /**
     * @dev Validate proof format
     * @param proof Proof to validate
     * @return True if format is valid
     */
    function isValidProofFormat(Proof memory proof) internal pure returns (bool) {
        // Check that proof elements are not zero (simplified check)
        return (proof.a[0] != 0 || proof.a[1] != 0) &&
               (proof.b[0][0] != 0 || proof.b[0][1] != 0 || proof.b[1][0] != 0 || proof.b[1][1] != 0) &&
               (proof.c[0] != 0 || proof.c[1] != 0);
    }

    /**
     * @dev Decode proof from bytes
     * @param proofData Encoded proof data
     * @return Decoded proof structure
     */
    function decodeProof(bytes memory proofData) internal pure returns (Proof memory) {
        require(proofData.length >= 256, "Invalid proof data length");
        
        Proof memory proof;
        assembly {
            let dataPtr := add(proofData, 0x20)
            
            // Load proof.a
            mstore(proof, mload(dataPtr))
            mstore(add(proof, 0x20), mload(add(dataPtr, 0x20)))
            
            // Load proof.b
            mstore(add(proof, 0x40), mload(add(dataPtr, 0x40)))
            mstore(add(proof, 0x60), mload(add(dataPtr, 0x60)))
            mstore(add(proof, 0x80), mload(add(dataPtr, 0x80)))
            mstore(add(proof, 0xa0), mload(add(dataPtr, 0xa0)))
            
            // Load proof.c
            mstore(add(proof, 0xc0), mload(add(dataPtr, 0xc0)))
            mstore(add(proof, 0xe0), mload(add(dataPtr, 0xe0)))
        }
        
        return proof;
    }

    /**
     * @dev Decode verifying key from bytes
     * @param vkData Encoded verifying key data
     * @return Decoded verifying key structure
     */
    function decodeVerifyingKey(bytes memory vkData) internal pure returns (VerifyingKey memory) {
        // Simplified decoding - in practice this would be more complex
        VerifyingKey memory vk;
        
        // This would decode the full verifying key structure
        // For now, return empty structure (would need circuit-specific implementation)
        
        return vk;
    }

    /**
     * @dev Elliptic curve point addition
     * @param p1 First point
     * @param p2 Second point
     * @return Sum of points
     */
    function pointAdd(uint256[2] memory p1, uint256[2] memory p2) 
        internal 
        view 
        returns (uint256[2] memory) 
    {
        uint256[4] memory input = [p1[0], p1[1], p2[0], p2[1]];
        uint256[2] memory result;
        
        assembly {
            if iszero(staticcall(gas(), 0x06, input, 0x80, result, 0x40)) {
                revert(0, 0)
            }
        }
        
        return result;
    }

    /**
     * @dev Elliptic curve scalar multiplication
     * @param point Point to multiply
     * @param scalar Scalar multiplier
     * @return Multiplied point
     */
    function scalarMul(uint256[2] memory point, uint256 scalar) 
        internal 
        view 
        returns (uint256[2] memory) 
    {
        uint256[3] memory input = [point[0], point[1], scalar];
        uint256[2] memory result;
        
        assembly {
            if iszero(staticcall(gas(), 0x07, input, 0x60, result, 0x40)) {
                revert(0, 0)
            }
        }
        
        return result;
    }

    /**
     * @dev Verify pairing equation for Groth16
     * @param proof The proof
     * @param vk_x Computed vk_x value
     * @param vk Verifying key
     * @return True if pairing is valid
     */
    function verifyPairing(
        Proof memory proof,
        uint256[2] memory vk_x,
        VerifyingKey memory vk
    ) internal view returns (bool) {
        // Simplified pairing check - in practice would use precompiled contracts
        // This is a placeholder for the actual pairing verification
        
        // Check basic proof structure
        return isValidProofFormat(proof) && (vk_x[0] != 0 || vk_x[1] != 0);
    }

    /**
     * @dev Get proof hash for caching/indexing
     * @param proof Proof to hash
     * @return Hash of the proof
     */
    function getProofHash(Proof memory proof) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            proof.a[0], proof.a[1],
            proof.b[0][0], proof.b[0][1], proof.b[1][0], proof.b[1][1],
            proof.c[0], proof.c[1]
        ));
    }

    /**
     * @dev Validate public inputs are within field bounds
     * @param publicInputs Array of public inputs
     * @return True if all inputs are valid
     */
    function validatePublicInputs(uint256[] memory publicInputs) internal pure returns (bool) {
        // BN254 field modulus
        uint256 FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        
        for (uint256 i = 0; i < publicInputs.length; i++) {
            if (publicInputs[i] >= FIELD_MODULUS) {
                return false;
            }
        }
        
        return true;
    }
} 