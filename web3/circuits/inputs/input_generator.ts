import crypto from 'crypto';
import { ethers } from 'ethers';

/**
 * Input Generator for Sigil ZK Circuits
 * 
 * Generates valid circuit inputs from GitHub commit data
 * Handles conversion between different data formats and field elements
 */

export interface GitHubCommitData {
  hash: string;
  author: {
    email: string;
    name: string;
    address?: string;
  };
  message: string;
  timestamp: number;
  stats: {
    additions: number;
    deletions: number;
    total: number;
    files: Array<{
      filename: string;
      additions: number;
      deletions: number;
      changes: number;
    }>;
  };
  signature?: {
    r: string;
    s: string;
    v: number;
  };
}

export interface CircuitInputs {
  // Public inputs
  commitHashPublic: string;
  authorAddressPublic: string;
  minLOC: number;
  maxLOC: number;
  timestamp: number;
  
  // Private inputs
  commitHash: string;
  signature: [string, string];
  authorEmail: string;
  linesOfCode: number;
  filesChanged: number;
  authorPrivateKey: string;
}

export interface ValidationRanges {
  minLOC: number;
  maxLOC: number;
  minFiles: number;
  maxFiles: number;
  maxAge?: number; // Maximum age in seconds
}

export class CircuitInputGenerator {
  private defaultRanges: ValidationRanges = {
    minLOC: 1,
    maxLOC: 10000,
    minFiles: 1,
    maxFiles: 100,
    maxAge: 31536000 // 1 year
  };

  /**
   * Generate circuit inputs from GitHub commit data
   */
  async generateInputs(
    commitData: GitHubCommitData,
    privateKey: string,
    ranges: Partial<ValidationRanges> = {}
  ): Promise<CircuitInputs> {
    const validationRanges = { ...this.defaultRanges, ...ranges };
    
    // Validate input data
    this.validateCommitData(commitData, validationRanges);
    
    // Get Ethereum address from private key
    const wallet = new ethers.Wallet(privateKey);
    const authorAddress = wallet.address;
    
    // Generate signature if not provided
    let signature = commitData.signature;
    if (!signature) {
      signature = await this.generateCommitSignature(commitData.hash, privateKey);
    }
    
    // Convert data to circuit format
    const inputs: CircuitInputs = {
      // Public inputs
      commitHashPublic: this.hashToFieldElement(commitData.hash),
      authorAddressPublic: this.addressToFieldElement(authorAddress),
      minLOC: validationRanges.minLOC,
      maxLOC: validationRanges.maxLOC,
      timestamp: commitData.timestamp,
      
      // Private inputs
      commitHash: this.hashToFieldElement(commitData.hash),
      signature: [signature.r, signature.s],
      authorEmail: this.hashToFieldElement(commitData.author.email),
      linesOfCode: commitData.stats.total,
      filesChanged: commitData.stats.files.length,
      authorPrivateKey: this.privateKeyToFieldElement(privateKey)
    };
    
    return inputs;
  }

  /**
   * Generate sample inputs for testing
   */
  generateSampleInputs(scenario: 'valid' | 'invalid_range' | 'invalid_signature' = 'valid'): CircuitInputs {
    const baseInputs: CircuitInputs = {
      commitHashPublic: this.generateRandomFieldElement(),
      authorAddressPublic: this.generateRandomFieldElement(20), // 20 bytes for address
      minLOC: 10,
      maxLOC: 1000,
      timestamp: Math.floor(Date.now() / 1000),
      commitHash: '', // Will be set to match public hash
      signature: [this.generateRandomFieldElement(), this.generateRandomFieldElement()],
      authorEmail: this.generateRandomFieldElement(),
      linesOfCode: 150,
      filesChanged: 5,
      authorPrivateKey: this.generateRandomFieldElement(32) // 32 bytes for private key
    };
    
    // Set commit hash to match public hash
    baseInputs.commitHash = baseInputs.commitHashPublic;
    
    // Modify based on scenario
    switch (scenario) {
      case 'invalid_range':
        baseInputs.linesOfCode = 2000; // Exceeds maxLOC
        break;
      case 'invalid_signature':
        baseInputs.signature = ['1', '1']; // Invalid signature
        break;
      // 'valid' case uses base inputs as-is
    }
    
    return baseInputs;
  }

  /**
   * Validate commit data against ranges
   */
  private validateCommitData(commitData: GitHubCommitData, ranges: ValidationRanges): void {
    if (commitData.stats.total < ranges.minLOC || commitData.stats.total > ranges.maxLOC) {
      throw new Error(`Lines of code ${commitData.stats.total} outside valid range [${ranges.minLOC}, ${ranges.maxLOC}]`);
    }
    
    if (commitData.stats.files.length < ranges.minFiles || commitData.stats.files.length > ranges.maxFiles) {
      throw new Error(`Files changed ${commitData.stats.files.length} outside valid range [${ranges.minFiles}, ${ranges.maxFiles}]`);
    }
    
    if (ranges.maxAge) {
      const age = Math.floor(Date.now() / 1000) - commitData.timestamp;
      if (age > ranges.maxAge) {
        throw new Error(`Commit is too old: ${age} seconds > ${ranges.maxAge} seconds`);
      }
    }
  }

  /**
   * Generate ECDSA signature for commit hash
   */
  private async generateCommitSignature(commitHash: string, privateKey: string): Promise<{r: string, s: string, v: number}> {
    const wallet = new ethers.Wallet(privateKey);
    const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(commitHash));
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    
    const expandedSig = ethers.utils.splitSignature(signature);
    
    return {
      r: expandedSig.r,
      s: expandedSig.s,
      v: expandedSig.v
    };
  }

  /**
   * Convert hash to field element suitable for circuit
   */
  private hashToFieldElement(hash: string): string {
    // Remove '0x' prefix if present
    const cleanHash = hash.replace(/^0x/, '');
    
    // Convert to decimal string (circuits expect decimal field elements)
    return BigInt('0x' + cleanHash).toString();
  }

  /**
   * Convert Ethereum address to field element
   */
  private addressToFieldElement(address: string): string {
    // Remove '0x' prefix and convert to decimal
    const cleanAddress = address.replace(/^0x/, '');
    return BigInt('0x' + cleanAddress).toString();
  }

  /**
   * Convert private key to field element
   */
  private privateKeyToFieldElement(privateKey: string): string {
    // Remove '0x' prefix if present
    const cleanKey = privateKey.replace(/^0x/, '');
    return BigInt('0x' + cleanKey).toString();
  }

  /**
   * Generate random field element for testing
   */
  private generateRandomFieldElement(bytes: number = 32): string {
    const randomBytes = crypto.randomBytes(bytes);
    return BigInt('0x' + randomBytes.toString('hex')).toString();
  }

  /**
   * Create input file for circuit compilation
   */
  exportForCircuit(inputs: CircuitInputs, filePath: string): void {
    const circuitInput = {
      commitHashPublic: inputs.commitHashPublic,
      authorAddressPublic: inputs.authorAddressPublic,
      minLOC: inputs.minLOC.toString(),
      maxLOC: inputs.maxLOC.toString(),
      timestamp: inputs.timestamp.toString(),
      commitHash: inputs.commitHash,
      signature: inputs.signature,
      authorEmail: inputs.authorEmail,
      linesOfCode: inputs.linesOfCode.toString(),
      filesChanged: inputs.filesChanged.toString(),
      authorPrivateKey: inputs.authorPrivateKey
    };
    
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(circuitInput, null, 2));
  }
}

// Helper function for CLI usage
export function generateTestInputs(scenario: string = 'valid'): CircuitInputs {
  const generator = new CircuitInputGenerator();
  return generator.generateSampleInputs(scenario as any);
}

// Export singleton instance
export const inputGenerator = new CircuitInputGenerator(); 