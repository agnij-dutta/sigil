// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title LanguageVerifier
 * @dev Verifies programming language proficiency credentials
 * Handles ZK proofs for language skill verification
 */
contract LanguageVerifier {
    using ProofVerification for bytes32;

    // Verifying key for language credential circuit
    ProofVerification.VerifyingKey public verifyingKey;
    
    // Contract owner
    address public owner;
    
    // Verification statistics
    mapping(address => uint256) public verificationCount;
    mapping(bytes32 => bool) public usedProofs;
    
    // Language proficiency levels
    enum ProficiencyLevel { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT }
    
    // Events
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        uint256 languageCount,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(address indexed updater, uint256 timestamp);

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidLanguageProof();
    error InvalidPublicInputs();
    error InvalidLanguageCount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedAccess();
        _;
    }

    constructor(ProofVerification.VerifyingKey memory _verifyingKey) {
        owner = msg.sender;
        verifyingKey = _verifyingKey;
    }

    /**
     * @dev Verify language proficiency credential proof
     * @param proof ZK proof data
     * @param publicSignals Public inputs for the circuit
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs for language credential
        if (!_validateLanguageInputs(publicSignals)) {
            revert InvalidPublicInputs();
        }

        // Prevent proof replay
        bytes32 proofHash = keccak256(proof);
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }

        // Verify ZK proof
        bool isValid = ProofVerification.verifyEncodedProof(
            proof,
            publicSignals,
            _encodeVerifyingKey()
        );

        if (!isValid) {
            revert InvalidLanguageProof();
        }

        // Update state
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        emit ProofVerified(
            msg.sender, 
            proofHash, 
            publicSignals[0], // language count
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Validate language credential public inputs
     * Expected format:
     * [0] = languageCount (2-50 languages)
     * [1] = languageSetHash (hash of language set for uniqueness)
     * [2] = totalLOCRange (encoded total LOC across languages)
     * [3] = diversityScore (language diversity score 0-100)
     * [4] = proficiencyLevel (average proficiency level)
     * [5] = frameworkCount (number of frameworks/libraries)
     * [6] = projectCount (number of projects using languages)
     * [7] = consistencyScore (consistency of language usage)
     * [8] = learningTrend (learning trend: 0=declining, 1=stable, 2=improving)
     * [9] = marketRelevance (market relevance score 0-100)
     */
    function _validateLanguageInputs(uint256[] calldata publicSignals) 
        internal 
        pure 
        returns (bool) 
    {
        if (publicSignals.length != 10) {
            return false;
        }

        if (!ProofVerification.validatePublicInputs(publicSignals)) {
            return false;
        }

        uint256 languageCount = publicSignals[0];
        uint256 totalLOCRange = publicSignals[2];
        uint256 diversityScore = publicSignals[3];
        uint256 proficiencyLevel = publicSignals[4];
        uint256 frameworkCount = publicSignals[5];
        uint256 projectCount = publicSignals[6];
        uint256 consistencyScore = publicSignals[7];
        uint256 learningTrend = publicSignals[8];
        uint256 marketRelevance = publicSignals[9];

        // Language count: 2-50 languages
        if (languageCount < 2 || languageCount > 50) {
            return false;
        }

        // Total LOC range should be reasonable
        if (totalLOCRange > 100000000) { // 100M LOC max
            return false;
        }

        // Scores should be 0-100
        if (diversityScore > 100 || consistencyScore > 100 || marketRelevance > 100) {
            return false;
        }

        // Proficiency level should be valid enum
        if (proficiencyLevel > uint256(ProficiencyLevel.EXPERT)) {
            return false;
        }

        // Framework count should be reasonable
        if (frameworkCount > 500) {
            return false;
        }

        // Project count should be reasonable
        if (projectCount == 0 || projectCount > 10000) {
            return false;
        }

        // Learning trend should be valid (0, 1, or 2)
        if (learningTrend > 2) {
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
     * @dev Get user verification statistics
     */
    function getUserVerificationCount(address user) external view returns (uint256) {
        return verificationCount[user];
    }

    /**
     * @dev Check if proof was used
     */
    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    /**
     * @dev Encode verifying key
     */
    function _encodeVerifyingKey() internal view returns (bytes memory) {
        return abi.encode(verifyingKey);
    }

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 