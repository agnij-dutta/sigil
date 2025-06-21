// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import "../src/verifiers/RepositoryVerifier.sol";
import "../src/verifiers/LanguageVerifier.sol";
import "../src/verifiers/CollaborationVerifier.sol";
import "../src/verifiers/AggregateVerifier.sol";
import "../src/verifiers/SigilCredentialVerifier.sol";
import "../src/registry/CredentialRegistry.sol";
import "../libraries/ProofVerification.sol";

contract ComprehensiveContractTests is Test {
    RepositoryVerifier repositoryVerifier;
    LanguageVerifier languageVerifier;
    CollaborationVerifier collaborationVerifier;
    AggregateVerifier aggregateVerifier;
    SigilCredentialVerifier mainVerifier;
    CredentialRegistry registry;
    
    // Test data
    bytes validProofData;
    uint256[10] validRepoInputs;
    uint256[2] validLangInputs;
    uint256[5] validCollabInputs;
    uint256[8] validAggInputs;

    function setUp() public {
        // Deploy all contracts
        repositoryVerifier = new RepositoryVerifier();
        languageVerifier = new LanguageVerifier();
        collaborationVerifier = new CollaborationVerifier();
        aggregateVerifier = new AggregateVerifier();
        mainVerifier = new SigilCredentialVerifier();
        registry = new CredentialRegistry();
        
        // Set up valid proof data (256 bytes minimum)
        validProofData = abi.encodePacked(
            uint256(1), uint256(2), // proof.a
            uint256(3), uint256(4), uint256(5), uint256(6), // proof.b
            uint256(7), uint256(8), // proof.c
            // Padding to reach 256 bytes
            uint256(0), uint256(0), uint256(0), uint256(0),
            uint256(0), uint256(0), uint256(0), uint256(0),
            uint256(0), uint256(0), uint256(0), uint256(0),
            uint256(0), uint256(0), uint256(0), uint256(0),
            uint256(0), uint256(0), uint256(0), uint256(0),
            uint256(0), uint256(0), uint256(0), uint256(0)
        );
        
        // Set up valid repository inputs (10 inputs)
        validRepoInputs[0] = uint256(keccak256("test-repo")) >> 8; // repoHash
        validRepoInputs[1] = uint256(uint160(address(this))); // userAddress
        validRepoInputs[2] = 10; // minCommits
        validRepoInputs[3] = 100; // maxCommits
        validRepoInputs[4] = 1000; // minLOC
        validRepoInputs[5] = 10000; // maxLOC
        validRepoInputs[6] = 3; // languageCount
        validRepoInputs[7] = 2; // minCollaborators
        validRepoInputs[8] = 10; // maxCollaborators
        validRepoInputs[9] = block.timestamp; // proofTimestamp
        
        // Set up valid language inputs (2 inputs)
        validLangInputs[0] = 3; // languageCount
        validLangInputs[1] = 100; // proficiencyScore
        
        // Set up valid collaboration inputs (5 inputs)
        validCollabInputs[0] = uint256(uint160(address(this))); // userAddress
        validCollabInputs[1] = 2; // minCollaborators
        validCollabInputs[2] = 10; // maxCollaborators
        validCollabInputs[3] = 70; // maxContributionPercent
        validCollabInputs[4] = 8; // teamDiversityScore
        
        // Set up valid aggregate inputs (8 inputs)
        validAggInputs[0] = 100; // totalCommits
        validAggInputs[1] = 10000; // totalLOC
        validAggInputs[2] = 5; // repoCount
        validAggInputs[3] = 85; // consistencyScore
        validAggInputs[4] = 75; // diversityScore
        validAggInputs[5] = 90; // qualityScore
        validAggInputs[6] = 3; // timeSpan
        validAggInputs[7] = block.timestamp; // timestamp
    }

    // ===== REPOSITORY VERIFIER TESTS =====
    
    function testRepositoryVerifierValidProof() public view {
        bool result = repositoryVerifier.verifyProof(validProofData, validRepoInputs);
        assertTrue(result, "Valid repository proof should pass");
    }

    function testRepositoryVerifierInvalidInputs() public {
        uint256[10] memory invalidInputs = validRepoInputs;
        invalidInputs[0] = 0; // Invalid repoHash
        
        bool result = repositoryVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Invalid inputs should fail");
    }

    function testRepositoryVerifierCommitRangeValidation() public {
        uint256[10] memory invalidInputs = validRepoInputs;
        invalidInputs[2] = 100; // minCommits
        invalidInputs[3] = 50;  // maxCommits (less than min)
        
        bool result = repositoryVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Invalid commit range should fail");
    }

    function testRepositoryVerifierShortProof() public {
        bytes memory shortProof = abi.encodePacked(uint256(1), uint256(2)); // Too short
        
        bool result = repositoryVerifier.verifyProof(shortProof, validRepoInputs);
        assertFalse(result, "Short proof should fail");
    }

    // ===== LANGUAGE VERIFIER TESTS =====
    
    function testLanguageVerifierValidProof() public view {
        bool result = languageVerifier.verifyProof(validProofData, validLangInputs);
        assertTrue(result, "Valid language proof should pass");
    }

    function testLanguageVerifierInvalidLanguageCount() public {
        uint256[2] memory invalidInputs = validLangInputs;
        invalidInputs[0] = 0; // Invalid language count
        
        bool result = languageVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Zero language count should fail");
    }

    function testLanguageVerifierExcessiveLanguageCount() public {
        uint256[2] memory invalidInputs = validLangInputs;
        invalidInputs[0] = 100; // Too many languages
        
        bool result = languageVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Excessive language count should fail");
    }

    // ===== COLLABORATION VERIFIER TESTS =====
    
    function testCollaborationVerifierValidProof() public view {
        bool result = collaborationVerifier.verifyProof(validProofData, validCollabInputs);
        assertTrue(result, "Valid collaboration proof should pass");
    }

    function testCollaborationVerifierInvalidUserAddress() public {
        uint256[5] memory invalidInputs = validCollabInputs;
        invalidInputs[0] = 0; // Invalid user address
        
        bool result = collaborationVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Zero user address should fail");
    }

    function testCollaborationVerifierInvalidCollaboratorRange() public {
        uint256[5] memory invalidInputs = validCollabInputs;
        invalidInputs[1] = 10; // minCollaborators
        invalidInputs[2] = 5;  // maxCollaborators (less than min)
        
        bool result = collaborationVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Invalid collaborator range should fail");
    }

    function testCollaborationVerifierExcessiveContribution() public {
        uint256[5] memory invalidInputs = validCollabInputs;
        invalidInputs[3] = 150; // > 100% contribution
        
        bool result = collaborationVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Excessive contribution percentage should fail");
    }

    // ===== AGGREGATE VERIFIER TESTS =====
    
    function testAggregateVerifierValidProof() public view {
        bool result = aggregateVerifier.verifyProof(validProofData, validAggInputs);
        assertTrue(result, "Valid aggregate proof should pass");
    }

    function testAggregateVerifierZeroValues() public {
        uint256[8] memory invalidInputs = validAggInputs;
        invalidInputs[0] = 0; // Zero total commits
        
        bool result = aggregateVerifier.verifyProof(validProofData, invalidInputs);
        assertFalse(result, "Zero values should fail");
    }

    // ===== MAIN VERIFIER TESTS =====
    
    function testMainVerifierSingleCredentialRepository() public {
        uint256[] memory dynamicInputs = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            dynamicInputs[i] = validRepoInputs[i];
        }
        
        bytes32 credentialHash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.REPOSITORY,
            validProofData,
            dynamicInputs,
            block.timestamp + 3600
        );
        
        assertTrue(credentialHash != bytes32(0), "Should return valid credential hash");
        assertTrue(mainVerifier.verifiedCredentials(address(this), credentialHash), "Credential should be verified");
        assertEq(mainVerifier.credentialCount(address(this)), 1, "Credential count should increase");
    }

    function testMainVerifierSingleCredentialLanguage() public {
        uint256[] memory dynamicInputs = new uint256[](2);
        for (uint256 i = 0; i < 2; i++) {
            dynamicInputs[i] = validLangInputs[i];
        }
        
        bytes32 credentialHash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            dynamicInputs,
            block.timestamp + 3600
        );
        
        assertTrue(credentialHash != bytes32(0), "Should return valid credential hash");
    }

    function testMainVerifierExpiredCredential() public {
        uint256[] memory dynamicInputs = new uint256[](2);
        for (uint256 i = 0; i < 2; i++) {
            dynamicInputs[i] = validLangInputs[i];
        }
        
        vm.expectRevert("Credential expired");
        mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            dynamicInputs,
            block.timestamp - 1 // Expired
        );
    }

    function testMainVerifierPauseUnpause() public {
        mainVerifier.pause();
        assertTrue(mainVerifier.paused(), "Contract should be paused");
        
        uint256[] memory dynamicInputs = new uint256[](2);
        for (uint256 i = 0; i < 2; i++) {
            dynamicInputs[i] = validLangInputs[i];
        }
        
        vm.expectRevert("Contract is paused");
        mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            dynamicInputs,
            block.timestamp + 3600
        );
        
        mainVerifier.unpause();
        assertFalse(mainVerifier.paused(), "Contract should be unpaused");
        
        // Should work after unpause
        bytes32 hash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            dynamicInputs,
            block.timestamp + 3600
        );
        assertTrue(hash != bytes32(0), "Should work after unpause");
    }

    // ===== CREDENTIAL REGISTRY TESTS =====
    
    function testCredentialRegistryRegisterCredential() public {
        bytes32 credentialHash = keccak256("test-credential");
        
        // Authorize this contract as a verifier
        registry.authorizeVerifier(address(this), true);
        
        registry.registerCredential(
            credentialHash,
            address(this),
            1, // credentialType
            block.timestamp + 3600, // expiresAt
            "ipfs://test", // ipfsHash
            100 // score
        );
        
        assertTrue(registry.isCredentialValid(credentialHash), "Credential should be valid");
        assertEq(registry.userCredentialCount(address(this)), 1, "User should have 1 credential");
    }

    function testCredentialRegistryRevokeCredential() public {
        bytes32 credentialHash = keccak256("test-credential");
        
        // Authorize this contract as a verifier
        registry.authorizeVerifier(address(this), true);
        
        registry.registerCredential(
            credentialHash,
            address(this),
            1, // credentialType
            block.timestamp + 3600, // expiresAt
            "ipfs://test", // ipfsHash
            100 // score
        );
        
        registry.revokeCredential(credentialHash);
        assertFalse(registry.isCredentialValid(credentialHash), "Credential should be revoked");
    }

    // ===== PROOF VERIFICATION LIBRARY TESTS =====
    
    function testProofVerificationLibrary() public view {
        ProofVerification.VerifyingKey memory vk = ProofVerification.getDefaultVerifyingKey(3);
        
        assertEq(vk.icLength, 3, "IC length should be 3");
        assertEq(vk.alpha[0], 1, "Alpha should be initialized");
        
        ProofVerification.Proof memory proof = ProofVerification.decodeProof(validProofData);
        assertEq(proof.a[0], 1, "Proof should be decoded correctly");
        
        bytes32 hash = ProofVerification.hashCredential(
            address(this),
            1,
            new uint256[](2),
            block.timestamp
        );
        assertTrue(hash != bytes32(0), "Should return valid hash");
    }

    // ===== GAS USAGE TESTS =====
    
    function testGasUsageRepositoryVerifier() public {
        uint256 gasBefore = gasleft();
        repositoryVerifier.verifyProof(validProofData, validRepoInputs);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Repository verifier gas usage:", gasUsed);
        assertTrue(gasUsed < 120000, "Gas usage should be reasonable");
    }

    function testGasUsageMainVerifier() public {
        uint256[] memory dynamicInputs = new uint256[](2);
        for (uint256 i = 0; i < 2; i++) {
            dynamicInputs[i] = validLangInputs[i];
        }
        
        uint256 gasBefore = gasleft();
        mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            dynamicInputs,
            block.timestamp + 3600
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Main verifier gas usage:", gasUsed);
        assertTrue(gasUsed < 250000, "Gas usage should be reasonable");
    }

    // ===== FUZZ TESTS =====
    
    function testFuzzRepositoryInputs(
        uint32 minCommits,
        uint32 maxCommits,
        uint32 minLOC,
        uint32 maxLOC,
        uint8 languages,
        uint8 minCollabs,
        uint8 maxCollabs
    ) public view {
        vm.assume(minCommits <= maxCommits && maxCommits <= 100000);
        vm.assume(minLOC <= maxLOC && maxLOC <= 100000000);
        vm.assume(languages > 0 && languages <= 50);
        vm.assume(minCollabs <= maxCollabs && maxCollabs <= 1000);
        
        uint256[10] memory inputs = validRepoInputs;
        inputs[2] = minCommits;
        inputs[3] = maxCommits;
        inputs[4] = minLOC;
        inputs[5] = maxLOC;
        inputs[6] = languages;
        inputs[7] = minCollabs;
        inputs[8] = maxCollabs;
        
        bool result = repositoryVerifier.verifyProof(validProofData, inputs);
        assertTrue(result, "Valid inputs should always pass");
    }

    // ===== EDGE CASE TESTS =====
    
    function testEdgeCaseMaxInputValues() public view {
        uint256[10] memory maxInputs = validRepoInputs;
        maxInputs[2] = 99999; // maxCommits
        maxInputs[3] = 99999; // maxCommits
        maxInputs[4] = 99999999; // maxLOC
        maxInputs[5] = 99999999; // maxLOC
        maxInputs[6] = 50; // maxLanguages
        maxInputs[7] = 999; // maxCollaborators
        maxInputs[8] = 999; // maxCollaborators
        
        bool result = repositoryVerifier.verifyProof(validProofData, maxInputs);
        assertTrue(result, "Max valid values should pass");
    }

    function testEdgeCaseMinInputValues() public view {
        uint256[10] memory minInputs = validRepoInputs;
        minInputs[2] = 1; // minCommits
        minInputs[3] = 1; // maxCommits
        minInputs[4] = 1; // minLOC
        minInputs[5] = 1; // maxLOC
        minInputs[6] = 1; // languages
        minInputs[7] = 1; // minCollaborators
        minInputs[8] = 1; // maxCollaborators
        
        bool result = repositoryVerifier.verifyProof(validProofData, minInputs);
        assertTrue(result, "Min valid values should pass");
    }

    // ===== INTEGRATION TESTS =====
    
    function testFullCredentialWorkflow() public {
        // Issue repository credential
        uint256[] memory repoInputs = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            repoInputs[i] = validRepoInputs[i];
        }
        
        bytes32 repoHash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.REPOSITORY,
            validProofData,
            repoInputs,
            block.timestamp + 3600
        );
        
        // Issue language credential
        uint256[] memory langInputs = new uint256[](2);
        for (uint256 i = 0; i < 2; i++) {
            langInputs[i] = validLangInputs[i];
        }
        
        bytes32 langHash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            langInputs,
            block.timestamp + 3600
        );
        
        // Verify both credentials exist
        assertTrue(mainVerifier.verifiedCredentials(address(this), repoHash), "Repository credential should exist");
        assertTrue(mainVerifier.verifiedCredentials(address(this), langHash), "Language credential should exist");
        assertEq(mainVerifier.credentialCount(address(this)), 2, "Should have 2 credentials");
        
        // Test credential details
        (
            ISigilVerifier.CredentialType credType,
            uint256 issuedAt,
            uint256 expiresAt,
            bool isRevoked,
            string memory ipfsHash
        ) = mainVerifier.getCredentialDetails(repoHash);
        
        assertEq(uint256(credType), uint256(ISigilVerifier.CredentialType.REPOSITORY), "Should be repository type");
        assertTrue(issuedAt > 0, "Should have issued timestamp");
        assertTrue(expiresAt > block.timestamp, "Should not be expired");
        assertFalse(isRevoked, "Should not be revoked");
        
        // Test revocation
        mainVerifier.revokeCredential(repoHash);
        assertFalse(mainVerifier.isCredentialValid(repoHash), "Revoked credential should be invalid");
        
        // Test IPFS update
        mainVerifier.updateCredentialIPFS(langHash, "ipfs://test-hash");
        (, , , , string memory updatedHash) = mainVerifier.getCredentialDetails(langHash);
        assertEq(updatedHash, "ipfs://test-hash", "IPFS hash should be updated");
    }

    // ===== ADDITIONAL SECURITY TESTS =====
    
    function testUnauthorizedRegistryAccess() public {
        bytes32 credentialHash = keccak256("test-credential");
        
        // Should fail without authorization
        vm.expectRevert(CredentialRegistry.UnauthorizedVerifier.selector);
        registry.registerCredential(
            credentialHash,
            address(this),
            1,
            block.timestamp + 3600,
            "ipfs://test",
            100
        );
    }

    function testRegistryPauseUnpause() public {
        // First authorize the verifier before testing pause functionality
        registry.authorizeVerifier(address(this), true);
        
        registry.pause();
        assertTrue(registry.paused(), "Registry should be paused");
        
        bytes32 credentialHash = keccak256("test-credential");
        
        vm.expectRevert(CredentialRegistry.ContractPaused.selector);
        registry.registerCredential(
            credentialHash,
            address(this),
            1,
            block.timestamp + 3600,
            "ipfs://test",
            100
        );
        
        registry.unpause();
        assertFalse(registry.paused(), "Registry should be unpaused");
    }
}
