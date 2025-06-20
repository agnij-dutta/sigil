# Sigil ZK Circuits

This directory contains the zero-knowledge circuits for Sigil's verifiable developer credentials system. These circuits enable developers to prove their GitHub contributions without revealing sensitive code or repository details.

## Overview

The circuits provide privacy-preserving proofs for:
- **Commit Authorship**: Prove you authored a specific commit without revealing the code
- **Contribution Metrics**: Prove lines of code, files changed, etc. fall within ranges
- **Signature Verification**: Cryptographically verify commit signatures

## Circuit Components

### Main Circuits

1. **`contribution_proof.circom`** - Main circuit that combines all verification logic
   - Proves commit authorship and metadata ranges
   - Outputs validity flag and unique proof hash
   - ~500k constraints

2. **`signature_verifier.circom`** - ECDSA signature verification component
   - Verifies Git commit signatures without revealing private keys
   - Links Ethereum addresses to Git commits
   - ~100k constraints

3. **`metadata_range.circom`** - Range proof component
   - Proves values fall within specified ranges without revealing exact values
   - Used for lines of code, files changed, timestamp validation
   - ~1k constraints per range check

## Setup Instructions

### Prerequisites

```bash
# Install Circom
npm install -g circom

# Install snarkjs
npm install -g snarkjs

# Install dependencies
npm install ethers
```

### Compilation

1. **Compile all circuits:**
   ```bash
   npm run compile:circuits
   # or manually:
   npx ts-node circuit_compiler.ts
   ```

2. **Compile specific circuit:**
   ```bash
   circom src/contribution_proof.circom --r1cs --wasm --output build/
   ```

3. **Generate proving keys:**
   ```bash
   # Download Powers of Tau (done automatically)
   snarkjs powersoftau new bn128 20 build/ceremony/pot_0000.ptau

   # Generate proving key
   snarkjs groth16 setup build/contribution_proof.r1cs build/ceremony/powersOfTau28_hez_final_20.ptau build/contribution_proof.zkey
   ```

## Usage

### Generate Circuit Inputs

```typescript
import { CircuitInputGenerator } from './inputs/input_generator';

const generator = new CircuitInputGenerator();

// From GitHub commit data
const inputs = await generator.generateInputs(commitData, privateKey, {
  minLOC: 10,
  maxLOC: 1000
});

// Generate sample inputs for testing
const testInputs = generator.generateSampleInputs('valid');
```

### Generate Proofs

```bash
# Generate witness
snarkjs groth16 fullprove inputs/sample_input.json build/contribution_proof.wasm build/contribution_proof.zkey proof.json public.json

# Verify proof
snarkjs groth16 verify build/contribution_proof_verification_key.json public.json proof.json
```

### Integration with Frontend

```typescript
import { groth16 } from 'snarkjs';

// Generate proof in browser/Node.js
const { proof, publicSignals } = await groth16.fullProve(
  inputs,
  'circuits/build/contribution_proof.wasm',
  'circuits/build/contribution_proof.zkey'
);

// Verify proof
const isValid = await groth16.verify(
  verificationKey,
  publicSignals,
  proof
);
```

## File Structure

```
circuits/
├── src/                           # Circuit source files
│   ├── contribution_proof.circom  # Main proof circuit
│   ├── signature_verifier.circom  # ECDSA verification
│   └── metadata_range.circom      # Range proofs
├── inputs/                        # Input generation utilities
│   ├── sample_input.json          # Sample test inputs
│   └── input_generator.ts         # Input generation utilities
├── build/                         # Compiled circuits (gitignored)
│   ├── *.wasm                     # Circuit WebAssembly
│   ├── *.r1cs                     # R1CS constraint systems
│   ├── *.zkey                     # Proving keys
│   └── *_verification_key.json    # Verification keys
├── circom.config.json             # Circuit compilation config
├── circuit_compiler.ts            # Compilation utilities
└── README.md                      # This file
```

## Input Format

### Public Inputs (Visible to Verifiers)
- `commitHashPublic`: Hash of the commit being proved
- `authorAddressPublic`: Ethereum address of the developer
- `minLOC`/`maxLOC`: Range bounds for lines of code
- `timestamp`: Commit timestamp

### Private Inputs (Hidden from Verifiers)
- `commitHash`: Full commit hash (matches public)
- `signature`: ECDSA signature components [r, s]
- `authorEmail`: Hashed Git author email
- `linesOfCode`: Actual lines of code (within range)
- `filesChanged`: Number of files modified
- `authorPrivateKey`: Private key for signature verification

## Output Format

### Circuit Outputs
- `isValid`: Boolean indicating if all proofs are valid
- `proofHash`: Unique hash identifying this contribution proof

### Proof Structure
```json
{
  "pi_a": ["...", "...", "1"],
  "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
  "pi_c": ["...", "...", "1"],
  "protocol": "groth16",
  "curve": "bn128"
}
```

## Security Considerations

1. **Private Key Security**: Private keys are only used for proof generation, never stored
2. **Trusted Setup**: Uses Powers of Tau ceremony for proving keys
3. **Range Validation**: Metadata ranges prevent malicious edge cases
4. **Timestamp Bounds**: Prevents future-dated or excessively old commits

## Testing

```bash
# Run circuit tests
npm test

# Test specific circuit
npx ts-node inputs/input_generator.ts --scenario valid
npx ts-node inputs/input_generator.ts --scenario invalid_range
```

## Performance

| Circuit | Constraints | Proof Time | Verification Time |
|---------|-------------|------------|-------------------|
| contribution_proof | ~500k | ~30s | ~50ms |
| signature_verifier | ~100k | ~5s | ~20ms |
| metadata_range | ~1k | ~100ms | ~5ms |

## Troubleshooting

### Common Issues

1. **"Cannot find circomlib"**
   ```bash
   npm install circomlib
   ```

2. **"Powers of Tau not found"**
   - The compiler will auto-download on first run
   - Or manually download: `wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau`

3. **"Out of memory during compilation"**
   - Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=8192"`
   - Reduce circuit complexity or use smaller test inputs

4. **"Invalid witness"**
   - Check that private inputs match public inputs
   - Ensure all range constraints are satisfied
   - Verify signature format and private key correspondence

## Integration Points

- **Frontend**: React hooks in `/web3/wallet/hooks/`
- **Backend**: Verification utilities in `/web3/verification/`
- **Smart Contracts**: Generated verifier contracts in `/web3/contracts/`
- **IPFS**: Proof storage in `/web3/ipfs/`

## Contributing

When modifying circuits:
1. Update constraint estimates in `circom.config.json`
2. Test with various input scenarios
3. Update documentation for any new inputs/outputs
4. Run full compilation to ensure compatibility 