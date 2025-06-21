// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RepositoryVerifier.sol";
import "./LanguageVerifier.sol";
import "./CollaborationVerifier.sol";
import "./AggregateVerifier.sol";
import "../interfaces/ISigilVerifier.sol";
import "../libraries/ProofVerification.sol";

/**
 * @title SigilCredentialVerifier
 * @dev Main contract for verifying comprehensive developer credentials
 * Coordinates multiple specialized verifiers for different credential types
 */
contract SigilCredentialVerifier is ISigilVerifier {
    using ProofVerification for bytes32;

    // Verifier contracts
    RepositoryVerifier public immutable repositoryVerifier;
    LanguageVerifier public immutable languageVerifier;
    CollaborationVerifier public immutable collaborationVerifier;
    AggregateVerifier public immutable aggregateVerifier;

    // Credential registry
    mapping(address => mapping(bytes32 => bool)) public verifiedCredentials;
    mapping(address => uint256) public credentialCount;
    mapping(bytes32 => CredentialMetadata) public credentialMetadata;

    // Events
    event CredentialVerified(
        address indexed user,
        bytes32 indexed credentialHash,
        CredentialType credentialType,
        uint256 timestamp
    );
    
    event CredentialRevoked(
        address indexed user,
        bytes32 indexed credentialHash,
        uint256 timestamp
    );

    // Structs
    struct CredentialMetadata {
        CredentialType credentialType;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        string ipfsHash; // Optional IPFS storage
    }

    enum CredentialType {
        REPOSITORY,
        LANGUAGE,
        COLLABORATION,
        AGGREGATE,
        COMPOSITE
    }

    struct CompositeCredential {
        bool hasRepository;
        bool hasLanguage;
        bool hasCollaboration;
        bool hasAggregate;
        uint256 totalScore;
        uint256 diversityScore;
    }

    // Errors
    error InvalidProof();
    error CredentialExpired();
    error CredentialNotFound();
    error CredentialAlreadyRevoked();
    error UnauthorizedRevocation();

    constructor(
        address _repositoryVerifier,
        address _languageVerifier,
        address _collaborationVerifier,
        address _aggregateVerifier
    ) {
        repositoryVerifier = RepositoryVerifier(_repositoryVerifier);
        languageVerifier = LanguageVerifier(_languageVerifier);
        collaborationVerifier = CollaborationVerifier(_collaborationVerifier);
        aggregateVerifier = AggregateVerifier(_aggregateVerifier);
    }

    /**
     * @dev Verify a comprehensive developer credential
     * @param proofData Encoded proof data containing all credential proofs
     * @param publicSignals Public signals for verification
     * @param metadata Credential metadata including expiration
     */
    function verifyCredential(
        bytes calldata proofData,
        uint256[] calldata publicSignals,
        CredentialMetadata calldata metadata
    ) external returns (bytes32 credentialHash) {
        require(block.timestamp <= metadata.expiresAt, "Credential expired");

        // Decode proof data
        (
            bytes memory repoProof,
            bytes memory langProof,
            bytes memory collabProof,
            bytes memory aggProof,
            uint256[] memory repoSignals,
            uint256[] memory langSignals,
            uint256[] memory collabSignals,
            uint256[] memory aggSignals
        ) = abi.decode(proofData, (bytes, bytes, bytes, bytes, uint256[], uint256[], uint256[], uint256[]));

        // Verify individual credential components
        bool repoValid = _verifyRepositoryCredential(repoProof, repoSignals);
        bool langValid = _verifyLanguageCredential(langProof, langSignals);
        bool collabValid = _verifyCollaborationCredential(collabProof, collabSignals);
        bool aggValid = _verifyAggregateCredential(aggProof, aggSignals);

        require(repoValid && langValid && collabValid && aggValid, "Invalid credential components");

        // Calculate credential hash
        credentialHash = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            metadata.credentialType,
            publicSignals
        ));

        // Store credential
        verifiedCredentials[msg.sender][credentialHash] = true;
        credentialCount[msg.sender]++;
        credentialMetadata[credentialHash] = metadata;

        emit CredentialVerified(msg.sender, credentialHash, metadata.credentialType, block.timestamp);
        
        return credentialHash;
    }

    /**
     * @dev Verify repository credential component
     */
    function _verifyRepositoryCredential(
        bytes memory proof,
        uint256[] memory publicSignals
    ) internal view returns (bool) {
        try repositoryVerifier.verifyProof(proof, publicSignals) returns (bool valid) {
            return valid;
        } catch {
            return false;
        }
    }

    /**
     * @dev Verify language credential component
     */
    function _verifyLanguageCredential(
        bytes memory proof,
        uint256[] memory publicSignals
    ) internal view returns (bool) {
        try languageVerifier.verifyProof(proof, publicSignals) returns (bool valid) {
            return valid;
        } catch {
            return false;
        }
    }

    /**
     * @dev Verify collaboration credential component
     */
    function _verifyCollaborationCredential(
        bytes memory proof,
        uint256[] memory publicSignals
    ) internal view returns (bool) {
        try collaborationVerifier.verifyProof(proof, publicSignals) returns (bool valid) {
            return valid;
        } catch {
            return false;
        }
    }

    /**
     * @dev Verify aggregate credential component
     */
    function _verifyAggregateCredential(
        bytes memory proof,
        uint256[] memory publicSignals
    ) internal view returns (bool) {
        try aggregateVerifier.verifyProof(proof, publicSignals) returns (bool valid) {
            return valid;
        } catch {
            return false;
        }
    }

    /**
     * @dev Verify a simple single-component credential
     */
    function verifySingleCredential(
        CredentialType credentialType,
        bytes calldata proof,
        uint256[] calldata publicSignals,
        uint256 expiresAt
    ) external returns (bytes32 credentialHash) {
        require(block.timestamp <= expiresAt, "Credential expired");

        bool isValid = false;

        if (credentialType == CredentialType.REPOSITORY) {
            isValid = repositoryVerifier.verifyProof(proof, publicSignals);
        } else if (credentialType == CredentialType.LANGUAGE) {
            isValid = languageVerifier.verifyProof(proof, publicSignals);
        } else if (credentialType == CredentialType.COLLABORATION) {
            isValid = collaborationVerifier.verifyProof(proof, publicSignals);
        } else if (credentialType == CredentialType.AGGREGATE) {
            isValid = aggregateVerifier.verifyProof(proof, publicSignals);
        }

        if (!isValid) revert InvalidProof();

        // Calculate credential hash
        credentialHash = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            credentialType,
            publicSignals
        ));

        // Store credential
        verifiedCredentials[msg.sender][credentialHash] = true;
        credentialCount[msg.sender]++;
        
        credentialMetadata[credentialHash] = CredentialMetadata({
            credentialType: credentialType,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            ipfsHash: ""
        });

        emit CredentialVerified(msg.sender, credentialHash, credentialType, block.timestamp);
        
        return credentialHash;
    }

    /**
     * @dev Check if a credential is valid and not expired
     */
    function isCredentialValid(bytes32 credentialHash) external view returns (bool) {
        CredentialMetadata memory metadata = credentialMetadata[credentialHash];
        
        return !metadata.isRevoked && 
               block.timestamp <= metadata.expiresAt &&
               block.timestamp >= metadata.issuedAt;
    }

    /**
     * @dev Get credential details
     */
    function getCredential(bytes32 credentialHash) external view returns (
        CredentialType credentialType,
        uint256 issuedAt,
        uint256 expiresAt,
        bool isRevoked,
        string memory ipfsHash
    ) {
        CredentialMetadata memory metadata = credentialMetadata[credentialHash];
        
        return (
            metadata.credentialType,
            metadata.issuedAt,
            metadata.expiresAt,
            metadata.isRevoked,
            metadata.ipfsHash
        );
    }

    /**
     * @dev Get user's credential summary
     */
    function getUserCredentialSummary(address user) external view returns (CompositeCredential memory) {
        // This would iterate through user's credentials and build summary
        // For simplicity, returning a mock structure
        return CompositeCredential({
            hasRepository: credentialCount[user] > 0,
            hasLanguage: credentialCount[user] > 0,
            hasCollaboration: credentialCount[user] > 0,
            hasAggregate: credentialCount[user] > 0,
            totalScore: credentialCount[user] * 25, // Simple scoring
            diversityScore: credentialCount[user] > 3 ? 100 : credentialCount[user] * 25
        });
    }

    /**
     * @dev Revoke a credential (only by credential owner)
     */
    function revokeCredential(bytes32 credentialHash) external {
        if (!verifiedCredentials[msg.sender][credentialHash]) {
            revert CredentialNotFound();
        }
        
        CredentialMetadata storage metadata = credentialMetadata[credentialHash];
        
        if (metadata.isRevoked) {
            revert CredentialAlreadyRevoked();
        }

        metadata.isRevoked = true;
        verifiedCredentials[msg.sender][credentialHash] = false;

        emit CredentialRevoked(msg.sender, credentialHash, block.timestamp);
    }

    /**
     * @dev Update IPFS hash for a credential
     */
    function updateCredentialIPFS(bytes32 credentialHash, string calldata ipfsHash) external {
        if (!verifiedCredentials[msg.sender][credentialHash]) {
            revert CredentialNotFound();
        }

        credentialMetadata[credentialHash].ipfsHash = ipfsHash;
    }

    /**
     * @dev Batch verify multiple credentials
     */
    function batchVerifyCredentials(
        CredentialType[] calldata types,
        bytes[] calldata proofs,
        uint256[][] calldata publicSignals,
        uint256[] calldata expirationTimes
    ) external returns (bytes32[] memory credentialHashes) {
        require(
            types.length == proofs.length && 
            proofs.length == publicSignals.length && 
            publicSignals.length == expirationTimes.length,
            "Array length mismatch"
        );

        credentialHashes = new bytes32[](types.length);

        for (uint256 i = 0; i < types.length; i++) {
            credentialHashes[i] = this.verifySingleCredential(
                types[i],
                proofs[i],
                publicSignals[i],
                expirationTimes[i]
            );
        }

        return credentialHashes;
    }

    /**
     * @dev Emergency pause functionality (would require access control in production)
     */
    bool public paused = false;
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function pause() external {
        // Would require proper access control
        paused = true;
    }

    function unpause() external {
        // Would require proper access control
        paused = false;
    }
} 