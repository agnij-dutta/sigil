#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('🔧 Setting up ZK Circuit Build Environment...\n');

// Configuration
const BUILD_DIR = path.join(__dirname, '../build/circuits');
const WEB3_DIR = path.join(__dirname, '../web3');
const CIRCUITS_DIR = path.join(WEB3_DIR, 'circuits');

// URLs for trusted setup files
const PTAU_URLS = {
  12: 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau',
  14: 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau',
  16: 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau'
};

// Create build directories
function createDirectories() {
  console.log('📁 Creating build directories...');
  
  const dirs = [
    BUILD_DIR,
    path.join(BUILD_DIR, 'compiled'),
    path.join(BUILD_DIR, 'ptau'), 
    path.join(BUILD_DIR, 'zkeys'),
    path.join(BUILD_DIR, 'verifiers'),
    path.join(BUILD_DIR, 'wasm'),
    path.join(BUILD_DIR, 'witnesses')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Created: ${dir}`);
    } else {
      console.log(`  📂 Exists: ${dir}`);
    }
  });
}

// Download file with progress
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${path.basename(destination)}`);
    
    const file = fs.createWriteStream(destination);
    let downloadedBytes = 0;
    
    https.get(url, (response) => {
      const totalBytes = parseInt(response.headers['content-length'] || '0');
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes * 100).toFixed(1);
          process.stdout.write(`\r  Progress: ${progress}% (${downloadedBytes}/${totalBytes} bytes)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`\n  ✅ Downloaded: ${path.basename(destination)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete file on error
      reject(err);
    });
  });
}

// Download trusted setup files
async function downloadTrustedSetup() {
  console.log('\n🔐 Downloading Trusted Setup Files...');
  
  for (const [power, url] of Object.entries(PTAU_URLS)) {
    const filename = `powersoftau28_hez_final_${power}.ptau`;
    const destination = path.join(BUILD_DIR, 'ptau', filename);
    
    if (!fs.existsSync(destination)) {
      try {
        await downloadFile(url, destination);
      } catch (error) {
        console.error(`❌ Failed to download ${filename}:`, error.message);
        // Continue with other files
      }
    } else {
      console.log(`  📂 Already exists: ${filename}`);
    }
  }
}

// Check system dependencies
function checkDependencies() {
  console.log('\n🔍 Checking System Dependencies...');
  
  const dependencies = [
    { cmd: 'circom --version', name: 'Circom' },
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'npm --version', name: 'NPM' }
  ];

  for (const dep of dependencies) {
    try {
      const output = execSync(dep.cmd, { encoding: 'utf8', stdio: 'pipe' });
      console.log(`  ✅ ${dep.name}: ${output.trim()}`);
    } catch (error) {
      console.log(`  ❌ ${dep.name}: Not installed or not in PATH`);
      if (dep.name === 'Circom') {
        console.log('     Install with: cargo install --git https://github.com/iden3/circom.git');
      }
    }
  }
}

// Install SnarkJS globally if not present
function installSnarkJS() {
  console.log('\n📦 Checking SnarkJS Installation...');
  
  try {
    execSync('snarkjs --version', { encoding: 'utf8', stdio: 'pipe' });
    console.log('  ✅ SnarkJS is already installed');
  } catch (error) {
    console.log('  📥 Installing SnarkJS globally...');
    try {
      execSync('npm install -g snarkjs', { stdio: 'inherit' });
      console.log('  ✅ SnarkJS installed successfully');
    } catch (installError) {
      console.error('  ❌ Failed to install SnarkJS:', installError.message);
    }
  }
}

// Create circuit compilation script
function createCompilationScript() {
  console.log('\n📝 Creating Circuit Compilation Script...');
  
  const script = `#!/bin/bash

# Circuit Compilation Script
set -e

echo "🔧 Compiling Sigil ZK Circuits..."

CIRCUITS_DIR="web3/circuits"
BUILD_DIR="build/circuits"

# Circuits to compile
CIRCUITS=(
  "core/primitives/hash_chain"
  "core/primitives/merkle_tree" 
  "core/primitives/range_proof"
  "core/primitives/signature_verify"
  "core/aggregation/commit_aggregator"
  "core/aggregation/repo_aggregator"
  "core/aggregation/stats_aggregator"
  "core/aggregation/time_aggregator"
  "credentials/repository_credential"
  "credentials/language_credential"
  "credentials/collaboration_credential"
  "privacy/differential_privacy"
  "privacy/k_anonymity"
)

for circuit in "\${CIRCUITS[@]}"; do
  echo "📦 Compiling \${circuit}..."
  
  # Create output directory
  mkdir -p "\${BUILD_DIR}/compiled/\${circuit}"
  
  # Compile circuit
  circom "\${CIRCUITS_DIR}/\${circuit}.circom" \\
    --r1cs \\
    --wasm \\
    --sym \\
    --c \\
    --O2 \\
    -o "\${BUILD_DIR}/compiled/\${circuit}"
    
  echo "  ✅ Compiled \${circuit}"
done

echo "🎉 All circuits compiled successfully!"
`;

  const scriptPath = path.join(BUILD_DIR, 'compile.sh');
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  console.log(`  ✅ Created: ${scriptPath}`);
}

// Create circuit testing framework
function createTestingFramework() {
  console.log('\n🧪 Creating Circuit Testing Framework...');
  
  const testTemplate = `const circom_tester = require("circom_tester");
const chai = require("chai");
const assert = chai.assert;

describe("{{CIRCUIT_NAME}} Circuit Test", function () {
  this.timeout(100000);
  
  let circuit;

  before(async () => {
    circuit = await circom_tester.wasm(
      path.join(__dirname, "../web3/circuits/{{CIRCUIT_PATH}}.circom"),
      {
        output: path.join(__dirname, "../build/circuits/test"),
        recompile: true
      }
    );
  });

  it("Should compile successfully", async () => {
    assert.isOk(circuit);
  });

  it("Should generate valid witness", async () => {
    const input = {
      // Add test inputs here
    };
    
    const witness = await circuit.calculateWitness(input);
    await circuit.assertOut(witness, {
      // Add expected outputs here
    });
  });

  it("Should validate constraints", async () => {
    const input = {
      // Add constraint test inputs
    };
    
    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);
  });
});`;

  const testDir = path.join(__dirname, '../test/circuits');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testPath = path.join(testDir, 'circuit-test-template.js');
  fs.writeFileSync(testPath, testTemplate);
  console.log(`  ✅ Created test template: ${testPath}`);
}

// Main setup function
async function main() {
  try {
    console.log('🚀 Sigil ZK Circuit Setup\n');
    
    createDirectories();
    checkDependencies();
    installSnarkJS();
    await downloadTrustedSetup();
    createCompilationScript();
    createTestingFramework();
    
    console.log('\n✨ ZK Circuit Environment Setup Complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run circuits:compile');
    console.log('  2. Run: npm run circuits:ceremony');
    console.log('  3. Run: npm run circuits:test');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 