#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Compiling Sigil ZK Circuits...\n');

// Configuration
const CIRCUITS_DIR = path.join(__dirname, '../web3/circuits');
const BUILD_DIR = path.join(__dirname, '../build/circuits');

// Circuit definitions with their paths
const CIRCUITS = [
  // Core primitives
  { name: 'hash_chain', path: 'core/primitives/hash_chain.circom' },
  { name: 'merkle_tree', path: 'core/primitives/merkle_tree.circom' },
  { name: 'range_proof', path: 'core/primitives/range_proof.circom' },
  { name: 'set_membership', path: 'core/primitives/set_membership.circom' },
  { name: 'signature_verify', path: 'core/primitives/signature_verify.circom' },
  
  // Aggregation circuits
  { name: 'commit_aggregator', path: 'core/aggregation/commit_aggregator.circom' },
  { name: 'repo_aggregator', path: 'core/aggregation/repo_aggregator.circom' },
  { name: 'stats_aggregator', path: 'core/aggregation/stats_aggregator.circom' },
  { name: 'time_aggregator', path: 'core/aggregation/time_aggregator.circom' },
  
  // Credential circuits
  { name: 'repository_credential', path: 'credentials/repository_credential.circom' },
  { name: 'language_credential', path: 'credentials/language_credential.circom' },
  { name: 'collaboration_credential', path: 'credentials/collaboration_credential.circom' },
  { name: 'consistency_credential', path: 'credentials/consistency_credential.circom' },
  { name: 'diversity_credential', path: 'credentials/diversity_credential.circom' },
  { name: 'leadership_credential', path: 'credentials/leadership_credential.circom' },
  
  // Privacy circuits
  { name: 'differential_privacy', path: 'privacy/differential_privacy.circom' },
  { name: 'k_anonymity', path: 'privacy/k_anonymity.circom' },
  { name: 'zero_knowledge_sets', path: 'privacy/zero_knowledge_sets.circom' }
];

// Check if circom is installed
function checkCircom() {
  try {
    const version = execSync('circom --version', { encoding: 'utf8' });
    console.log(`✅ Circom found: ${version.trim()}`);
    return true;
  } catch (error) {
    console.error('❌ Circom not found. Please install Circom first:');
    console.error('   cargo install --git https://github.com/iden3/circom.git');
    return false;
  }
}

// Compile a single circuit
function compileCircuit(circuit) {
  const circuitPath = path.join(CIRCUITS_DIR, circuit.path);
  const outputDir = path.join(BUILD_DIR, 'compiled', circuit.name);
  
  // Check if circuit file exists
  if (!fs.existsSync(circuitPath)) {
    console.log(`⚠️  Skipping ${circuit.name}: File not found at ${circuitPath}`);
    return false;
  }
  
  console.log(`📦 Compiling ${circuit.name}...`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Compile circuit with maximum optimization
    const command = `circom "${circuitPath}" --r1cs --wasm --sym --c --O2 -o "${outputDir}"`;
    
    execSync(command, { 
      stdio: 'pipe',
      cwd: path.dirname(circuitPath)
    });
    
    console.log(`  ✅ Successfully compiled ${circuit.name}`);
    
    // Verify outputs
    const expectedFiles = [
      path.join(outputDir, `${circuit.name}.r1cs`),
      path.join(outputDir, `${circuit.name}_js`, `${circuit.name}.wasm`),
      path.join(outputDir, `${circuit.name}.sym`)
    ];
    
    let allFilesExist = true;
    expectedFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        console.log(`    ⚠️  Missing: ${path.basename(file)}`);
        allFilesExist = false;
      }
    });
    
    if (allFilesExist) {
      console.log(`    📋 All output files generated`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`  ❌ Failed to compile ${circuit.name}:`);
    console.error(`     ${error.message}`);
    return false;
  }
}

// Generate circuit information
function generateCircuitInfo() {
  console.log('\n📊 Generating Circuit Information...');
  
  const info = {
    compiledAt: new Date().toISOString(),
    circuits: [],
    stats: {
      total: CIRCUITS.length,
      compiled: 0,
      failed: 0
    }
  };
  
  CIRCUITS.forEach(circuit => {
    const outputDir = path.join(BUILD_DIR, 'compiled', circuit.name);
    const r1csPath = path.join(outputDir, `${circuit.name}.r1cs`);
    
    const circuitInfo = {
      name: circuit.name,
      path: circuit.path,
      compiled: fs.existsSync(r1csPath)
    };
    
    if (circuitInfo.compiled) {
      try {
        const stats = fs.statSync(r1csPath);
        circuitInfo.r1csSize = stats.size;
        circuitInfo.compiledAt = stats.mtime.toISOString();
        info.stats.compiled++;
      } catch (error) {
        circuitInfo.error = error.message;
        info.stats.failed++;
      }
    } else {
      info.stats.failed++;
    }
    
    info.circuits.push(circuitInfo);
  });
  
  // Save circuit info
  const infoPath = path.join(BUILD_DIR, 'circuit-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
  console.log(`  ✅ Circuit info saved to: ${infoPath}`);
  
  return info;
}

// Copy compiled artifacts to web3 directory
function copyArtifacts() {
  console.log('\n📁 Copying Artifacts...');
  
  const artifactsDir = path.join(__dirname, '../web3/artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  CIRCUITS.forEach(circuit => {
    const sourceDir = path.join(BUILD_DIR, 'compiled', circuit.name);
    const targetDir = path.join(artifactsDir, circuit.name);
    
    if (fs.existsSync(sourceDir)) {
      try {
        // Copy R1CS file
        const r1csSource = path.join(sourceDir, `${circuit.name}.r1cs`);
        const r1csTarget = path.join(targetDir, `${circuit.name}.r1cs`);
        
        if (fs.existsSync(r1csSource)) {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.copyFileSync(r1csSource, r1csTarget);
          console.log(`  ✅ Copied ${circuit.name}.r1cs`);
        }
        
        // Copy WASM directory
        const wasmSource = path.join(sourceDir, `${circuit.name}_js`);
        const wasmTarget = path.join(targetDir, `${circuit.name}_js`);
        
        if (fs.existsSync(wasmSource)) {
          if (!fs.existsSync(wasmTarget)) {
            fs.mkdirSync(wasmTarget, { recursive: true });
          }
          
          // Copy all files in WASM directory
          const wasmFiles = fs.readdirSync(wasmSource);
          wasmFiles.forEach(file => {
            fs.copyFileSync(
              path.join(wasmSource, file),
              path.join(wasmTarget, file)
            );
          });
          console.log(`  ✅ Copied ${circuit.name} WASM files`);
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to copy ${circuit.name}: ${error.message}`);
      }
    }
  });
}

// Main compilation function
async function main() {
  try {
    console.log('🚀 Sigil ZK Circuit Compilation\n');
    
    // Check dependencies
    if (!checkCircom()) {
      process.exit(1);
    }
    
    // Ensure build directory exists
    if (!fs.existsSync(BUILD_DIR)) {
      console.log('📁 Creating build directory...');
      fs.mkdirSync(BUILD_DIR, { recursive: true });
    }
    
    console.log(`\n📂 Circuit Source: ${CIRCUITS_DIR}`);
    console.log(`📂 Build Output: ${BUILD_DIR}\n`);
    
    // Compile all circuits
    let successCount = 0;
    let failCount = 0;
    
    for (const circuit of CIRCUITS) {
      if (compileCircuit(circuit)) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    // Generate circuit information
    const info = generateCircuitInfo();
    
    // Copy artifacts
    copyArtifacts();
    
    // Summary
    console.log('\n📋 Compilation Summary:');
    console.log(`  ✅ Successfully compiled: ${successCount}/${CIRCUITS.length}`);
    console.log(`  ❌ Failed: ${failCount}/${CIRCUITS.length}`);
    
    if (failCount > 0) {
      console.log('\n⚠️  Some circuits failed to compile. Check the logs above.');
      console.log('   Make sure all circuit dependencies are available.');
    } else {
      console.log('\n🎉 All circuits compiled successfully!');
      console.log('\nNext steps:');
      console.log('  1. Run: npm run circuits:ceremony');
      console.log('  2. Run: npm run circuits:test');
    }
    
  } catch (error) {
    console.error('\n❌ Compilation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, compileCircuit, CIRCUITS }; 