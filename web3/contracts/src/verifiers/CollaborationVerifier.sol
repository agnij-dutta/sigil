// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title CollaborationVerifier
 * @dev Verifies collaboration and teamwork credentials
 * Handles ZK proofs for collaboration verification with privacy preservation
 */
contract CollaborationVerifier {
    using ProofVerification for bytes32;

    // Verifying key for collaboration credential circuit
    ProofVerification.VerifyingKey public verifyingKey;
    
    // Contract owner
    address public owner;
    
    // Verification statistics
    mapping(address => uint256) public verificationCount;
    mapping(bytes32 => bool) public usedProofs;
    
    // Events
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        uint256 collaboratorCount,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(address indexed updater, uint256 timestamp);

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidCollaborationProof();
    error InvalidPublicInputs();

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
     * @param proof ZK proof data
     * @param publicSignals Public inputs for the circuit
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs for collaboration credential
        if (!_validateCollaborationInputs(publicSignals)) {
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
            revert InvalidCollaborationProof();
        }

        // Update state
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        emit ProofVerified(
            msg.sender, 
            proofHash, 
            publicSignals[0], // collaborator count
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Validate collaboration credential public inputs
     * Expected format:
     * [0] = minCollaborators (minimum collaborators across repos)
     * [1] = maxCollaborators (maximum collaborators in any repo)
     * [2] = avgCollaborators (average collaborators per repo)
     * [3] = repositoryCount (number of collaborative repositories)
     * [4] = kAnonymityLevel (k-anonymity level maintained)
     * [5] = contributionBalance (how balanced contributions are)
     * [6] = leadershipScore (leadership in collaborative projects)
     * [7] = mentorshipScore (mentoring other developers)
     * [8] = communicationScore (communication effectiveness)
     * [9] = isNonSoloContributor (1 if not solo contributor, 0 otherwise)
     */
    function _validateCollaborationInputs(uint256[] calldata publicSignals) 
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

        uint256 minCollaborators = publicSignals[0];
        uint256 maxCollaborators = publicSignals[1];
        uint256 avgCollaborators = publicSignals[2];
        uint256 repositoryCount = publicSignals[3];
        uint256 kAnonymityLevel = publicSignals[4];
        uint256 contributionBalance = publicSignals[5];
        uint256 leadershipScore = publicSignals[6];
        uint256 mentorshipScore = publicSignals[7];
        uint256 communicationScore = publicSignals[8];
        uint256 isNonSoloContributor = publicSignals[9];

        // Collaborator counts should be reasonable and consistent
        if (minCollaborators == 0 || maxCollaborators == 0) {
            return false;
        }

        if (minCollaborators > maxCollaborators) {
            return false;
        }

        if (maxCollaborators > 1000) { // Max 1000 collaborators
            return false;
        }

        if (avgCollaborators < minCollaborators || avgCollaborators > maxCollaborators) {
            return false;
        }

        // Repository count should be reasonable
        if (repositoryCount == 0 || repositoryCount > 1000) {
            return false;
        }

        // K-anonymity level should be at least 2
        if (kAnonymityLevel < 2 || kAnonymityLevel > 100) {
            return false;
        }

        // Scores should be 0-100
        if (contributionBalance > 100 || leadershipScore > 100 || 
            mentorshipScore > 100 || communicationScore > 100) {
            return false;
        }

        // isNonSoloContributor should be boolean
        if (isNonSoloContributor > 1) {
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