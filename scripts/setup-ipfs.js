#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { create } = require('ipfs-http-client');
const PinataSDK = require('@pinata/sdk');

console.log('🌐 Setting up IPFS & Pinata Integration...\n');

// Configuration
const IPFS_API_URL = 'https://ipfs.infura.io:5001/api/v0';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

class SigilIPFSManager {
  constructor() {
    this.ipfs = null;
    this.pinata = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing IPFS connections...');
      
      // Initialize IPFS client (can use local node or Infura)
      this.ipfs = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      });
      
      console.log('✅ IPFS client initialized');
      
      // Initialize Pinata (if API keys are available)
      const pinataApiKey = process.env.PINATA_API_KEY;
      const pinataSecretKey = process.env.PINATA_SECRET_KEY;
      
      if (pinataApiKey && pinataSecretKey) {
        this.pinata = new PinataSDK(pinataApiKey, pinataSecretKey);
        
        // Test Pinata authentication
        const auth = await this.pinata.testAuthentication();
        if (auth.authenticated) {
          console.log('✅ Pinata authenticated successfully');
        } else {
          console.log('⚠️  Pinata authentication failed');
        }
      } else {
        console.log('⚠️  Pinata API keys not found in environment');
        console.log('   Set PINATA_API_KEY and PINATA_SECRET_KEY to enable Pinata');
      }
      
      this.initialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ IPFS initialization failed:', error.message);
      return false;
    }
  }

  async uploadToIPFS(data, options = {}) {
    if (!this.initialized) {
      throw new Error('IPFS manager not initialized');
    }

    try {
      console.log('📤 Uploading to IPFS...');
      
      let content;
      if (typeof data === 'string') {
        content = Buffer.from(data);
      } else if (Buffer.isBuffer(data)) {
        content = data;
      } else {
        content = Buffer.from(JSON.stringify(data));
      }
      
      const result = await this.ipfs.add(content, {
        pin: true,
        ...options
      });
      
      console.log(`✅ Uploaded to IPFS: ${result.cid}`);
      return {
        cid: result.cid.toString(),
        size: result.size,
        path: result.path
      };
      
    } catch (error) {
      console.error('❌ IPFS upload failed:', error.message);
      throw error;
    }
  }

  async pinToPinata(cid, metadata = {}) {
    if (!this.pinata) {
      console.log('⚠️  Pinata not configured, skipping pin');
      return null;
    }

    try {
      console.log(`📌 Pinning ${cid} to Pinata...`);
      
      const result = await this.pinata.pinByHash(cid, {
        pinataMetadata: {
          name: metadata.name || `Sigil-${Date.now()}`,
          keyvalues: {
            type: metadata.type || 'credential',
            timestamp: new Date().toISOString(),
            ...metadata.keyvalues
          }
        }
      });
      
      console.log(`✅ Pinned to Pinata: ${result.hashToPin}`);
      return result;
      
    } catch (error) {
      console.error('❌ Pinata pinning failed:', error.message);
      throw error;
    }
  }

  async uploadAndPin(data, metadata = {}) {
    try {
      // Upload to IPFS first
      const ipfsResult = await this.uploadToIPFS(data);
      
      // Pin to Pinata for redundancy
      let pinataResult = null;
      if (this.pinata) {
        pinataResult = await this.pinToPinata(ipfsResult.cid, metadata);
      }
      
      return {
        ipfs: ipfsResult,
        pinata: pinataResult,
        gateways: this.getGatewayUrls(ipfsResult.cid)
      };
      
    } catch (error) {
      console.error('❌ Upload and pin failed:', error.message);
      throw error;
    }
  }

  getGatewayUrls(cid) {
    return {
      ipfs: `https://ipfs.io/ipfs/${cid}`,
      pinata: `${PINATA_GATEWAY}${cid}`,
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
      infura: `https://ipfs.infura.io/ipfs/${cid}`
    };
  }

  async retrieveFromIPFS(cid) {
    try {
      console.log(`📥 Retrieving ${cid} from IPFS...`);
      
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      
      const data = Buffer.concat(chunks);
      console.log(`✅ Retrieved ${data.length} bytes from IPFS`);
      
      return data;
      
    } catch (error) {
      console.error('❌ IPFS retrieval failed:', error.message);
      throw error;
    }
  }

  async listPinnedContent() {
    if (!this.pinata) {
      console.log('⚠️  Pinata not configured');
      return [];
    }

    try {
      const result = await this.pinata.pinList({
        status: 'pinned',
        pageLimit: 100
      });
      
      console.log(`📋 Found ${result.count} pinned items`);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to list pinned content:', error.message);
      return [];
    }
  }
}

// Proof storage utilities
class SigilProofStorage {
  constructor(ipfsManager) {
    this.ipfs = ipfsManager;
  }

  async storeProof(proof, metadata = {}) {
    try {
      console.log('💾 Storing ZK proof...');
      
      const proofData = {
        proof,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          ...metadata
        },
        signature: this.generateProofSignature(proof)
      };
      
      const result = await this.ipfs.uploadAndPin(
        JSON.stringify(proofData, null, 2),
        {
          name: `sigil-proof-${Date.now()}`,
          type: 'zk-proof',
          keyvalues: {
            circuit: metadata.circuit || 'unknown',
            publicSignals: JSON.stringify(proof.publicSignals || [])
          }
        }
      );
      
      console.log('✅ Proof stored successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Proof storage failed:', error.message);
      throw error;
    }
  }

  async retrieveProof(cid) {
    try {
      console.log(`🔍 Retrieving proof ${cid}...`);
      
      const data = await this.ipfs.retrieveFromIPFS(cid);
      const proofData = JSON.parse(data.toString());
      
      // Verify proof signature
      if (!this.verifyProofSignature(proofData.proof, proofData.signature)) {
        throw new Error('Proof signature verification failed');
      }
      
      console.log('✅ Proof retrieved and verified');
      return proofData;
      
    } catch (error) {
      console.error('❌ Proof retrieval failed:', error.message);
      throw error;
    }
  }

  generateProofSignature(proof) {
    // Simple hash-based signature for integrity checking
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(proof));
    return hash.digest('hex');
  }

  verifyProofSignature(proof, signature) {
    return this.generateProofSignature(proof) === signature;
  }

  async storeCredential(credential, proof, metadata = {}) {
    try {
      console.log('🎖️  Storing credential with proof...');
      
      const credentialPackage = {
        credential,
        proof,
        metadata: {
          timestamp: new Date().toISOString(),
          issuer: metadata.issuer || 'sigil',
          type: metadata.type || 'github-contribution',
          ...metadata
        }
      };
      
      const result = await this.ipfs.uploadAndPin(
        JSON.stringify(credentialPackage, null, 2),
        {
          name: `sigil-credential-${Date.now()}`,
          type: 'credential',
          keyvalues: {
            credentialType: metadata.type || 'github-contribution',
            subject: metadata.subject || 'unknown'
          }
        }
      );
      
      console.log('✅ Credential stored successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Credential storage failed:', error.message);
      throw error;
    }
  }
}

// Setup verification utilities
async function setupIPFSVerification() {
  console.log('\n🔐 Setting up IPFS Verification Utilities...');
  
  const utilsDir = path.join(__dirname, '../web3/utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  const ipfsUtilsCode = `
// IPFS Storage Utilities for Sigil
import { create } from 'ipfs-http-client';
import PinataSDK from '@pinata/sdk';

export interface StorageResult {
  cid: string;
  gateways: {
    ipfs: string;
    pinata: string;
    cloudflare: string;
  };
}

export class SigilIPFSClient {
  private ipfs: any;
  private pinata: PinataSDK | null = null;
  
  constructor() {
    this.ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    });
    
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      this.pinata = new PinataSDK(
        process.env.PINATA_API_KEY,
        process.env.PINATA_SECRET_KEY
      );
    }
  }
  
  async storeProof(proof: any, metadata: any = {}): Promise<StorageResult> {
    const data = {
      proof,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    const result = await this.ipfs.add(JSON.stringify(data, null, 2));
    const cid = result.cid.toString();
    
    // Pin to Pinata if available
    if (this.pinata) {
      await this.pinata.pinByHash(cid, {
        pinataMetadata: {
          name: \`sigil-proof-\${Date.now()}\`,
          keyvalues: metadata
        }
      });
    }
    
    return {
      cid,
      gateways: {
        ipfs: \`https://ipfs.io/ipfs/\${cid}\`,
        pinata: \`https://gateway.pinata.cloud/ipfs/\${cid}\`,
        cloudflare: \`https://cloudflare-ipfs.com/ipfs/\${cid}\`
      }
    };
  }
  
  async retrieveProof(cid: string): Promise<any> {
    const chunks = [];
    for await (const chunk of this.ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    const data = Buffer.concat(chunks);
    return JSON.parse(data.toString());
  }
}

export const ipfsClient = new SigilIPFSClient();
`;

  const ipfsUtilsPath = path.join(utilsDir, 'ipfs-client.ts');
  fs.writeFileSync(ipfsUtilsPath, ipfsUtilsCode);
  console.log(`  ✅ Created IPFS client: ${ipfsUtilsPath}`);
}

// Main setup function
async function main() {
  try {
    console.log('🚀 Sigil IPFS & Pinata Setup\n');
    
    // Initialize IPFS manager
    const ipfsManager = new SigilIPFSManager();
    const initialized = await ipfsManager.initialize();
    
    if (!initialized) {
      console.log('❌ IPFS initialization failed');
      process.exit(1);
    }
    
    // Initialize proof storage
    const proofStorage = new SigilProofStorage(ipfsManager);
    
    // Test storage with sample data
    console.log('\n🧪 Testing storage functionality...');
    
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Sigil IPFS test'
    };
    
    try {
      const result = await ipfsManager.uploadAndPin(testData, {
        name: 'sigil-test',
        type: 'test-data'
      });
      
      console.log('✅ Test upload successful');
      console.log(`   CID: ${result.ipfs.cid}`);
      console.log(`   IPFS Gateway: ${result.gateways.ipfs}`);
      console.log(`   Pinata Gateway: ${result.gateways.pinata}`);
      
      // Test retrieval
      const retrieved = await ipfsManager.retrieveFromIPFS(result.ipfs.cid);
      const parsedData = JSON.parse(retrieved.toString());
      
      if (parsedData.test === testData.test) {
        console.log('✅ Test retrieval successful');
      } else {
        console.log('❌ Test retrieval failed - data mismatch');
      }
      
    } catch (error) {
      console.log('⚠️  Test storage failed:', error.message);
    }
    
    // Setup verification utilities
    await setupIPFSVerification();
    
    // List pinned content if Pinata is configured
    if (ipfsManager.pinata) {
      console.log('\n📋 Listing pinned content...');
      const pinnedItems = await ipfsManager.listPinnedContent();
      if (pinnedItems.length > 0) {
        console.log(`   Found ${pinnedItems.length} pinned items`);
        pinnedItems.slice(0, 5).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.ipfs_pin_hash} (${item.metadata?.name || 'Unnamed'})`);
        });
      } else {
        console.log('   No pinned content found');
      }
    }
    
    console.log('\n✨ IPFS & Pinata setup complete!');
    console.log('\nNext steps:');
    console.log('  1. Set PINATA_API_KEY and PINATA_SECRET_KEY in .env');
    console.log('  2. Test proof storage with: npm run circuits:test');
    console.log('  3. Integrate with frontend proof generation');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  SigilIPFSManager, 
  SigilProofStorage,
  main 
}; 