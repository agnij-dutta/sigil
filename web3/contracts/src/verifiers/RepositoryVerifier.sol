// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title RepositoryVerifier
 * @dev Verifies repository membership and contribution credentials
 * Matches the RepositoryCredential circuit specification exactly
 * 
 * Public inputs (10 total):
 * [0] = repoHash (hashed repository identifier)
 * [1] = userAddressPublic (user's Ethereum address)
 * [2] = minCommits (minimum commits claimed range)
 * [3] = maxCommits (maximum commits claimed range)
 * [4] = minLOC (minimum LOC range)
 * [5] = maxLOC (maximum LOC range)
 * [6] = languageCount (number of languages used)
 * [7] = minCollaborators (minimum collaborators range)
 * [8] = maxCollaborators (maximum collaborators range)
 * [9] = proofTimestamp (when proof was generated)
 */
contract RepositoryVerifier {
    // Verifying key for repository credential circuit
    ProofVerification.VerifyingKey public verifyingKey;
    
    // Contract owner for updates
    address public owner;
    
    // Proof verification statistics
    mapping(address => uint256) public verificationCount;
    mapping(bytes32 => bool) public usedProofs;
    
    // Events
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        bytes32 repoHash,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(
        address indexed updater,
        uint256 timestamp
    );

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidRepositoryProof();
    error InvalidPublicInputs();

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedAccess();
        _;
    }

    constructor(ProofVerification.VerifyingKey memory _verifyingKey) {
        owner = msg.sender;
        verifyingKey = _verifyingKey;
    }

    /**
     * @dev Verify repository credential proof
     * @param proof ZK proof data (encoded Groth16 proof)
     * @param publicSignals Public inputs matching circuit specification
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[10] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs structure for repository credential circuit
        if (!_validateRepositoryInputs(publicSignals)) {
            revert InvalidPublicInputs();
        }

        // Check proof hasn't been used before (prevent replay attacks)
        bytes32 proofHash = keccak256(proof);
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }

        // Convert array to dynamic array for library compatibility
        uint256[] memory publicInputs = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            publicInputs[i] = publicSignals[i];
        }

        // Verify proof using ProofVerification library
        bool isValid = ProofVerification.verifyEncodedProof(
            proof,
            publicInputs,
            abi.encode(verifyingKey)
        );

        if (!isValid) {
            revert InvalidRepositoryProof();
        }

        // Mark proof as used and update statistics
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        emit ProofVerified(msg.sender, proofHash, bytes32(publicSignals[0]), block.timestamp);
        
        return true;
    }

    /**
     * @dev Validate repository credential public inputs
     * Based on RepositoryCredential circuit specification
     */
    function _validateRepositoryInputs(uint256[10] calldata publicSignals) 
        internal 
        pure 
        returns (bool) 
    {
        // Validate field bounds
        uint256[] memory dynamicArray = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            dynamicArray[i] = publicSignals[i];
        }
        if (!ProofVerification.validatePublicInputs(dynamicArray)) {
            return false;
        }

        uint256 repoHash = publicSignals[0];
        uint256 userAddress = publicSignals[1];
        uint256 minCommits = publicSignals[2];
        uint256 maxCommits = publicSignals[3];
        uint256 minLOC = publicSignals[4];
        uint256 maxLOC = publicSignals[5];
        uint256 languageCount = publicSignals[6];
        uint256 minCollaborators = publicSignals[7];
        uint256 maxCollaborators = publicSignals[8];
        uint256 proofTimestamp = publicSignals[9];

        // Repository hash should not be zero
        if (repoHash == 0) {
            return false;
        }

        // User address should not be zero
        if (userAddress == 0) {
            return false;
        }

        // Commit range validation
        if (minCommits > maxCommits || maxCommits > 100000) {
            return false;
        }

        // LOC range validation
        if (minLOC > maxLOC || maxLOC > 100000000) {
            return false;
        }

        // Language count should be reasonable (1-50)
        if (languageCount == 0 || languageCount > 50) {
            return false;
        }

        // Collaborator range validation
        if (minCollaborators > maxCollaborators || maxCollaborators > 10000) {
            return false;
        }

        // Timestamp should be reasonable (not too far in future)
        if (proofTimestamp > block.timestamp + 3600) { // 1 hour tolerance
            return false;
        }

        return true;
    }

    /**
     * @dev Update verifying key (only owner)
     */
    function updateVerifyingKey(ProofVerification.VerifyingKey calldata newVerifyingKey) 
        external 
        onlyOwner 
    {
        verifyingKey = newVerifyingKey;
        emit VerifyingKeyUpdated(msg.sender, block.timestamp);
    }

    /**
     * @dev Get user verification count
     */
    function getUserVerificationCount(address user) external view returns (uint256) {
        return verificationCount[user];
    }

    /**
     * @dev Check if proof has been used
     */
    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
} 