import { ethers } from "hardhat";
import { Contract } from "ethers";

/**
 * Main deployment script for Sigil contracts
 * Deploys all contracts in the correct order with proper configuration
 */
async function main() {
    console.log("🚀 Starting Sigil contract deployment...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Track deployed contracts
    const deployedContracts: { [key: string]: Contract } = {};

    try {
        // 1. Deploy Libraries
        console.log("\n📚 Deploying libraries...");
        
        const ProofVerificationLib = await ethers.getContractFactory("ProofVerification");
        const proofVerificationLib = await ProofVerificationLib.deploy();
        await proofVerificationLib.deployed();
        console.log("✅ ProofVerification library deployed to:", proofVerificationLib.address);

        // 2. Deploy Registry Contracts
        console.log("\n🗃️  Deploying registries...");
        
        const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
        const credentialRegistry = await CredentialRegistry.deploy();
        await credentialRegistry.deployed();
        deployedContracts.credentialRegistry = credentialRegistry;
        console.log("✅ CredentialRegistry deployed to:", credentialRegistry.address);

        // 3. Deploy Individual Verifiers
        console.log("\n🔍 Deploying verifier contracts...");
        
        // Create empty verifying keys for initial deployment (to be updated later)
        const emptyVK = {
            alpha: [0, 0],
            beta: [[0, 0], [0, 0]],
            gamma: [[0, 0], [0, 0]],
            delta: [[0, 0], [0, 0]],
            ic: [[0, 0]]
        };

        // Repository Verifier
        const RepositoryVerifier = await ethers.getContractFactory("RepositoryVerifier", {
            libraries: {
                ProofVerification: proofVerificationLib.address
            }
        });
        const repositoryVerifier = await RepositoryVerifier.deploy(emptyVK);
        await repositoryVerifier.deployed();
        deployedContracts.repositoryVerifier = repositoryVerifier;
        console.log("✅ RepositoryVerifier deployed to:", repositoryVerifier.address);

        // Language Verifier
        const LanguageVerifier = await ethers.getContractFactory("LanguageVerifier", {
            libraries: {
                ProofVerification: proofVerificationLib.address
            }
        });
        const languageVerifier = await LanguageVerifier.deploy(emptyVK);
        await languageVerifier.deployed();
        deployedContracts.languageVerifier = languageVerifier;
        console.log("✅ LanguageVerifier deployed to:", languageVerifier.address);

        // Collaboration Verifier
        const CollaborationVerifier = await ethers.getContractFactory("CollaborationVerifier", {
            libraries: {
                ProofVerification: proofVerificationLib.address
            }
        });
        const collaborationVerifier = await CollaborationVerifier.deploy(emptyVK);
        await collaborationVerifier.deployed();
        deployedContracts.collaborationVerifier = collaborationVerifier;
        console.log("✅ CollaborationVerifier deployed to:", collaborationVerifier.address);

        // Aggregate Verifier
        const AggregateVerifier = await ethers.getContractFactory("AggregateVerifier", {
            libraries: {
                ProofVerification: proofVerificationLib.address
            }
        });
        const aggregateVerifier = await AggregateVerifier.deploy(emptyVK);
        await aggregateVerifier.deployed();
        deployedContracts.aggregateVerifier = aggregateVerifier;
        console.log("✅ AggregateVerifier deployed to:", aggregateVerifier.address);

        // 4. Deploy Main Verifier
        console.log("\n🎯 Deploying main verifier...");
        
        const SigilCredentialVerifier = await ethers.getContractFactory("SigilCredentialVerifier", {
            libraries: {
                ProofVerification: proofVerificationLib.address
            }
        });
        const sigilCredentialVerifier = await SigilCredentialVerifier.deploy(
            repositoryVerifier.address,
            languageVerifier.address,
            collaborationVerifier.address,
            aggregateVerifier.address
        );
        await sigilCredentialVerifier.deployed();
        deployedContracts.sigilCredentialVerifier = sigilCredentialVerifier;
        console.log("✅ SigilCredentialVerifier deployed to:", sigilCredentialVerifier.address);

        // 5. Configure Registry
        console.log("\n⚙️  Configuring contracts...");
        
        // Authorize main verifier in registry
        await credentialRegistry.setVerifierAuthorization(sigilCredentialVerifier.address, true);
        console.log("✅ Main verifier authorized in registry");

        // 6. Verify deployment
        console.log("\n🔍 Verifying deployment...");
        
        // Check that all contracts are deployed
        for (const [name, contract] of Object.entries(deployedContracts)) {
            const code = await ethers.provider.getCode(contract.address);
            if (code === "0x") {
                throw new Error(`${name} deployment failed - no code at address`);
            }
            console.log(`✅ ${name} verified at ${contract.address}`);
        }

        // 7. Save deployment info
        const deploymentInfo = {
            network: await ethers.provider.getNetwork(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                proofVerificationLib: proofVerificationLib.address,
                credentialRegistry: credentialRegistry.address,
                repositoryVerifier: repositoryVerifier.address,
                languageVerifier: languageVerifier.address,
                collaborationVerifier: collaborationVerifier.address,
                aggregateVerifier: aggregateVerifier.address,
                sigilCredentialVerifier: sigilCredentialVerifier.address
            }
        };

        console.log("\n📄 Deployment Summary:");
        console.log(JSON.stringify(deploymentInfo, null, 2));

        // Save to file
        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const networkName = (await ethers.provider.getNetwork()).name;
        const filename = `${networkName}-${Date.now()}.json`;
        fs.writeFileSync(
            path.join(deploymentsDir, filename),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log(`\n💾 Deployment info saved to: deployments/${filename}`);

        console.log("\n🎉 Deployment completed successfully!");
        console.log("\n📋 Next steps:");
        console.log("1. Update verifying keys for each verifier contract");
        console.log("2. Deploy additional registry contracts if needed");
        console.log("3. Set up governance contracts");
        console.log("4. Configure front-end with contract addresses");

    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        throw error;
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 