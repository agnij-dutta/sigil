// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RepositoryVerifier.sol";
import "./LanguageVerifier.sol";
import "./CollaborationVerifier.sol";
import "./AggregateVerifier.sol";
import "../interfaces/ISigilVerifier.sol";
import "../../libraries/ProofVerification.sol";

contract SigilCredentialVerifier is ISigilVerifier {
    using ProofVerification for bytes32;

    RepositoryVerifier public immutable repositoryVerifier;
    LanguageVerifier public immutable languageVerifier;
    CollaborationVerifier public immutable collaborationVerifier;
    AggregateVerifier public immutable aggregateVerifier;

    mapping(address => mapping(bytes32 => bool)) public override verifiedCredentials;
    mapping(address => uint256) public override credentialCount;
    mapping(bytes32 => CredentialMetadata) private _credentialMetadata;

    bool public override paused = false;
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        repositoryVerifier = new RepositoryVerifier();
        languageVerifier = new LanguageVerifier();
        collaborationVerifier = new CollaborationVerifier();
        aggregateVerifier = new AggregateVerifier();
    }

    function verifyCredential(
        bytes calldata proofData,
        uint256[] calldata publicSignals,
        CredentialMetadata calldata metadata
    ) external override whenNotPaused returns (bytes32 credentialHash) {
        require(block.timestamp <= metadata.expiresAt, "Credential expired");

        credentialHash = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            metadata.credentialType,
            publicSignals
        ));

        verifiedCredentials[msg.sender][credentialHash] = true;
        credentialCount[msg.sender]++;
        _credentialMetadata[credentialHash] = metadata;

        emit CredentialVerified(msg.sender, credentialHash, metadata.credentialType, block.timestamp);
        
        return credentialHash;
    }

    function verifySingleCredential(
        CredentialType credentialType,
        bytes calldata proof,
        uint256[] calldata publicSignals,
        uint256 expiresAt
    ) external override whenNotPaused returns (bytes32 credentialHash) {
        return _verifySingleCredentialInternal(credentialType, proof, publicSignals, expiresAt);
    }

    function batchVerifyCredentials(
        CredentialType[] calldata types,
        bytes[] calldata proofs,
        uint256[][] calldata publicSignals,
        uint256[] calldata expirationTimes
    ) external override whenNotPaused returns (bytes32[] memory credentialHashes) {
        require(types.length == proofs.length, "Array length mismatch");
        require(proofs.length == publicSignals.length, "Array length mismatch");
        require(publicSignals.length == expirationTimes.length, "Array length mismatch");

        credentialHashes = new bytes32[](types.length);

        for (uint256 i = 0; i < types.length; i++) {
            // Call internal verification function directly
            credentialHashes[i] = _verifySingleCredentialInternal(
                types[i],
                proofs[i],
                publicSignals[i],
                expirationTimes[i]
            );
        }

        return credentialHashes;
    }

    function _verifySingleCredentialInternal(
        CredentialType credentialType,
        bytes calldata proof,
        uint256[] calldata publicSignals,
        uint256 expiresAt
    ) internal returns (bytes32 credentialHash) {
        require(block.timestamp <= expiresAt, "Credential expired");

        bool isValid = false;

        if (credentialType == CredentialType.REPOSITORY && publicSignals.length == 10) {
            uint256[10] memory repoSignals;
            for (uint256 i = 0; i < 10; i++) {
                repoSignals[i] = publicSignals[i];
            }
            isValid = repositoryVerifier.verifyProof(proof, repoSignals);
        } else if (credentialType == CredentialType.LANGUAGE && publicSignals.length == 2) {
            uint256[2] memory langSignals;
            for (uint256 i = 0; i < 2; i++) {
                langSignals[i] = publicSignals[i];
            }
            isValid = languageVerifier.verifyProof(proof, langSignals);
        } else if (credentialType == CredentialType.COLLABORATION && publicSignals.length == 5) {
            uint256[5] memory collabSignals;
            for (uint256 i = 0; i < 5; i++) {
                collabSignals[i] = publicSignals[i];
            }
            isValid = collaborationVerifier.verifyProof(proof, collabSignals);
        } else if (credentialType == CredentialType.AGGREGATE && publicSignals.length == 8) {
            uint256[8] memory aggSignals;
            for (uint256 i = 0; i < 8; i++) {
                aggSignals[i] = publicSignals[i];
            }
            isValid = aggregateVerifier.verifyProof(proof, aggSignals);
        }

        if (!isValid) revert InvalidProof();

        // Include additional entropy for uniqueness
        credentialHash = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            block.number,
            credentialType,
            publicSignals,
            gasleft() // Additional entropy for uniqueness
        ));

        verifiedCredentials[msg.sender][credentialHash] = true;
        credentialCount[msg.sender]++;
        
        _credentialMetadata[credentialHash] = CredentialMetadata({
            credentialType: credentialType,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            ipfsHash: ""
        });

        emit CredentialVerified(msg.sender, credentialHash, credentialType, block.timestamp);
        
        return credentialHash;
    }

    function isCredentialValid(bytes32 credentialHash) external view override returns (bool) {
        CredentialMetadata memory metadata = _credentialMetadata[credentialHash];
        return !metadata.isRevoked && block.timestamp <= metadata.expiresAt;
    }

    function getCredentialDetails(bytes32 credentialHash)
        external
        view
        override
        returns (
            CredentialType credentialType,
            uint256 issuedAt,
            uint256 expiresAt,
            bool isRevoked,
            string memory ipfsHash
        )
    {
        CredentialMetadata memory metadata = _credentialMetadata[credentialHash];
        return (
            metadata.credentialType,
            metadata.issuedAt,
            metadata.expiresAt,
            metadata.isRevoked,
            metadata.ipfsHash
        );
    }

    function getUserCredentialSummary(address user)
        external
        view
        override
        returns (CompositeCredential memory)
    {
        // Simplified implementation
        return CompositeCredential({
            hasRepository: false,
            hasLanguage: false,
            hasCollaboration: false,
            hasAggregate: false,
            totalScore: 0,
            diversityScore: 0
        });
    }

    function revokeCredential(bytes32 credentialHash) external override {
        _credentialMetadata[credentialHash].isRevoked = true;
        emit CredentialRevoked(msg.sender, credentialHash, block.timestamp);
    }

    function updateCredentialIPFS(bytes32 credentialHash, string calldata ipfsHash) external override {
        _credentialMetadata[credentialHash].ipfsHash = ipfsHash;
        emit CredentialUpdated(msg.sender, credentialHash, ipfsHash);
    }

    function credentialMetadata(bytes32 credentialHash)
        external
        view
        override
        returns (CredentialMetadata memory)
    {
        return _credentialMetadata[credentialHash];
    }

    function pause() external override {
        paused = true;
    }

    function unpause() external override {
        paused = false;
    }
}
