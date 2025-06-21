// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ISigilVerifier
 * @dev Interface for the main Sigil credential verification system
 * Defines the core functions for verifying developer credentials
 */
interface ISigilVerifier {
    // Enums
    enum CredentialType {
        REPOSITORY,
        LANGUAGE,
        COLLABORATION,
        AGGREGATE,
        COMPOSITE
    }

    // Structs
    struct CredentialMetadata {
        CredentialType credentialType;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        string ipfsHash;
    }

    struct CompositeCredential {
        bool hasRepository;
        bool hasLanguage;
        bool hasCollaboration;
        bool hasAggregate;
        uint256 totalScore;
        uint256 diversityScore;
    }

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

    event CredentialUpdated(
        address indexed user,
        bytes32 indexed credentialHash,
        string ipfsHash
    );

    // Errors
    error InvalidProof();
    error CredentialExpired();
    error CredentialNotFound();
    error CredentialAlreadyRevoked();
    error UnauthorizedRevocation();
    error InvalidCredentialType();
    error ArrayLengthMismatch();

    // Core verification functions
    function verifyCredential(
        bytes calldata proofData,
        uint256[] calldata publicSignals,
        CredentialMetadata calldata metadata
    ) external returns (bytes32 credentialHash);

    function verifySingleCredential(
        CredentialType credentialType,
        bytes calldata proof,
        uint256[] calldata publicSignals,
        uint256 expiresAt
    ) external returns (bytes32 credentialHash);

    function batchVerifyCredentials(
        CredentialType[] calldata types,
        bytes[] calldata proofs,
        uint256[][] calldata publicSignals,
        uint256[] calldata expirationTimes
    ) external returns (bytes32[] memory credentialHashes);

    // Credential management functions
    function isCredentialValid(bytes32 credentialHash) external view returns (bool);

    function getCredentialDetails(bytes32 credentialHash)
        external
        view
        returns (
            CredentialType credentialType,
            uint256 issuedAt,
            uint256 expiresAt,
            bool isRevoked,
            string memory ipfsHash
        );

    function getUserCredentialSummary(address user)
        external
        view
        returns (CompositeCredential memory);

    function revokeCredential(bytes32 credentialHash) external;

    function updateCredentialIPFS(bytes32 credentialHash, string calldata ipfsHash) external;

    // View functions
    function verifiedCredentials(address user, bytes32 credentialHash)
        external
        view
        returns (bool);

    function credentialCount(address user) external view returns (uint256);

    function credentialMetadata(bytes32 credentialHash)
        external
        view
        returns (CredentialMetadata memory);

    // Emergency functions
    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);
} 