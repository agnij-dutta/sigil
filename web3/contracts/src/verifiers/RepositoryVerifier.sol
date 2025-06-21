// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title RepositoryVerifier
 * @dev Verifies repository membership and contribution credentials
 * Handles ZK proofs for repository-specific developer contributions
 */
contract RepositoryVerifier {
    using ProofVerification for bytes32;

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
     * @param proof ZK proof data
     * @param publicSignals Public inputs for the circuit
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs structure for repository credential
        if (!_validateRepositoryInputs(publicSignals)) {
            revert InvalidPublicInputs();
        }

        // Check proof hasn't been used before (prevent replay attacks)
        bytes32 proofHash = keccak256(proof);
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }

        // Verify the ZK proof
        bool isValid = ProofVerification.verifyEncodedProof(
            proof,
            publicSignals,
            _encodeVerifyingKey()
        );

        if (!isValid) {
            revert InvalidRepositoryProof();
        }

        // Mark proof as used and update statistics
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        emit ProofVerified(msg.sender, proofHash, block.timestamp);
        
        return true;
    }

    /**
     * @dev Batch verify multiple repository proofs
     * @param proofs Array of proof data
     * @param publicSignalsArray Array of public inputs
     * @return Array of verification results
     */
    function batchVerifyProofs(
        bytes[] calldata proofs,
        uint256[][] calldata publicSignalsArray
    ) external returns (bool[] memory) {
        require(proofs.length == publicSignalsArray.length, "Array length mismatch");
        
        bool[] memory results = new bool[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            try this.verifyProof(proofs[i], publicSignalsArray[i]) returns (bool result) {
                results[i] = result;
            } catch {
                results[i] = false;
            }
        }
        
        return results;
    }

    /**
     * @dev Validate repository credential public inputs
     * Expected format:
     * [0] = userAddressHash (user's address hash)
     * [1] = repoHash (repository identifier hash)
     * [2] = commitCountRange (encoded commit count range)
     * [3] = locRange (encoded lines of code range)
     * [4] = languageCount (number of languages used)
     * [5] = collaboratorCount (number of collaborators)
     * [6] = timeRangeStart (contribution start time)
     * [7] = timeRangeEnd (contribution end time)
     * [8] = qualityScore (contribution quality score)
     * [9] = isNonOwner (1 if user is not repo owner, 0 otherwise)
     */
    function _validateRepositoryInputs(uint256[] calldata publicSignals) 
        internal 
        pure 
        returns (bool) 
    {
        // Must have exactly 10 public inputs
        if (publicSignals.length != 10) {
            return false;
        }

        // Validate field bounds
        if (!ProofVerification.validatePublicInputs(publicSignals)) {
            return false;
        }

        // Validate specific constraints
        uint256 commitCountRange = publicSignals[2];
        uint256 locRange = publicSignals[3];
        uint256 languageCount = publicSignals[4];
        uint256 collaboratorCount = publicSignals[5];
        uint256 timeRangeStart = publicSignals[6];
        uint256 timeRangeEnd = publicSignals[7];
        uint256 qualityScore = publicSignals[8];
        uint256 isNonOwner = publicSignals[9];

        // Commit count range should be reasonable (0-10000 commits)
        if (commitCountRange > 10000) {
            return false;
        }

        // LOC range should be reasonable (0-10M lines)
        if (locRange > 10000000) {
            return false;
        }

        // Language count should be reasonable (1-50 languages)
        if (languageCount == 0 || languageCount > 50) {
            return false;
        }

        // Collaborator count should be reasonable (1-1000 collaborators)
        if (collaboratorCount == 0 || collaboratorCount > 1000) {
            return false;
        }

        // Time range should be valid
        if (timeRangeStart >= timeRangeEnd) {
            return false;
        }

        // Quality score should be 0-100
        if (qualityScore > 100) {
            return false;
        }

        // isNonOwner should be boolean (0 or 1)
        if (isNonOwner > 1) {
            return false;
        }

        return true;
    }

    /**
     * @dev Update verifying key (only owner)
     * @param newVerifyingKey New verifying key
     */
    function updateVerifyingKey(ProofVerification.VerifyingKey calldata newVerifyingKey) 
        external 
        onlyOwner 
    {
        verifyingKey = newVerifyingKey;
        emit VerifyingKeyUpdated(msg.sender, block.timestamp);
    }

    /**
     * @dev Get verification statistics for a user
     * @param user User address
     * @return Number of successful verifications
     */
    function getUserVerificationCount(address user) external view returns (uint256) {
        return verificationCount[user];
    }

    /**
     * @dev Check if a proof has been used
     * @param proofHash Hash of the proof
     * @return True if proof was already used
     */
    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }

    /**
     * @dev Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    /**
     * @dev Encode verifying key for proof verification
     * @return Encoded verifying key data
     */
    function _encodeVerifyingKey() internal view returns (bytes memory) {
        // Simplified encoding - in practice would serialize full VK structure
        return abi.encode(verifyingKey);
    }

    /**
     * @dev Get contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 