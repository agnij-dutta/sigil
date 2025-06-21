// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "lib/forge-std/src/Test.sol";
import "../src/verifiers/RepositoryVerifier.sol";
import "../src/verifiers/LanguageVerifier.sol";
import "../src/verifiers/CollaborationVerifier.sol";
import "../src/verifiers/AggregateVerifier.sol";
import "../src/verifiers/SigilCredentialVerifier.sol";
import "../src/registry/CredentialRegistry.sol";

contract FinalStressTests is Test {
    SigilCredentialVerifier mainVerifier;
    CredentialRegistry registry;
    
    bytes validProofData;

    function setUp() public {
        mainVerifier = new SigilCredentialVerifier();
        registry = new CredentialRegistry();
        
        validProofData = abi.encodePacked(
            uint256(1), uint256(2), // proof.a
            uint256(3), uint256(4), uint256(5), uint256(6), // proof.b
            uint256(7), uint256(8) // proof.c
        );
    }

    function testStressBatchCredentialVerification() public {
        ISigilVerifier.CredentialType[] memory types = new ISigilVerifier.CredentialType[](4);
        types[0] = ISigilVerifier.CredentialType.REPOSITORY;
        types[1] = ISigilVerifier.CredentialType.LANGUAGE;
        types[2] = ISigilVerifier.CredentialType.COLLABORATION;
        types[3] = ISigilVerifier.CredentialType.AGGREGATE;
        
        bytes[] memory proofs = new bytes[](4);
        proofs[0] = validProofData;
        proofs[1] = validProofData;
        proofs[2] = validProofData;
        proofs[3] = validProofData;
        
        uint256[][] memory publicSignals = new uint256[][](4);
        
        // Repository inputs (10)
        publicSignals[0] = new uint256[](10);
        publicSignals[0][0] = uint256(keccak256("repo-1"));
        publicSignals[0][1] = uint256(uint160(address(this)));
        publicSignals[0][2] = 10;
        publicSignals[0][3] = 100;
        publicSignals[0][4] = 1000;
        publicSignals[0][5] = 10000;
        publicSignals[0][6] = 3;
        publicSignals[0][7] = 2;
        publicSignals[0][8] = 10;
        publicSignals[0][9] = block.timestamp;
        
        // Language inputs (2)
        publicSignals[1] = new uint256[](2);
        publicSignals[1][0] = 5;
        publicSignals[1][1] = 95;
        
        // Collaboration inputs (5)
        publicSignals[2] = new uint256[](5);
        publicSignals[2][0] = uint256(uint160(address(this)));
        publicSignals[2][1] = 3;
        publicSignals[2][2] = 15;
        publicSignals[2][3] = 80;
        publicSignals[2][4] = 9;
        
        // Aggregate inputs (8)
        publicSignals[3] = new uint256[](8);
        publicSignals[3][0] = 500;
        publicSignals[3][1] = 50000;
        publicSignals[3][2] = 10;
        publicSignals[3][3] = 90;
        publicSignals[3][4] = 85;
        publicSignals[3][5] = 95;
        publicSignals[3][6] = 6;
        publicSignals[3][7] = block.timestamp;
        
        uint256[] memory expirationTimes = new uint256[](4);
        expirationTimes[0] = block.timestamp + 3600;
        expirationTimes[1] = block.timestamp + 3600;
        expirationTimes[2] = block.timestamp + 3600;
        expirationTimes[3] = block.timestamp + 3600;
        
        uint256 gasBefore = gasleft();
        bytes32[] memory hashes = mainVerifier.batchVerifyCredentials(
            types,
            proofs,
            publicSignals,
            expirationTimes
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Batch verification gas usage:", gasUsed);
        assertEq(hashes.length, 4, "Should return 4 credential hashes");
        assertEq(mainVerifier.credentialCount(address(this)), 4, "Should have 4 credentials");
        assertTrue(gasUsed < 1000000, "Batch verification should be efficient");
    }

    function testStressRegistryWithManyCredentials() public {
        registry.authorizeVerifier(address(this), true);
        
        uint256 numCredentials = 10;
        bytes32[] memory credentialHashes = new bytes32[](numCredentials);
        
        uint256 gasBefore = gasleft();
        
        for (uint256 i = 0; i < numCredentials; i++) {
            credentialHashes[i] = keccak256(abi.encodePacked("credential", i));
            registry.registerCredential(
                credentialHashes[i],
                address(this),
                1, // credentialType
                block.timestamp + 3600,
                string(abi.encodePacked("ipfs://hash", i)),
                100 + i
            );
        }
        
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas for registering", numCredentials, "credentials:", gasUsed);
        
        // Verify all credentials are valid
        for (uint256 i = 0; i < numCredentials; i++) {
            assertTrue(registry.isCredentialValid(credentialHashes[i]), "All credentials should be valid");
        }
        
        assertEq(registry.userCredentialCount(address(this)), numCredentials, "Should have correct count");
        assertEq(registry.totalCredentials(), numCredentials, "Total should match");
    }

    function testStressVerifierWithVariousInputs() public {
        RepositoryVerifier repoVerifier = new RepositoryVerifier();
        
        // Test 100 different input combinations
        uint256 successCount = 0;
        uint256 totalGas = 0;
        
        for (uint256 i = 1; i <= 100; i++) {
            uint256[10] memory inputs;
            inputs[0] = uint256(keccak256(abi.encodePacked("repo", i)));
            inputs[1] = uint256(uint160(address(uint160(i))));
            inputs[2] = i % 50 + 1; // minCommits
            inputs[3] = inputs[2] + (i % 100) + 1; // maxCommits
            inputs[4] = (i % 1000) + 1; // minLOC
            inputs[5] = inputs[4] + (i % 10000) + 1; // maxLOC
            inputs[6] = (i % 20) + 1; // languageCount
            inputs[7] = i % 10 + 1; // minCollaborators
            inputs[8] = inputs[7] + (i % 20) + 1; // maxCollaborators
            inputs[9] = block.timestamp;
            
            uint256 gasBefore = gasleft();
            bool result = repoVerifier.verifyProof(validProofData, inputs);
            uint256 gasUsed = gasBefore - gasleft();
            
            totalGas += gasUsed;
            if (result) successCount++;
        }
        
        console.log("Success rate:", successCount, "out of 100");
        console.log("Average gas per verification:", totalGas / 100);
        
        assertTrue(successCount == 100, "All valid inputs should pass");
        assertTrue(totalGas / 100 < 100000, "Average gas should be reasonable");
    }

    function testContractInteractionResilience() public {
        // Test contract behavior under various conditions
        
        // 1. Test with paused/unpaused cycles
        mainVerifier.pause();
        assertTrue(mainVerifier.paused(), "Should be paused");
        
        mainVerifier.unpause();
        assertFalse(mainVerifier.paused(), "Should be unpaused");
        
        // 2. Test credential revocation and validation
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = 3;
        inputs[1] = 100;
        
        bytes32 credHash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            inputs,
            block.timestamp + 3600
        );
        
        assertTrue(mainVerifier.isCredentialValid(credHash), "Credential should be valid");
        
        mainVerifier.revokeCredential(credHash);
        assertFalse(mainVerifier.isCredentialValid(credHash), "Revoked credential should be invalid");
        
        // 3. Test IPFS hash updates
        bytes32 newCredHash = mainVerifier.verifySingleCredential(
            ISigilVerifier.CredentialType.LANGUAGE,
            validProofData,
            inputs,
            block.timestamp + 3600
        );
        
        mainVerifier.updateCredentialIPFS(newCredHash, "ipfs://updated-hash");
        
        (, , , , string memory ipfsHash) = mainVerifier.getCredentialDetails(newCredHash);
        assertEq(ipfsHash, "ipfs://updated-hash", "IPFS hash should be updated");
    }

    function testEdgeCasesAndBoundaries() public {
        RepositoryVerifier repoVerifier = new RepositoryVerifier();
        
        // Test boundary values
        uint256[10] memory boundaryInputs;
        boundaryInputs[0] = 1; // smallest non-zero hash
        boundaryInputs[1] = 1; // smallest non-zero address
        boundaryInputs[2] = 1; // min commits
        boundaryInputs[3] = 1; // max commits (same as min)
        boundaryInputs[4] = 1; // min LOC
        boundaryInputs[5] = 1; // max LOC (same as min)
        boundaryInputs[6] = 1; // min languages
        boundaryInputs[7] = 1; // min collaborators
        boundaryInputs[8] = 1; // max collaborators (same as min)
        boundaryInputs[9] = block.timestamp;
        
        bool result = repoVerifier.verifyProof(validProofData, boundaryInputs);
        assertTrue(result, "Boundary values should be valid");
        
        // Test invalid boundary (zero values where not allowed)
        boundaryInputs[0] = 0; // Invalid repo hash
        result = repoVerifier.verifyProof(validProofData, boundaryInputs);
        assertFalse(result, "Zero repo hash should be invalid");
    }

    function testGasEfficiencyComparison() public {
        // Compare gas usage across different verifier types
        RepositoryVerifier repoVerifier = new RepositoryVerifier();
        LanguageVerifier langVerifier = new LanguageVerifier();
        CollaborationVerifier collabVerifier = new CollaborationVerifier();
        AggregateVerifier aggVerifier = new AggregateVerifier();
        
        // Repository verification
        uint256[10] memory repoInputs = [
            uint256(12345), uint256(uint160(address(this))), uint256(10), uint256(100),
            uint256(1000), uint256(10000), uint256(3), uint256(2), uint256(10), block.timestamp
        ];
        uint256 gasBefore = gasleft();
        repoVerifier.verifyProof(validProofData, repoInputs);
        uint256 repoGas = gasBefore - gasleft();
        
        // Language verification
        uint256[2] memory langInputs = [uint256(3), uint256(100)];
        gasBefore = gasleft();
        langVerifier.verifyProof(validProofData, langInputs);
        uint256 langGas = gasBefore - gasleft();
        
        // Collaboration verification
        uint256[5] memory collabInputs = [
            uint256(uint160(address(this))), uint256(2), uint256(10), uint256(70), uint256(8)
        ];
        gasBefore = gasleft();
        collabVerifier.verifyProof(validProofData, collabInputs);
        uint256 collabGas = gasBefore - gasleft();
        
        // Aggregate verification
        uint256[8] memory aggInputs = [
            uint256(100), uint256(10000), uint256(5), uint256(85),
            uint256(75), uint256(90), uint256(3), block.timestamp
        ];
        gasBefore = gasleft();
        aggVerifier.verifyProof(validProofData, aggInputs);
        uint256 aggGas = gasBefore - gasleft();
        
        console.log("Repository verifier gas:", repoGas);
        console.log("Language verifier gas:", langGas);
        console.log("Collaboration verifier gas:", collabGas);
        console.log("Aggregate verifier gas:", aggGas);
        
        // All should be under reasonable limits
        assertTrue(repoGas < 100000, "Repository verification should be efficient");
        assertTrue(langGas < 50000, "Language verification should be efficient");
        assertTrue(collabGas < 50000, "Collaboration verification should be efficient");
        assertTrue(aggGas < 50000, "Aggregate verification should be efficient");
    }
}
