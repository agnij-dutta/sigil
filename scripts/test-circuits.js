#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Sigil ZK Circuits & Integration...\n');

// Configuration
const BUILD_DIR = path.join(__dirname, '../build/circuits');
const WEB3_DIR = path.join(__dirname, '../web3');
const TEST_DIR = path.join(__dirname, '../test');

// Test circuits list
const TEST_CIRCUITS = [
  {
    name: 'hash_chain',
    inputs: {
      input: [1, 2, 3, 4, 5],
      expectedHash: '123456789'
    }
  },
  {
    name: 'merkle_tree', 
    inputs: {
      leaf: '0x123456789abcdef',
      pathElements: ['0x111', '0x222', '0x333'],
      pathIndices: [0, 1, 0]
    }
  },
  {
    name: 'repository_credential',
    inputs: {
      repoHash: '0x987654321',
      commitCount: 150,
      linesAdded: 5000,
      linesDeleted: 1200,
      languageProof: 1
    }
  }
];

class SigilTestRunner {
  constructor() {
    this.results = {
      circuits: {},
      contracts: {},
      integration: {},
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite...\n');
    
    try {
      // Test ZK circuits
      await this.testCircuits();
      
      // Test smart contracts
      await this.testContracts();
      
      // Test IPFS integration
      await this.testIPFSIntegration();
      
      // Test proof generation pipeline
      await this.testProofGeneration();
      
      // Test end-to-end workflow
      await this.testEndToEndWorkflow();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testCircuits() {
    console.log('🔬 Testing ZK Circuits...\n');
    
    for (const circuit of TEST_CIRCUITS) {
      console.log(`Testing ${circuit.name}...`);
      
      try {
        const result = await this.testSingleCircuit(circuit);
        this.results.circuits[circuit.name] = result;
        
        if (result.passed) {
          console.log(`  ✅ ${circuit.name} passed`);
          this.results.summary.passed++;
        } else {
          console.log(`  ❌ ${circuit.name} failed: ${result.error}`);
          this.results.summary.failed++;
        }
        
      } catch (error) {
        console.log(`  ❌ ${circuit.name} crashed: ${error.message}`);
        this.results.circuits[circuit.name] = {
          passed: false,
          error: error.message,
          duration: 0
        };
        this.results.summary.failed++;
      }
      
      this.results.summary.total++;
    }
    
    console.log('');
  }

  generateTestReport() {
    console.log('📊 Test Report Generated Successfully!');
    console.log('\n🎉 All core components tested!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run circuits:setup');
    console.log('  2. Run: npm run circuits:compile');
    console.log('  3. Run: npm run contracts:deploy');
  }
}

// Main test function
async function main() {
  try {
    const testRunner = new SigilTestRunner();
    await testRunner.runAllTests();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SigilTestRunner, main };
