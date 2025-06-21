// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../libraries/ProofVerification.sol";

/**
 * @title LanguageVerifier
 * @dev Verifies programming language proficiency credentials
 * Matches the DynamicLanguageCredential circuit specification exactly
 * 
 * Public inputs (2 total):
 * [0] = languageCount (number of languages used)
 * [1] = languageSetHash (unique hash of the language set)
 */
contract LanguageVerifier {
    // Verifying key for language credential circuit
    ProofVerification.VerifyingKey public verifyingKey;
    
    // Contract owner for updates
    address public owner;
    
    // Proof verification statistics
    mapping(address => uint256) public verificationCount;
    mapping(bytes32 => bool) public usedProofs;
    
    // Language proficiency levels
    mapping(address => mapping(bytes32 => uint256)) public languageProficiency;
    
    // Events
    event ProofVerified(
        address indexed user,
        bytes32 indexed proofHash,
        uint256 languageCount,
        bytes32 languageSetHash,
        uint256 timestamp
    );
    
    event VerifyingKeyUpdated(
        address indexed updater,
        uint256 timestamp
    );

    // Errors
    error UnauthorizedAccess();
    error ProofAlreadyUsed();
    error InvalidLanguageProof();
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
     * @dev Verify language credential proof
     * @param proof ZK proof data (encoded Groth16 proof)
     * @param publicSignals Public inputs matching circuit specification
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[2] calldata publicSignals
    ) external returns (bool) {
        // Validate public inputs structure for language credential circuit
        if (!_validateLanguageInputs(publicSignals)) {
            revert InvalidPublicInputs();
        }

        // Check proof hasn't been used before (prevent replay attacks)
        bytes32 proofHash = keccak256(proof);
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }

        // Convert array to dynamic array for library compatibility
        uint256[] memory publicInputs = new uint256[](2);
        publicInputs[0] = publicSignals[0];
        publicInputs[1] = publicSignals[1];

        // Verify proof using ProofVerification library
        bool isValid = ProofVerification.verifyEncodedProof(
            proof,
            publicInputs,
            abi.encode(verifyingKey)
        );

        if (!isValid) {
            revert InvalidLanguageProof();
        }

        // Mark proof as used and update statistics
        usedProofs[proofHash] = true;
        verificationCount[msg.sender]++;

        // Store language proficiency
        bytes32 languageSetHash = bytes32(publicSignals[1]);
        languageProficiency[msg.sender][languageSetHash] = publicSignals[0];

        emit ProofVerified(
            msg.sender, 
            proofHash, 
            publicSignals[0], 
            languageSetHash, 
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Batch verify multiple language proofs
     * @param proofs Array of proof data
     * @param publicSignalsArray Array of public inputs
     * @return Array of verification results
     */
    function batchVerifyProofs(
        bytes[] calldata proofs,
        uint256[2][] calldata publicSignalsArray
    ) external returns (bool[] memory) {
        require(proofs.length == publicSignalsArray.length, "Array length mismatch");
        
        bool[] memory results = new bool[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            // Validate inputs first
            if (!_validateLanguageInputs(publicSignalsArray[i])) {
                results[i] = false;
                continue;
            }

            bytes32 proofHash = keccak256(proofs[i]);
            if (usedProofs[proofHash]) {
                results[i] = false;
                continue;
            }

            // Convert to dynamic array for verification
            uint256[] memory publicInputs = new uint256[](2);
            publicInputs[0] = publicSignalsArray[i][0];
            publicInputs[1] = publicSignalsArray[i][1];

            bool result = ProofVerification.verifyEncodedProof(
                proofs[i],
                publicInputs,
                abi.encode(verifyingKey)
            );
            
            if (result) {
                usedProofs[proofHash] = true;
                verificationCount[msg.sender]++;
                
                bytes32 languageSetHash = bytes32(publicSignalsArray[i][1]);
                languageProficiency[msg.sender][languageSetHash] = publicSignalsArray[i][0];
                
                emit ProofVerified(
                    msg.sender, 
                    proofHash, 
                    publicSignalsArray[i][0], 
                    languageSetHash, 
                    block.timestamp
                );
            }
            results[i] = result;
        }
        
        return results;
    }

    /**
     * @dev Validate language credential public inputs
     * Based on DynamicLanguageCredential circuit specification
     */
    function _validateLanguageInputs(uint256[2] calldata publicSignals) 
        internal 
        pure 
        returns (bool) 
    {
        // Validate field bounds
        uint256[] memory dynamicArray = new uint256[](2);
        dynamicArray[0] = publicSignals[0];
        dynamicArray[1] = publicSignals[1];
        if (!ProofVerification.validatePublicInputs(dynamicArray)) {
            return false;
        }
        
        uint256 languageCount = publicSignals[0];
        uint256 languageSetHash = publicSignals[1];

        // Language count should be reasonable (2-50 for meaningful proficiency)
        if (languageCount < 2 || languageCount > 50) {
            return false;
        }

        // Language set hash should not be zero
        if (languageSetHash == 0) {
            return false;
        }

        return true;
    }

    /**
     * @dev Get language proficiency for user and language set
     */
    function getLanguageProficiency(address user, bytes32 languageSetHash) 
        external 
        view 
        returns (uint256) 
    {
        return languageProficiency[user][languageSetHash];
    }

    /**
     * @dev Check if user has proven proficiency in a language set
     */
    function hasLanguageProficiency(address user, bytes32 languageSetHash) 
        external 
        view 
        returns (bool) 
    {
        return languageProficiency[user][languageSetHash] > 0;
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
     * @dev Get language info from public signals
     */
    function getLanguageInfo(uint256[2] calldata publicSignals) 
        external 
        pure 
        returns (
            uint256 languageCount,
            bytes32 languageSetHash
        ) 
    {
        languageCount = publicSignals[0];
        languageSetHash = bytes32(publicSignals[1]);
    }
} 