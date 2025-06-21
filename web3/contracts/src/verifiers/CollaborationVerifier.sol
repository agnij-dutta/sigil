// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title CollaborationVerifier
 * @dev Verifies collaboration and teamwork credentials
 * Matches the CollaborationCredential circuit specification exactly
 * 
 * Public inputs (5 total):
 * [0] = userAddress (user's public address)
 * [1] = minCollaborators (minimum collaborators claimed range)
 * [2] = maxCollaborators (maximum collaborators claimed range)
 * [3] = maxContributionPercent (max reasonable contribution %)
 * [4] = teamDiversityScore (score representing team diversity)
 */
contract CollaborationVerifier {
    // Verifying key for collaboration credential circuit
    ProofVerification.VerifyingKey public verifyingKey;
    
    // Contract owner for updates
    address public owner;
    
    // Proof verification statistics
    mapping(address => uint256) public verificationCount;
    mapping(bytes32 => bool) public usedProofs;
    
    // Collaboration metrics
    mapping(address => uint256) public collaboratorCounts;
    mapping(address => uint256) public diversityScores;
    
    // Events
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        uint256 collaboratorCount,
        uint256 diversityScore,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(
        address indexed updater,
        uint256 timestamp
    );

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidCollaborationProof();
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
     * @dev Verify collaboration credential proof
     * @param proof ZK proof data (encoded Groth16 proof)
     * @param publicSignals Public inputs matching circuit specification
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[5] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs structure for collaboration credential circuit
        if (!_validateCollaborationInputs(publicSignals)) {
            revert InvalidPublicInputs();
        }

        // Check proof hasn't been used before (prevent replay attacks)
        bytes32 proofHash = keccak256(proof);
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }

        // Convert array to dynamic array for library compatibility
        uint256[] memory publicInputs = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            publicInputs[i] = publicSignals[i];
        }

        // Verify proof using ProofVerification library
        bool isValid = ProofVerification.verifyEncodedProof(
            proof,
            publicInputs,
            abi.encode(verifyingKey)
        );

        if (!isValid) {
            revert InvalidCollaborationProof();
        }

        // Mark proof as used and update statistics
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        // Store collaboration metrics
        uint256 avgCollaborators = (publicSignals[1] + publicSignals[2]) / 2;
        collaboratorCounts[msg.sender] = avgCollaborators;
        diversityScores[msg.sender] = publicSignals[4];

        emit ProofVerified(
            msg.sender, 
            proofHash, 
            avgCollaborators, 
            publicSignals[4], 
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Validate collaboration credential public inputs
     * Based on CollaborationCredential circuit specification
     */
    function _validateCollaborationInputs(uint256[5] calldata publicSignals) 
        internal 
        pure 
        returns (bool) 
    {
        // Validate field bounds
        uint256[] memory dynamicArray = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            dynamicArray[i] = publicSignals[i];
        }
        if (!ProofVerification.validatePublicInputs(dynamicArray)) {
            return false;
        }
        
        uint256 userAddress = publicSignals[0];
        uint256 minCollaborators = publicSignals[1];
        uint256 maxCollaborators = publicSignals[2];
        uint256 maxContributionPercent = publicSignals[3];
        uint256 teamDiversityScore = publicSignals[4];

        // User address should not be zero
        if (userAddress == 0) {
            return false;
        }

        // Collaborator range validation
        if (minCollaborators > maxCollaborators || maxCollaborators > 1000) {
            return false;
        }

        // Minimum team size (at least 2 people including user)
        if (minCollaborators < 1) {
            return false;
        }

        // Contribution percentage should be reasonable (max 95%)
        if (maxContributionPercent > 95) {
            return false;
        }

        // Diversity score should be 0-100
        if (teamDiversityScore > 100) {
            return false;
        }

        return true;
    }

    /**
     * @dev Get collaboration metrics for user
     */
    function getCollaborationMetrics(address user) 
        external 
        view 
        returns (
            uint256 collaboratorCount,
            uint256 diversityScore,
            uint256 verificationCount_
        ) 
    {
        collaboratorCount = collaboratorCounts[user];
        diversityScore = diversityScores[user];
        verificationCount_ = verificationCount[user];
    }

    /**
     * @dev Check if user has proven collaboration skills
     */
    function hasCollaborationProof(address user) 
        external 
        view 
        returns (bool) 
    {
        return verificationCount[user] > 0;
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

    /**
     * @dev Get collaboration info from public signals
     */
    function getCollaborationInfo(uint256[5] calldata publicSignals) 
        external 
        pure 
        returns (
            address userAddress,
            uint256 collaboratorRange,
            uint256 maxContributionPercent,
            uint256 teamDiversityScore
        ) 
    {
        userAddress = address(uint160(publicSignals[0]));
        collaboratorRange = (publicSignals[2] << 128) | publicSignals[1]; // max << 128 | min
        maxContributionPercent = publicSignals[3];
        teamDiversityScore = publicSignals[4];
    }
} 