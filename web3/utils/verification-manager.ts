
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
      throw new Error(`Verifier contract not loaded for ${circuitName}`);
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
      console.error(`Verification failed for ${circuitName}:`, error);
      return {
        isValid: false,
        circuitName,
        publicSignals,
        timestamp: Date.now()
      };
    }
  }
}
