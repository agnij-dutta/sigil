// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title AggregateVerifier
 * @dev Verifies aggregate statistics and cross-repository credentials
 * Handles ZK proofs for comprehensive developer statistics
 */
contract AggregateVerifier {
    using ProofVerification for bytes32;

    // Verifying key for aggregate credential circuit
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
        uint256 repositoryCount,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(address indexed updater, uint256 timestamp);

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidAggregateProof();
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
     * @dev Verify aggregate credential proof
     * @param proof ZK proof data
     * @param publicSignals Public inputs for the circuit
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs for aggregate credential
        if (!_validateAggregateInputs(publicSignals)) {
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
            revert InvalidAggregateProof();
        }

        // Update state
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        emit ProofVerified(
            msg.sender, 
            proofHash, 
            publicSignals[0], // repository count
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Validate aggregate credential public inputs
     * Expected format:
     * [0] = repositoryCount (number of repositories contributed to)
     * [1] = totalCommitRange (encoded total commit count range)
     * [2] = totalLOCRange (encoded total LOC range)
     * [3] = timeSpanMonths (contribution time span in months)
     * [4] = consistencyScore (consistency across repositories 0-100)
     * [5] = diversityScore (diversity across projects 0-100)
     * [6] = qualityScore (overall quality score 0-100)
     * [7] = activityScore (activity level score 0-100)
     * [8] = growthTrend (growth trend: 0=declining, 1=stable, 2=improving)
     * [9] = reputationScore (overall reputation score 0-100)
     */
    function _validateAggregateInputs(uint256[] calldata publicSignals) 
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

        uint256 repositoryCount = publicSignals[0];
        uint256 totalCommitRange = publicSignals[1];
        uint256 totalLOCRange = publicSignals[2];
        uint256 timeSpanMonths = publicSignals[3];
        uint256 consistencyScore = publicSignals[4];
        uint256 diversityScore = publicSignals[5];
        uint256 qualityScore = publicSignals[6];
        uint256 activityScore = publicSignals[7];
        uint256 growthTrend = publicSignals[8];
        uint256 reputationScore = publicSignals[9];

        // Repository count should be reasonable (at least 2 for aggregate)
        if (repositoryCount < 2 || repositoryCount > 10000) {
            return false;
        }

        // Total commit range should be reasonable
        if (totalCommitRange > 1000000) { // Max 1M commits
            return false;
        }

        // Total LOC range should be reasonable
        if (totalLOCRange > 1000000000) { // Max 1B LOC
            return false;
        }

        // Time span should be reasonable (1 month to 20 years)
        if (timeSpanMonths == 0 || timeSpanMonths > 240) {
            return false;
        }

        // All scores should be 0-100
        if (consistencyScore > 100 || diversityScore > 100 || 
            qualityScore > 100 || activityScore > 100 || reputationScore > 100) {
            return false;
        }

        // Growth trend should be valid (0, 1, or 2)
        if (growthTrend > 2) {
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