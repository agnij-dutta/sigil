// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title AggregateVerifier
 * @dev Verifies cross-repository aggregate statistics credentials
 * Matches the StatsAggregator circuit specification exactly
 * 
 * Public inputs (8 total):
 * [0] = mean (weighted mean)
 * [1] = variance (weighted variance)
 * [2] = noisySum (DP-noisy sum)
 * [3] = noisyCount (DP-noisy count)
 * [4] = lowerBound (confidence interval lower bound)
 * [5] = upperBound (confidence interval upper bound)
 * [6] = outlierCount (number of detected outliers)
 * [7] = distributionSkew (skewness measure)
 */
contract AggregateVerifier {
    // Verifying key for aggregate statistics circuit
    ProofVerification.VerifyingKey public verifyingKey;
    
    // Contract owner for updates
    address public owner;
    
    // Proof verification statistics
    mapping(address => uint256) public verificationCount;
    mapping(bytes32 => bool) public usedProofs;
    
    // Aggregate statistics
    mapping(address => AggregateStats) public userStats;
    
    struct AggregateStats {
        uint256 mean;
        uint256 variance;
        uint256 confidenceRange;
        uint256 outlierCount;
        uint256 distributionSkew;
        uint256 timestamp;
    }
    
    // Events
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        uint256 mean,
        uint256 variance,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(
        address indexed updater,
        uint256 timestamp
    );

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidAggregateProof();
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
     * @dev Verify aggregate statistics credential proof
     * @param proof ZK proof data (encoded Groth16 proof)
     * @param publicSignals Public inputs matching circuit specification
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[8] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs structure for aggregate statistics circuit
        if (!_validateAggregateInputs(publicSignals)) {
            revert InvalidPublicInputs();
        }

        // Check proof hasn't been used before (prevent replay attacks)
        bytes32 proofHash = keccak256(proof);
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }

        // Convert array to dynamic array for library compatibility
        uint256[] memory publicInputs = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            publicInputs[i] = publicSignals[i];
        }

        // Verify proof using ProofVerification library
        bool isValid = ProofVerification.verifyEncodedProof(
            proof,
            publicInputs,
            abi.encode(verifyingKey)
        );

        if (!isValid) {
            revert InvalidAggregateProof();
        }

        // Mark proof as used and update statistics
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        // Store aggregate statistics
        uint256 confidenceRange = publicSignals[5] - publicSignals[4]; // upperBound - lowerBound
        userStats[msg.sender] = AggregateStats({
            mean: publicSignals[0],
            variance: publicSignals[1],
            confidenceRange: confidenceRange,
            outlierCount: publicSignals[6],
            distributionSkew: publicSignals[7],
            timestamp: block.timestamp
        });

        emit ProofVerified(
            msg.sender, 
            proofHash, 
            publicSignals[0], 
            publicSignals[1], 
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Validate aggregate statistics credential public inputs
     * Based on StatsAggregator circuit specification
     */
    function _validateAggregateInputs(uint256[8] calldata publicSignals) 
        internal 
        pure 
        returns (bool) 
    {
        // Validate field bounds
        uint256[] memory dynamicArray = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            dynamicArray[i] = publicSignals[i];
        }
        if (!ProofVerification.validatePublicInputs(dynamicArray)) {
            return false;
        }
        
        uint256 mean = publicSignals[0];
        uint256 variance = publicSignals[1];
        uint256 noisySum = publicSignals[2];
        uint256 noisyCount = publicSignals[3];
        uint256 lowerBound = publicSignals[4];
        uint256 upperBound = publicSignals[5];
        uint256 outlierCount = publicSignals[6];
        uint256 distributionSkew = publicSignals[7];

        // Confidence interval bounds should be ordered correctly
        if (lowerBound > upperBound) {
            return false;
        }

        // Mean should be within confidence interval
        if (mean < lowerBound || mean > upperBound) {
            return false;
        }

        // Noisy count should not be zero (would indicate no data)
        if (noisyCount == 0) {
            return false;
        }

        // Variance should be non-negative
        if (variance == 0 && mean != noisySum / noisyCount) {
            return false; // If variance is 0, mean should match simple average
        }

        // Outlier count should be reasonable (not more than total count)
        if (outlierCount > noisyCount) {
            return false;
        }

        // Distribution skew should be reasonable (-100 to 100 scaled)
        if (distributionSkew > 10000) { // Allowing for scaling factor
            return false;
        }

        return true;
    }

    /**
     * @dev Get aggregate statistics for user
     */
    function getAggregateStats(address user) 
        external 
        view 
        returns (AggregateStats memory) 
    {
        return userStats[user];
    }

    /**
     * @dev Check if user has proven aggregate statistics
     */
    function hasAggregateProof(address user) 
        external 
        view 
        returns (bool) 
    {
        return userStats[user].timestamp > 0;
    }

    /**
     * @dev Get statistical summary for user
     */
    function getStatsSummary(address user) 
        external 
        view 
        returns (
            uint256 mean,
            uint256 variance,
            uint256 confidenceRange,
            uint256 dataQuality // based on outlier count and skew
        ) 
    {
        AggregateStats memory stats = userStats[user];
        mean = stats.mean;
        variance = stats.variance;
        confidenceRange = stats.confidenceRange;
        
        // Calculate data quality score (0-100)
        // Lower outlier count and skew = higher quality
        uint256 outlierPenalty = stats.outlierCount * 10; // Each outlier reduces quality by 10
        uint256 skewPenalty = stats.distributionSkew / 100; // Skew penalty
        dataQuality = 100;
        if (outlierPenalty + skewPenalty < 100) {
            dataQuality = 100 - outlierPenalty - skewPenalty;
        } else {
            dataQuality = 0;
        }
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
     * @dev Get aggregate info from public signals
     */
    function getAggregateInfo(uint256[8] calldata publicSignals) 
        external 
        pure 
        returns (
            uint256 mean,
            uint256 variance,
            uint256 confidenceInterval,
            uint256 outlierCount,
            uint256 distributionSkew
        ) 
    {
        mean = publicSignals[0];
        variance = publicSignals[1];
        confidenceInterval = (publicSignals[5] << 128) | publicSignals[4]; // upper << 128 | lower
        outlierCount = publicSignals[6];
        distributionSkew = publicSignals[7];
    }
} 