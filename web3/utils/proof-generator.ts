
// Sigil ZK Proof Generator
// eslint-disable-next-line @typescript-eslint/no-require-imports
const snarkjs = require("snarkjs");
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SnarkProof {
  a: any[];
  b: any[][];
  c: any[];
  publicSignals: any;
}

export class SigilProofGenerator {
  private wasmPath: string;
  private zkeyPath: string;
  
  constructor(circuitName: string) {
    this.wasmPath = `../build/circuits/compiled/${circuitName}/${circuitName}_js/${circuitName}.wasm`;
    this.zkeyPath = `../build/circuits/zkeys/${circuitName}.zkey`;
  }
  
  async generateProof(input: ProofInput): Promise<SnarkProof> {
    try {
      console.log(`Generating proof for input:`, input);
      
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

export class HashchainProofGenerator extends SigilProofGenerator {
  constructor() {
    super("hash_chain");
  }
}

export class MerkletreeProofGenerator extends SigilProofGenerator {
  constructor() {
    super("merkle_tree");
  }
}

export class RangeproofProofGenerator extends SigilProofGenerator {
  constructor() {
    super("range_proof");
  }
}

export class SetmembershipProofGenerator extends SigilProofGenerator {
  constructor() {
    super("set_membership");
  }
}

export class SignatureverifyProofGenerator extends SigilProofGenerator {
  constructor() {
    super("signature_verify");
  }
}

export class CommitaggregatorProofGenerator extends SigilProofGenerator {
  constructor() {
    super("commit_aggregator");
  }
}

export class RepoaggregatorProofGenerator extends SigilProofGenerator {
  constructor() {
    super("repo_aggregator");
  }
}

export class StatsaggregatorProofGenerator extends SigilProofGenerator {
  constructor() {
    super("stats_aggregator");
  }
}

export class TimeaggregatorProofGenerator extends SigilProofGenerator {
  constructor() {
    super("time_aggregator");
  }
}

export class RepositorycredentialProofGenerator extends SigilProofGenerator {
  constructor() {
    super("repository_credential");
  }
}

export class LanguagecredentialProofGenerator extends SigilProofGenerator {
  constructor() {
    super("language_credential");
  }
}

export class CollaborationcredentialProofGenerator extends SigilProofGenerator {
  constructor() {
    super("collaboration_credential");
  }
}

export class ConsistencycredentialProofGenerator extends SigilProofGenerator {
  constructor() {
    super("consistency_credential");
  }
}

export class DiversitycredentialProofGenerator extends SigilProofGenerator {
  constructor() {
    super("diversity_credential");
  }
}

export class LeadershipcredentialProofGenerator extends SigilProofGenerator {
  constructor() {
    super("leadership_credential");
  }
}

export class DifferentialprivacyProofGenerator extends SigilProofGenerator {
  constructor() {
    super("differential_privacy");
  }
}

export class KanonymityProofGenerator extends SigilProofGenerator {
  constructor() {
    super("k_anonymity");
  }
}

export class ZeroknowledgesetsProofGenerator extends SigilProofGenerator {
  constructor() {
    super("zero_knowledge_sets");
  }
}


export const CircuitGenerators = {
  hash_chain: new HashchainProofGenerator(),
  merkle_tree: new MerkletreeProofGenerator(),
  range_proof: new RangeproofProofGenerator(),
  set_membership: new SetmembershipProofGenerator(),
  signature_verify: new SignatureverifyProofGenerator(),
  commit_aggregator: new CommitaggregatorProofGenerator(),
  repo_aggregator: new RepoaggregatorProofGenerator(),
  stats_aggregator: new StatsaggregatorProofGenerator(),
  time_aggregator: new TimeaggregatorProofGenerator(),
  repository_credential: new RepositorycredentialProofGenerator(),
  language_credential: new LanguagecredentialProofGenerator(),
  collaboration_credential: new CollaborationcredentialProofGenerator(),
  consistency_credential: new ConsistencycredentialProofGenerator(),
  diversity_credential: new DiversitycredentialProofGenerator(),
  leadership_credential: new LeadershipcredentialProofGenerator(),
  differential_privacy: new DifferentialprivacyProofGenerator(),
  k_anonymity: new KanonymityProofGenerator(),
  zero_knowledge_sets: new ZeroknowledgesetsProofGenerator(),
};
