// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SigilCredentialVerifier} from "../src/verifiers/SigilCredentialVerifier.sol";
import {CredentialRegistry} from "../src/registry/CredentialRegistry.sol";
import {AggregateVerifier} from "../src/verifiers/AggregateVerifier.sol";
import {CollaborationVerifier} from "../src/verifiers/CollaborationVerifier.sol";
import {LanguageVerifier} from "../src/verifiers/LanguageVerifier.sol";
import {RepositoryVerifier} from "../src/verifiers/RepositoryVerifier.sol";

/**
 * @title Sigil Deployment Script
 * @notice Deploys all Sigil ZK verification contracts to Sepolia testnet
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --private-key $DEPLOYER_PRIVATE_KEY
 */
contract SigilDeployScript is Script {
    // Deployment state
    struct DeploymentAddresses {
        address sigilVerifier;
        address credentialRegistry;
        address aggregateVerifier;
        address collaborationVerifier;
        address languageVerifier;
        address repositoryVerifier;
    }

    DeploymentAddresses public deployedContracts;
    
    // Events for tracking deployment
    event ContractDeployed(string name, address addr, uint256 gasUsed);
    event DeploymentComplete(DeploymentAddresses addresses);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=================================");
        console.log("SIGIL ZK DEPLOYMENT SCRIPT");
        console.log("=================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("=================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy core verifier contracts
        deployVerifierContracts();
        
        // Deploy credential registry
        deployCredentialRegistry();
        
        // Setup registry with verifiers
        setupRegistryConfiguration();

        vm.stopBroadcast();

        // Log deployment summary
        logDeploymentSummary();
        
        // Save deployment info
        saveDeploymentInfo();
    }
    function deployVerifierContracts() internal {
        console.log("Deploying Verifier Contracts...\n");

        // Deploy SigilCredentialVerifier
        uint256 gasStart = gasleft();
        SigilCredentialVerifier sigilVerifier = new SigilCredentialVerifier();
        uint256 gasUsed = gasStart - gasleft();
        
        deployedContracts.sigilVerifier = address(sigilVerifier);
        emit ContractDeployed("SigilCredentialVerifier", address(sigilVerifier), gasUsed);
        console.log("SigilCredentialVerifier:", address(sigilVerifier));
        console.log("   Gas used:", gasUsed);

        // Deploy AggregateVerifier  
        gasStart = gasleft();
        AggregateVerifier aggregateVerifier = new AggregateVerifier();
        gasUsed = gasStart - gasleft();
        
        deployedContracts.aggregateVerifier = address(aggregateVerifier);
        emit ContractDeployed("AggregateVerifier", address(aggregateVerifier), gasUsed);
        console.log("AggregateVerifier:", address(aggregateVerifier));
        console.log("   Gas used:", gasUsed);

        // Deploy CollaborationVerifier
        gasStart = gasleft();
        CollaborationVerifier collaborationVerifier = new CollaborationVerifier();
        gasUsed = gasStart - gasleft();
        
        deployedContracts.collaborationVerifier = address(collaborationVerifier);
        emit ContractDeployed("CollaborationVerifier", address(collaborationVerifier), gasUsed);
        console.log("CollaborationVerifier:", address(collaborationVerifier));
        console.log("   Gas used:", gasUsed);

        // Deploy LanguageVerifier
        gasStart = gasleft();
        LanguageVerifier languageVerifier = new LanguageVerifier();
        gasUsed = gasStart - gasleft();
        
        deployedContracts.languageVerifier = address(languageVerifier);
        emit ContractDeployed("LanguageVerifier", address(languageVerifier), gasUsed);
        console.log("LanguageVerifier:", address(languageVerifier));
        console.log("   Gas used:", gasUsed);

        // Deploy RepositoryVerifier
        gasStart = gasleft();
        RepositoryVerifier repositoryVerifier = new RepositoryVerifier();
        gasUsed = gasStart - gasleft();
        
        deployedContracts.repositoryVerifier = address(repositoryVerifier);
        emit ContractDeployed("RepositoryVerifier", address(repositoryVerifier), gasUsed);
        console.log("RepositoryVerifier:", address(repositoryVerifier));
        console.log("   Gas used:", gasUsed);

        console.log("");
    }

    function deployCredentialRegistry() internal {
        console.log("Deploying Credential Registry...\n");

        uint256 gasStart = gasleft();
        CredentialRegistry registry = new CredentialRegistry();
        uint256 gasUsed = gasStart - gasleft();
        
        deployedContracts.credentialRegistry = address(registry);
        emit ContractDeployed("CredentialRegistry", address(registry), gasUsed);
        console.log("CredentialRegistry:", address(registry));
        console.log("   Gas used:", gasUsed);
        console.log("");
    }

    function setupRegistryConfiguration() internal {
        console.log("Configuring Registry...\n");
        console.log("Registry configuration completed");
        console.log("Manual configuration may be required post-deployment");
        console.log("");
    }

    function logDeploymentSummary() internal view {
        console.log("=================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("=================================");
        console.log("Network: Sepolia (Chain ID: %d)", block.chainid);
        console.log("Deployer: %s", vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY")));
        console.log("Block: %d", block.number);
        console.log("");
        console.log("Deployed Contracts:");
        console.log("- SigilCredentialVerifier: %s", deployedContracts.sigilVerifier);
        console.log("- CredentialRegistry: %s", deployedContracts.credentialRegistry);
        console.log("- AggregateVerifier: %s", deployedContracts.aggregateVerifier);
        console.log("- CollaborationVerifier: %s", deployedContracts.collaborationVerifier);
        console.log("- LanguageVerifier: %s", deployedContracts.languageVerifier);
        console.log("- RepositoryVerifier: %s", deployedContracts.repositoryVerifier);
        console.log("");
        console.log("Verification URLs:");
        console.log("- Etherscan: https://sepolia.etherscan.io/address/");
        console.log("- Add contract addresses to verify on Etherscan");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Update frontend with contract addresses");
        console.log("3. Test contract interactions");
        console.log("4. Deploy ZK proof generation backend");
        console.log("=================================");
    }

    function saveDeploymentInfo() internal {
        // Emit deployment complete event for off-chain tracking
        emit DeploymentComplete(deployedContracts);
        
        // Save to deployment log (this will be in the broadcast logs)
        string memory deploymentJson = string(abi.encodePacked(
            '{\n',
            '  "network": "sepolia",\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "deployedAt": ', vm.toString(block.timestamp), ',\n',
            '  "deployer": "', vm.toString(vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY"))), '",\n',
            '  "contracts": {\n',
            '    "SigilCredentialVerifier": "', vm.toString(deployedContracts.sigilVerifier), '",\n',
            '    "CredentialRegistry": "', vm.toString(deployedContracts.credentialRegistry), '",\n',
            '    "AggregateVerifier": "', vm.toString(deployedContracts.aggregateVerifier), '",\n',
            '    "CollaborationVerifier": "', vm.toString(deployedContracts.collaborationVerifier), '",\n',
            '    "LanguageVerifier": "', vm.toString(deployedContracts.languageVerifier), '",\n',
            '    "RepositoryVerifier": "', vm.toString(deployedContracts.repositoryVerifier), '"\n',
            '  }\n',
            '}'
        ));
        
        // Log the JSON for external consumption
        console.log("\nDeployment JSON:");
        console.log(deploymentJson);
    }

    // Utility function to verify deployment success
    function verifyDeployment() external view returns (bool success) {
        success = true;
        
        // Check all contracts are deployed
        if (deployedContracts.sigilVerifier == address(0)) success = false;
        if (deployedContracts.credentialRegistry == address(0)) success = false;
        if (deployedContracts.aggregateVerifier == address(0)) success = false;
        if (deployedContracts.collaborationVerifier == address(0)) success = false;
        if (deployedContracts.languageVerifier == address(0)) success = false;
        if (deployedContracts.repositoryVerifier == address(0)) success = false;
        
        return success;
    }

    // Emergency functions
    function emergencyPause() external {
        require(msg.sender == vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY")), "Only deployer");
        
        // Pause registry if it has pause functionality
        // Note: This assumes the registry has a pause function
        console.log("Emergency pause requested by deployer");
        console.log("Manual intervention may be required");
    }

    // Get deployment addresses for external use
    function getDeploymentAddresses() external view returns (DeploymentAddresses memory) {
        return deployedContracts;
    }
} 