import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Import the real snarkjs proof generators
import { CircuitGenerators, type ProofInput } from '../../../../../web3/utils/proof-generator';

// Simple in-memory cache for proofs (in production, use Redis)
const proofCache = new Map<string, any>();

interface SnarkProofRequest {
  circuitType: string;
  inputs: ProofInput;
  userAddress: string;
  repository?: string;
}

interface SnarkProofResponse {
  success: boolean;
  proof?: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    publicSignals: string[];
  };
  circuitType?: string;
  metadata?: {
    timestamp: number;
    circuitUsed: string;
    inputHash: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SnarkProofResponse>> {
  try {
    const data: SnarkProofRequest = await request.json();
    
    // Validate input data
    if (!data.circuitType || !data.inputs || !data.userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: circuitType, inputs, userAddress'
      }, { status: 400 });
    }

    // Check if circuit type is supported
    if (!CircuitGenerators[data.circuitType as keyof typeof CircuitGenerators]) {
      return NextResponse.json({
        success: false,
        error: `Unsupported circuit type: ${data.circuitType}. Available: ${Object.keys(CircuitGenerators).join(', ')}`
      }, { status: 400 });
    }

    console.log(`Generating real ZK proof for circuit: ${data.circuitType}`);
    console.log('Input data:', data.inputs);
    
    // Create cache key from inputs
    const cacheKey = `${data.circuitType}_${JSON.stringify(data.inputs)}_${data.userAddress}`;
    
    // Check cache first
    if (proofCache.has(cacheKey)) {
      console.log('Using cached ZK proof');
      const cachedProof = proofCache.get(cacheKey);
      return NextResponse.json({
        success: true,
        proof: cachedProof.proof,
        circuitType: data.circuitType,
        metadata: {
          ...cachedProof.metadata,
          cached: true
        }
      });
    }

    // Get the appropriate circuit generator (for future use)
    // const generator = CircuitGenerators[data.circuitType as keyof typeof CircuitGenerators];
    
    // Check if circuit files exist
    const circuitPath = path.join(process.cwd(), 'build', 'circuits', 'compiled', data.circuitType);
    const wasmPath = path.join(circuitPath, `${data.circuitType}_js`, `${data.circuitType}.wasm`);
    
    // Try different zkey naming patterns
    let zkeyPath = path.join(process.cwd(), 'build', 'circuits', 'zkeys', `${data.circuitType}.zkey`);
    if (!fs.existsSync(zkeyPath)) {
      zkeyPath = path.join(process.cwd(), 'build', 'circuits', 'zkeys', `${data.circuitType}_0000.zkey`);
    }
    if (!fs.existsSync(zkeyPath)) {
      zkeyPath = path.join(process.cwd(), 'build', 'circuits', 'zkeys', `${data.circuitType}_final.zkey`);
    }

    if (!fs.existsSync(wasmPath)) {
      return NextResponse.json({
        success: false,
        error: `Circuit WASM file not found: ${wasmPath}. Please compile circuits first.`
      }, { status: 500 });
    }

    if (!fs.existsSync(zkeyPath)) {
      return NextResponse.json({
        success: false,
        error: `Circuit zkey file not found for ${data.circuitType}. Tried: ${data.circuitType}.zkey, ${data.circuitType}_0000.zkey, ${data.circuitType}_final.zkey`
      }, { status: 500 });
    }

    // Check if zkey file is valid (not empty)
    const zkeyStats = fs.statSync(zkeyPath);
    if (zkeyStats.size === 0) {
      return NextResponse.json({
        success: false,
        error: `ZKey file is empty for ${data.circuitType}: ${zkeyPath}. The trusted setup failed for this circuit. Try using a different circuit type.`
      }, { status: 500 });
    }

    // Generate the actual ZK proof using snarkjs with correct paths
    // Override the generator's paths to use absolute paths
    const absoluteWasmPath = wasmPath;
    const absoluteZkeyPath = zkeyPath;
    
    console.log(`Using WASM path: ${absoluteWasmPath}`);
    console.log(`Using ZKey path: ${absoluteZkeyPath}`);
    
    // Use snarkjs directly with timeout to prevent hanging
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const snarkjs = require('snarkjs');
    
    console.log('Starting ZK proof generation...');
    const startTime = Date.now();
    
    // Add timeout wrapper to prevent hanging
    const proofPromise = snarkjs.groth16.fullProve(
      data.inputs,
      absoluteWasmPath,
      absoluteZkeyPath
    );
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('ZK proof generation timed out after 60 seconds')), 60000);
    });
    
    const { proof: rawProof, publicSignals } = await Promise.race([proofPromise, timeoutPromise]);
    
    const endTime = Date.now();
    console.log(`ZK proof generated successfully in ${(endTime - startTime) / 1000}s`);
    
    // Format proof for Solidity compatibility
    const proof = {
      a: [rawProof.pi_a[0], rawProof.pi_a[1]] as [string, string],
      b: [[rawProof.pi_b[0][1], rawProof.pi_b[0][0]], [rawProof.pi_b[1][1], rawProof.pi_b[1][0]]] as [[string, string], [string, string]],
      c: [rawProof.pi_c[0], rawProof.pi_c[1]] as [string, string],
      publicSignals: publicSignals as string[]
    };

    // Create input hash for metadata
    const inputHash = createInputHash(data.inputs, data.userAddress);

    const result = {
      success: true,
      proof,
      circuitType: data.circuitType,
      metadata: {
        timestamp: Date.now(),
        circuitUsed: data.circuitType,
        inputHash,
        generationTime: `${(endTime - startTime) / 1000}s`
      }
    };

    // Cache the result for future use
    proofCache.set(cacheKey, {
      proof,
      metadata: result.metadata
    });
    
    // Limit cache size (keep only last 10 proofs)
    if (proofCache.size > 10) {
      const firstKey = proofCache.keys().next().value;
      if (firstKey) {
        proofCache.delete(firstKey);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Snark proof generation failed:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error during proof generation';
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        errorMessage = 'Circuit files not found. Please ensure circuits are compiled and trusted setup is complete.';
      } else if (error.message.includes('invalid input')) {
        errorMessage = 'Invalid circuit inputs provided. Please check input format and values.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  // Get available circuits and their status
  const availableCircuits: string[] = [];
  const circuitStatus: Record<string, { compiled: boolean; hasZkey: boolean }> = {};

  for (const circuitName of Object.keys(CircuitGenerators)) {
    availableCircuits.push(circuitName);
    
    const wasmPath = path.join(process.cwd(), 'build', 'circuits', 'compiled', circuitName, `${circuitName}_js`, `${circuitName}.wasm`);
    
    // Check for different zkey naming patterns
    let zkeyPath = path.join(process.cwd(), 'build', 'circuits', 'zkeys', `${circuitName}.zkey`);
    let hasZkey = fs.existsSync(zkeyPath);
    
    if (!hasZkey) {
      zkeyPath = path.join(process.cwd(), 'build', 'circuits', 'zkeys', `${circuitName}_0000.zkey`);
      hasZkey = fs.existsSync(zkeyPath);
    }
    
    if (!hasZkey) {
      zkeyPath = path.join(process.cwd(), 'build', 'circuits', 'zkeys', `${circuitName}_final.zkey`);
      hasZkey = fs.existsSync(zkeyPath);
    }
    
    // Also check if zkey file is valid (not empty)
    if (hasZkey) {
      const zkeyStats = fs.statSync(zkeyPath);
      hasZkey = zkeyStats.size > 0;
    }
    
    circuitStatus[circuitName] = {
      compiled: fs.existsSync(wasmPath),
      hasZkey
    };
  }

  return NextResponse.json({
    message: 'Real Snark ZK Proof Generation API',
    description: 'Generate actual ZK proofs using snarkjs and compiled circuits',
    availableCircuits,
    circuitStatus,
    usage: {
      endpoint: '/api/snark/generate',
      method: 'POST',
      body: {
        circuitType: 'string (e.g., repository_credential)',
        inputs: 'object (circuit-specific inputs)',
        userAddress: 'string (ethereum address)',
        repository: 'string (optional, for repository-based credentials)'
      }
    },
    examples: {
      repository_credential: {
        circuitType: 'repository_credential',
        inputs: {
          commits: 42,
          linesAdded: 1500,
          linesDeleted: 300,
          collaborators: 3,
          timestamp: Math.floor(Date.now() / 1000)
        },
        userAddress: '0x1234...abcd'
      },
      language_credential: {
        circuitType: 'language_credential',
        inputs: {
          languageCount: 3,
          linesOfCode: 5000,
          timestamp: Math.floor(Date.now() / 1000)
        },
        userAddress: '0x1234...abcd'
      }
    }
  });
}

function createInputHash(inputs: ProofInput, userAddress: string): string {
  // Create a deterministic hash of the inputs for metadata
  const inputString = JSON.stringify({ inputs, userAddress }, Object.keys({ inputs, userAddress }).sort());
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
} 