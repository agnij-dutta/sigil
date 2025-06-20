# Web3 Architecture Plan for Sigil

## Overview
This document outlines the file and folder structure for the web3 components of Sigil, focusing on zero-knowledge proofs, smart contract verification, IPFS storage, and wallet integration.

## Folder Structure

### `/web3`
```
web3/
├── circuits/                 # ZK Circuit definitions and utilities
├── contracts/               # Smart contracts for verification/attestation
├── ipfs/                   # IPFS integration and storage utilities
├── wallet/                 # Wallet connection and SIWE implementation
├── verification/           # Proof verification logic
├── types/                  # TypeScript type definitions
├── utils/                  # Shared utilities and helpers
├── scripts/                # Deployment and utility scripts
└── tests/                  # Test files for all web3 components
```

## Detailed File Structure

### `/circuits` - Zero-Knowledge Circuits
**Purpose**: Contains ZK circuits for generating proofs of GitHub contributions

```
circuits/
├── src/
│   ├── contribution_proof.circom    # Main circuit for commit proof verification
│   ├── signature_verifier.circom    # Circuit for validating commit signatures
│   └── metadata_range.circom        # Circuit for LOC and metadata range checks
├── inputs/
│   ├── sample_input.json           # Sample circuit input for testing
│   └── input_generator.ts          # Utility to generate circuit inputs
├── build/
│   ├── contribution_proof.r1cs     # Compiled circuit (gitignored)
│   ├── contribution_proof.wasm     # Circuit WASM (gitignored)
│   └── proving_key.zkey            # Proving key (gitignored)
├── circom.config.json              # Circom configuration
└── circuit_compiler.ts             # Circuit compilation utilities
```

### `/contracts` - Smart Contracts
**Purpose**: On-chain verification and attestation contracts

```
contracts/
├── src/
│   ├── SigilVerifier.sol           # Main verification contract
│   ├── AttestationRegistry.sol     # Registry for storing attestations
│   ├── ProofValidator.sol          # Validates ZK proofs on-chain
│   └── interfaces/
│       ├── ISigilVerifier.sol      # Verifier interface
│       └── IAttestationRegistry.sol # Attestation interface
├── libraries/
│   ├── ProofLib.sol                # Library for proof utilities
│   └── MetadataLib.sol             # Library for metadata handling
├── deployment/
│   ├── deploy.ts                   # Deployment scripts
│   ├── verify.ts                   # Contract verification scripts
│   └── migrations/                 # Migration files
├── artifacts/                      # Compiled contracts (gitignored)
└── typechain/                      # Generated TypeScript types (gitignored)
```

### `/ipfs` - IPFS Integration
**Purpose**: Handles storing and retrieving proofs from IPFS

```
ipfs/
├── client.ts                       # IPFS client configuration
├── storage.ts                      # Proof storage utilities
├── retrieval.ts                    # Proof retrieval utilities
├── pinning.ts                      # Pinning service integration (Pinata/Arweave)
├── encryption.ts                   # Optional encryption for sensitive metadata
└── types.ts                        # IPFS-related type definitions
```

### `/wallet` - Wallet Integration
**Purpose**: Wallet connection and Sign-In With Ethereum (SIWE) implementation

```
wallet/
├── connection.ts                   # Wallet connection utilities (WalletConnect, MetaMask)
├── siwe.ts                        # Sign-In With Ethereum implementation
├── signature.ts                   # Message signing utilities
├── providers.ts                   # Web3 provider configurations
├── hooks/
│   ├── useWallet.ts               # React hook for wallet connection
│   ├── useSiwe.ts                 # React hook for SIWE
│   └── useSignature.ts            # React hook for signing
└── types.ts                       # Wallet-related type definitions
```

### `/verification` - Proof Verification
**Purpose**: Client-side and server-side proof verification logic

```
verification/
├── proof_verifier.ts              # Main proof verification logic
├── circuit_verifier.ts            # ZK circuit verification utilities
├── on_chain_verifier.ts           # On-chain verification interface
├── off_chain_verifier.ts          # Off-chain verification for speed
├── certificate_generator.ts       # Generates human-readable certificates
└── validation_schemas.ts          # Validation schemas for proofs
```

### `/types` - TypeScript Definitions
**Purpose**: Shared TypeScript types for all web3 components

```
types/
├── circuits.ts                    # Circuit input/output types
├── contracts.ts                   # Smart contract interaction types
├── proofs.ts                      # Proof structure definitions
├── certificates.ts                # Certificate format types
├── github.ts                      # GitHub-specific types for ZK
├── ipfs.ts                        # IPFS storage types
└── index.ts                       # Re-exports all types
```

### `/utils` - Shared Utilities
**Purpose**: Common utilities used across web3 components

```
utils/
├── crypto.ts                      # Cryptographic utilities
├── encoding.ts                    # Data encoding/decoding utilities
├── validation.ts                  # Input validation functions
├── constants.ts                   # Web3 constants (contract addresses, etc.)
├── errors.ts                      # Custom error classes
├── config.ts                      # Configuration management
└── helpers.ts                     # General helper functions
```

### `/scripts` - Deployment & Utility Scripts
**Purpose**: Scripts for deployment, testing, and maintenance

```
scripts/
├── deploy_contracts.ts            # Deploy smart contracts
├── setup_circuits.ts              # Compile and setup ZK circuits
├── generate_sample_proof.ts       # Generate sample proofs for testing
├── verify_setup.ts                # Verify entire web3 setup
├── update_contract_addresses.ts   # Update contract addresses in config
└── cleanup.ts                     # Cleanup temporary files
```

### `/tests` - Test Files
**Purpose**: Comprehensive testing for all web3 components

```
tests/
├── circuits/
│   ├── contribution_proof.test.ts # Circuit functionality tests
│   └── circuit_integration.test.ts # Integration tests
├── contracts/
│   ├── SigilVerifier.test.ts      # Verifier contract tests
│   └── AttestationRegistry.test.ts # Attestation tests
├── ipfs/
│   └── storage.test.ts            # IPFS storage tests
├── wallet/
│   └── siwe.test.ts               # SIWE functionality tests
├── verification/
│   └── proof_verifier.test.ts     # Proof verification tests
├── integration/
│   └── end_to_end.test.ts         # Full workflow tests
└── fixtures/
    ├── sample_commits.json        # Test data
    └── sample_proofs.json         # Sample proof data
```

## Key Configuration Files

### Root Web3 Directory Files
```
web3/
├── package.json                   # Web3-specific dependencies
├── tsconfig.json                  # TypeScript configuration
├── hardhat.config.ts              # Hardhat configuration for contracts
├── .env.example                   # Environment variables template
├── README.md                      # Web3 setup and usage guide
└── .gitignore                     # Web3-specific gitignore
```

## Implementation Priority (MVP)

### Phase 1 - Core ZK & Verification
1. `/circuits/src/contribution_proof.circom` - Basic commit proof circuit
2. `/verification/proof_verifier.ts` - Client-side verification
3. `/types/proofs.ts` - Core proof type definitions
4. `/utils/crypto.ts` - Basic cryptographic utilities

### Phase 2 - Storage & Wallet
1. `/ipfs/storage.ts` - IPFS proof storage
2. `/wallet/siwe.ts` - Sign-In With Ethereum
3. `/wallet/connection.ts` - Wallet connection utilities
4. `/types/certificates.ts` - Certificate format definitions

### Phase 3 - Smart Contracts (Optional for MVP)
1. `/contracts/src/SigilVerifier.sol` - Basic on-chain verifier
2. `/contracts/deployment/deploy.ts` - Deployment scripts
3. `/verification/on_chain_verifier.ts` - On-chain verification interface

### Phase 4 - Integration & Polish
1. `/verification/certificate_generator.ts` - Human-readable certificates
2. `/scripts/generate_sample_proof.ts` - Demo and testing utilities
3. Complete test suite in `/tests/`

## Dependencies

### Core Dependencies
- **Circom/snarkjs**: ZK circuit compilation and proof generation
- **Hardhat**: Smart contract development and testing
- **IPFS HTTP Client**: IPFS integration
- **ethers.js**: Ethereum blockchain interaction
- **siwe**: Sign-In With Ethereum implementation

### Development Dependencies
- **@types/node**: TypeScript Node.js types
- **chai/mocha**: Testing framework
- **prettier**: Code formatting
- **eslint**: Code linting

This structure provides a comprehensive foundation for implementing all the Web3 features outlined in the Sigil PRD while maintaining clear separation of concerns and scalability for future enhancements. 