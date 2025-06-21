#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Running Trusted Setup Ceremony...\n');

// Configuration
const BUILD_DIR = path.join(__dirname, '../build/circuits');
const PTAU_DIR = path.join(BUILD_DIR, 'ptau');
const ZKEYS_DIR = path.join(BUILD_DIR, 'zkeys');
const VERIFIERS_DIR = path.join(BUILD_DIR, 'verifiers');

// Circuit list from compile script
const CIRCUITS = [
  'hash_chain', 'merkle_tree', 'range_proof', 'set_membership', 'signature_verify',
  'commit_aggregator', 'repo_aggregator', 'stats_aggregator', 'time_aggregator',
  'repository_credential', 'language_credential', 'collaboration_credential',
  'consistency_credential', 'diversity_credential', 'leadership_credential',
  'differential_privacy', 'k_anonymity', 'zero_knowledge_sets'
];

// Check SnarkJS installation
function checkSnarkJS() {
  try {
    const version = execSync('snarkjs --version', { encoding: 'utf8' });
    console.log(`✅ SnarkJS found: ${version.trim()}`);
    return true;
  } catch (error) {
    console.error('❌ SnarkJS not found. Installing...');
    try {
      execSync('npm install -g snarkjs', { stdio: 'inherit' });
      console.log('✅ SnarkJS installed successfully');
      return true;
    } catch (installError) {
      console.error('❌ Failed to install SnarkJS:', installError.message);
      return false;
    }
  }
}

// Find best PTAU file for circuit size
function findBestPtau(circuitName) {
  const compiledDir = path.join(BUILD_DIR, 'compiled', circuitName);
  const r1csPath = path.join(compiledDir, `${circuitName}.r1cs`);
  
  if (!fs.existsSync(r1csPath)) {
    console.log(`⚠️  R1CS file not found for ${circuitName}`);
    return null;
  }

  // Read R1CS file size to estimate constraint count
  const stats = fs.statSync(r1csPath);
  const sizeKB = stats.size / 1024;
  
  // Choose PTAU based on estimated constraints
  let ptauPower;
  if (sizeKB < 100) ptauPower = 12;        // ~4K constraints
  else if (sizeKB < 1000) ptauPower = 14;  // ~16K constraints  
  else ptauPower = 16;                     // ~65K constraints
  
  const ptauFile = `powersoftau28_hez_final_${ptauPower}.ptau`;
  const ptauPath = path.join(PTAU_DIR, ptauFile);
  
  if (fs.existsSync(ptauPath)) {
    console.log(`  📏 Using ${ptauFile} for ${circuitName} (R1CS: ${sizeKB.toFixed(1)}KB)`);
    return ptauPath;
  } else {
    console.log(`  ⚠️  PTAU file not found: ${ptauFile}`);
    return null;
  }
}

// Run trusted setup for a single circuit
async function setupCircuit(circuitName) {
  console.log(`\n🔧 Setting up ${circuitName}...`);
  
  const compiledDir = path.join(BUILD_DIR, 'compiled', circuitName);
  const r1csPath = path.join(compiledDir, `${circuitName}.r1cs`);
  const zkeyPath = path.join(ZKEYS_DIR, `${circuitName}.zkey`);
  const vkeyPath = path.join(ZKEYS_DIR, `${circuitName}_vkey.json`);
  const verifierPath = path.join(VERIFIERS_DIR, `${circuitName}Verifier.sol`);
  
  // Check if R1CS exists
  if (!fs.existsSync(r1csPath)) {
    console.log(`  ❌ R1CS not found: ${r1csPath}`);
    return false;
  }
  
  // Find appropriate PTAU file
  const ptauPath = findBestPtau(circuitName);
  if (!ptauPath) {
    console.log(`  ❌ No suitable PTAU file found`);
    return false;
  }
  
  try {
    // Phase 1: Initial setup
    console.log(`  🔧 Phase 1: Initial setup...`);
    const initialZkey = path.join(ZKEYS_DIR, `${circuitName}_0000.zkey`);
    
    execSync(`snarkjs groth16 setup "${r1csPath}" "${ptauPath}" "${initialZkey}"`, {
      stdio: 'pipe'
    });
    
    // Phase 2: Contribution
    console.log(`  🔧 Phase 2: Adding contribution...`);
    const contributedZkey = path.join(ZKEYS_DIR, `${circuitName}_0001.zkey`);
    
    execSync(`snarkjs zkey contribute "${initialZkey}" "${contributedZkey}" --name="Sigil Setup" -e="$(date)"`, {
      stdio: 'pipe'
    });
    
    // Finalize zkey
    console.log(`  🔧 Phase 3: Finalizing zkey...`);
    execSync(`snarkjs zkey beacon "${contributedZkey}" "${zkeyPath}" 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"`, {
      stdio: 'pipe'
    });
    
    // Export verification key
    console.log(`  🔧 Exporting verification key...`);
    execSync(`snarkjs zkey export verificationkey "${zkeyPath}" "${vkeyPath}"`, {
      stdio: 'pipe'
    });
    
    // Generate Solidity verifier
    console.log(`  🔧 Generating Solidity verifier...`);
    execSync(`snarkjs zkey export solidityverifier "${zkeyPath}" "${verifierPath}"`, {
      stdio: 'pipe'
    });
    
    // Cleanup intermediate files
    fs.unlinkSync(initialZkey);
    fs.unlinkSync(contributedZkey);
    
    console.log(`  ✅ Setup complete for ${circuitName}`);
    
    // Verify setup
    const expectedFiles = [zkeyPath, vkeyPath, verifierPath];
    const allExist = expectedFiles.every(file => fs.existsSync(file));
    
    if (allExist) {
      console.log(`  📋 All setup files generated`);
      return true;
    } else {
      console.log(`  ⚠️  Some setup files missing`);
      return false;
    }
    
  } catch (error) {
    console.error(`  ❌ Setup failed for ${circuitName}:`);
    console.error(`     ${error.message}`);
    return false;
  }
}

// Generate proof utilities
function generateProofUtilities() {
  console.log('\n🛠️  Generating Proof Utilities...');
  
  const utilsDir = path.join(__dirname, '../web3/utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  // Create proof generator utility
  const proofGenCode = `
// Sigil ZK Proof Generator
import * as snarkjs from "snarkjs";
import { ethers } from "ethers";

export interface ProofInput {
  [key: string]: string | number | string[] | number[];
}

export interface Proof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  publicSignals: string[];
}

export class SigilProofGenerator {
  private wasmPath: string;
  private zkeyPath: string;
  
  constructor(circuitName: string) {
    this.wasmPath = \`../build/circuits/compiled/\${circuitName}/\${circuitName}_js/\${circuitName}.wasm\`;
    this.zkeyPath = \`../build/circuits/zkeys/\${circuitName}.zkey\`;
  }
  
  async generateProof(input: ProofInput): Promise<Proof> {
    try {
      console.log(\`Generating proof for input:\`, input);
      
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );
      
      // Format proof for Solidity
      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        publicSignals: publicSignals
      };
      
      return solidityProof;
      
    } catch (error) {
      console.error('Proof generation failed:', error);
      throw error;
    }
  }
  
  async verifyProof(proof: Proof, vkeyPath: string): Promise<boolean> {
    try {
      const vKey = JSON.parse(require('fs').readFileSync(vkeyPath, 'utf8'));
      
      const res = await snarkjs.groth16.verify(vKey, proof.publicSignals, {
        pi_a: proof.a,
        pi_b: proof.b,
        pi_c: proof.c,
        protocol: "groth16",
        curve: "bn128"
      });
      
      return res;
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
}

// Circuit-specific generators
${CIRCUITS.map(circuit => `
export class ${circuit.charAt(0).toUpperCase() + circuit.slice(1).replace(/_/g, '')}ProofGenerator extends SigilProofGenerator {
  constructor() {
    super("${circuit}");
  }
}
`).join('')}

export const CircuitGenerators = {
${CIRCUITS.map(circuit => `  ${circuit}: new ${circuit.charAt(0).toUpperCase() + circuit.slice(1).replace(/_/g, '')}ProofGenerator(),`).join('\n')}
};
`;

  const proofGenPath = path.join(utilsDir, 'proof-generator.ts');
  fs.writeFileSync(proofGenPath, proofGenCode);
  console.log(`  ✅ Created proof generator: ${proofGenPath}`);
  
  // Create verification utility
  const verificationCode = `
// Sigil ZK Proof Verification Utilities
import { ethers } from "ethers";

export interface VerificationResult {
  isValid: boolean;
  circuitName: string;
  publicSignals: string[];
  timestamp: number;
  gasUsed?: number;
}

export class SigilVerificationManager {
  private provider: ethers.providers.Provider;
  private verifierContracts: Map<string, ethers.Contract> = new Map();
  
  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
  }
  
  async loadVerifier(circuitName: string, contractAddress: string, abi: any[]): Promise<void> {
    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    this.verifierContracts.set(circuitName, contract);
  }
  
  async verifyProof(
    circuitName: string,
    proof: any,
    publicSignals: string[]
  ): Promise<VerificationResult> {
    const contract = this.verifierContracts.get(circuitName);
    if (!contract) {
      throw new Error(\`Verifier contract not loaded for \${circuitName}\`);
    }
    
    try {
      const tx = await contract.verifyProof(
        proof.a,
        proof.b,
        proof.c,
        publicSignals
      );
      
      const receipt = await tx.wait();
      
      return {
        isValid: true,
        circuitName,
        publicSignals,
        timestamp: Date.now(),
        gasUsed: receipt.gasUsed.toNumber()
      };
      
    } catch (error) {
      console.error(\`Verification failed for \${circuitName}:\`, error);
      return {
        isValid: false,
        circuitName,
        publicSignals,
        timestamp: Date.now()
      };
    }
  }
}
`;

  const verificationPath = path.join(utilsDir, 'verification-manager.ts');
  fs.writeFileSync(verificationPath, verificationCode);
  console.log(`  ✅ Created verification manager: ${verificationPath}`);
}

// Generate ceremony info
function generateCeremonyInfo() {
  console.log('\n📊 Generating Ceremony Information...');
  
  const info = {
    ceremonyAt: new Date().toISOString(),
    circuits: [],
    stats: {
      total: CIRCUITS.length,
      completed: 0,
      failed: 0
    }
  };
  
  CIRCUITS.forEach(circuitName => {
    const zkeyPath = path.join(ZKEYS_DIR, `${circuitName}.zkey`);
    const vkeyPath = path.join(ZKEYS_DIR, `${circuitName}_vkey.json`);
    const verifierPath = path.join(VERIFIERS_DIR, `${circuitName}Verifier.sol`);
    
    const circuitInfo = {
      name: circuitName,
      completed: fs.existsSync(zkeyPath) && fs.existsSync(vkeyPath) && fs.existsSync(verifierPath)
    };
    
    if (circuitInfo.completed) {
      try {
        const zkeyStats = fs.statSync(zkeyPath);
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
        
        circuitInfo.zkeySize = zkeyStats.size;
        circuitInfo.publicSignalsCount = vkey.nPublic || 0;
        circuitInfo.setupAt = zkeyStats.mtime.toISOString();
        
        info.stats.completed++;
      } catch (error) {
        circuitInfo.error = error.message;
        info.stats.failed++;
      }
    } else {
      info.stats.failed++;
    }
    
    info.circuits.push(circuitInfo);
  });
  
  // Save ceremony info
  const infoPath = path.join(BUILD_DIR, 'ceremony-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
  console.log(`  ✅ Ceremony info saved to: ${infoPath}`);
  
  return info;
}

// Main ceremony function
async function main() {
  try {
    console.log('🚀 Sigil Trusted Setup Ceremony\n');
    
    // Check dependencies
    if (!checkSnarkJS()) {
      process.exit(1);
    }
    
    // Ensure directories exist
    [ZKEYS_DIR, VERIFIERS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    console.log(`\n📂 PTAU Files: ${PTAU_DIR}`);
    console.log(`📂 ZKey Output: ${ZKEYS_DIR}`);
    console.log(`📂 Verifiers: ${VERIFIERS_DIR}\n`);
    
    // Run setup for all circuits
    let successCount = 0;
    let failCount = 0;
    
    for (const circuitName of CIRCUITS) {
      if (await setupCircuit(circuitName)) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    // Generate utilities
    generateProofUtilities();
    
    // Generate ceremony info
    const info = generateCeremonyInfo();
    
    // Summary
    console.log('\n📋 Ceremony Summary:');
    console.log(`  ✅ Successfully setup: ${successCount}/${CIRCUITS.length}`);
    console.log(`  ❌ Failed: ${failCount}/${CIRCUITS.length}`);
    
    if (failCount > 0) {
      console.log('\n⚠️  Some circuits failed setup. Check the logs above.');
      console.log('   Make sure circuits are compiled first.');
    } else {
      console.log('\n🎉 Trusted setup ceremony completed successfully!');
      console.log('\nGenerated files:');
      console.log(`  🔑 ZKeys: ${ZKEYS_DIR}/*.zkey`);
      console.log(`  🔐 Verification Keys: ${ZKEYS_DIR}/*_vkey.json`);
      console.log(`  📜 Solidity Verifiers: ${VERIFIERS_DIR}/*Verifier.sol`);
      console.log('\nNext steps:');
      console.log('  1. Run: npm run contracts:build');
      console.log('  2. Run: npm run contracts:deploy');
    }
    
  } catch (error) {
    console.error('\n❌ Ceremony failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, setupCircuit, CIRCUITS }; 