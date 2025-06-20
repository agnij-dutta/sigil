import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Circuit Compiler for Sigil ZK Circuits
 * 
 * Handles compilation of Circom circuits, generation of proving keys,
 * and verification key extraction for smart contracts
 */

export interface CircuitConfig {
  name: string;
  inputFile: string;
  outputDir: string;
  template: string;
  prime?: string;
  optimization?: number;
}

export interface CompilationResult {
  success: boolean;
  circuitPath: string;
  wasmPath: string;
  r1csPath: string;
  zkeyPath?: string;
  vkeyPath?: string;
  error?: string;
  constraints?: number;
}

export class CircuitCompiler {
  private buildDir: string;
  private powersOfTauPath: string;

  constructor(buildDir: string = './build', powersOfTauPath?: string) {
    this.buildDir = buildDir;
    this.powersOfTauPath = powersOfTauPath || this.downloadPowersOfTau();
    this.ensureBuildDirectory();
  }

  /**
   * Compile a single circuit
   */
  async compileCircuit(config: CircuitConfig): Promise<CompilationResult> {
    try {
      console.log(`Compiling circuit: ${config.name}`);
      
      const result: CompilationResult = {
        success: false,
        circuitPath: config.inputFile,
        wasmPath: path.join(this.buildDir, `${config.name}.wasm`),
        r1csPath: path.join(this.buildDir, `${config.name}.r1cs`)
      };

      // Step 1: Compile circuit to r1cs and wasm
      await this.compileToR1CS(config);
      
      // Step 2: Generate proving key
      result.zkeyPath = await this.generateProvingKey(config.name);
      
      // Step 3: Extract verification key
      result.vkeyPath = await this.extractVerificationKey(config.name);
      
      // Step 4: Get constraint count
      result.constraints = await this.getConstraintCount(config.name);
      
      result.success = true;
      console.log(`✅ Successfully compiled ${config.name} with ${result.constraints} constraints`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to compile ${config.name}:`, error);
      return {
        success: false,
        circuitPath: config.inputFile,
        wasmPath: '',
        r1csPath: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Compile all circuits from config file
   */
  async compileAllCircuits(configPath: string = './circom.config.json'): Promise<CompilationResult[]> {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const results: CompilationResult[] = [];
    
    for (const [name, circuitConfig] of Object.entries(config.circuits)) {
      const circuit = circuitConfig as any;
      const result = await this.compileCircuit({
        name,
        inputFile: circuit.file,
        outputDir: this.buildDir,
        template: circuit.template,
        prime: circuit.prime,
        optimization: config.optimization?.O
      });
      results.push(result);
    }
    
    return results;
  }

  /**
   * Compile circuit to R1CS and WASM
   */
  private async compileToR1CS(config: CircuitConfig): Promise<void> {
    const outputPath = path.join(this.buildDir, config.name);
    const prime = config.prime || 'bn128';
    const optimization = config.optimization || 2;
    
    const command = [
      'circom',
      config.inputFile,
      '--r1cs',
      '--wasm',
      '--sym',
      '--json',
      `--output ${this.buildDir}`,
      `--prime ${prime}`,
      `-O ${optimization}`
    ].join(' ');
    
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
  }

  /**
   * Generate proving key using Powers of Tau ceremony
   */
  private async generateProvingKey(circuitName: string): Promise<string> {
    const r1csPath = path.join(this.buildDir, `${circuitName}.r1cs`);
    const zkeyPath = path.join(this.buildDir, `${circuitName}.zkey`);
    
    // Generate initial zkey
    const initCommand = [
      'snarkjs',
      'groth16',
      'setup',
      r1csPath,
      this.powersOfTauPath,
      zkeyPath
    ].join(' ');
    
    console.log(`Generating proving key: ${initCommand}`);
    execSync(initCommand, { stdio: 'inherit' });
    
    return zkeyPath;
  }

  /**
   * Extract verification key for smart contracts
   */
  private async extractVerificationKey(circuitName: string): Promise<string> {
    const zkeyPath = path.join(this.buildDir, `${circuitName}.zkey`);
    const vkeyPath = path.join(this.buildDir, `${circuitName}_verification_key.json`);
    
    const command = [
      'snarkjs',
      'zkey',
      'export',
      'verificationkey',
      zkeyPath,
      vkeyPath
    ].join(' ');
    
    console.log(`Extracting verification key: ${command}`);
    execSync(command, { stdio: 'inherit' });
    
    return vkeyPath;
  }

  /**
   * Get constraint count for the circuit
   */
  private async getConstraintCount(circuitName: string): Promise<number> {
    const r1csPath = path.join(this.buildDir, `${circuitName}.r1cs`);
    
    try {
      const command = `snarkjs r1cs info ${r1csPath}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      // Parse constraint count from output
      const match = output.match(/# of constraints: (\d+)/);
      return match ? parseInt(match[1]) : 0;
      
    } catch (error) {
      console.warn(`Could not get constraint count for ${circuitName}`);
      return 0;
    }
  }

  /**
   * Generate Solidity verifier contract
   */
  async generateSolidityVerifier(circuitName: string, outputPath?: string): Promise<string> {
    const zkeyPath = path.join(this.buildDir, `${circuitName}.zkey`);
    const contractPath = outputPath || path.join(this.buildDir, `${circuitName}_verifier.sol`);
    
    const command = [
      'snarkjs',
      'zkey',
      'export',
      'solidityverifier',
      zkeyPath,
      contractPath
    ].join(' ');
    
    console.log(`Generating Solidity verifier: ${command}`);
    execSync(command, { stdio: 'inherit' });
    
    return contractPath;
  }

  /**
   * Clean build directory
   */
  clean(): void {
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true, force: true });
    }
    this.ensureBuildDirectory();
  }

  /**
   * Ensure build directory exists
   */
  private ensureBuildDirectory(): void {
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
  }

  /**
   * Download Powers of Tau if not present
   */
  private downloadPowersOfTau(): string {
    const ceremonyDir = path.join(this.buildDir, 'ceremony');
    const ptauPath = path.join(ceremonyDir, 'powersOfTau28_hez_final_20.ptau');
    
    if (fs.existsSync(ptauPath)) {
      return ptauPath;
    }
    
    if (!fs.existsSync(ceremonyDir)) {
      fs.mkdirSync(ceremonyDir, { recursive: true });
    }
    
    console.log('Downloading Powers of Tau ceremony file...');
    const downloadCommand = [
      'wget',
      'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau',
      '-O',
      ptauPath
    ].join(' ');
    
    try {
      execSync(downloadCommand, { stdio: 'inherit' });
      console.log('✅ Powers of Tau ceremony file downloaded');
    } catch (error) {
      console.error('❌ Failed to download Powers of Tau file');
      throw error;
    }
    
    return ptauPath;
  }

  /**
   * Verify a proof
   */
  async verifyProof(
    circuitName: string,
    proofPath: string,
    publicSignalsPath: string
  ): Promise<boolean> {
    const vkeyPath = path.join(this.buildDir, `${circuitName}_verification_key.json`);
    
    const command = [
      'snarkjs',
      'groth16',
      'verify',
      vkeyPath,
      publicSignalsPath,
      proofPath
    ].join(' ');
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      return output.includes('VALID');
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const circuitCompiler = new CircuitCompiler();

// CLI helper functions
export async function compileAll(): Promise<void> {
  const results = await circuitCompiler.compileAllCircuits();
  
  console.log('\n📊 Compilation Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const constraints = result.constraints ? ` (${result.constraints} constraints)` : '';
    console.log(`${status} ${path.basename(result.circuitPath)}${constraints}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

export async function cleanAll(): Promise<void> {
  circuitCompiler.clean();
  console.log('🧹 Build directory cleaned');
} 