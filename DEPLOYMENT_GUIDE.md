# 🚀 Sigil ZK Credential System - Complete Deployment Guide

## Overview
This guide walks you through deploying the complete Sigil ZK credential system, including:
- ZK circuit compilation with Circom & SnarkJS
- Smart contract deployment to Ethereum Sepolia
- IPFS integration with Pinata
- Frontend integration
- End-to-end testing

## Prerequisites

### System Dependencies
```bash
# Install Rust (for Circom)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Circom
cargo install --git https://github.com/iden3/circom.git

# Install Node.js (v18+)
# Use nvm or download from nodejs.org

# Install global dependencies
npm install -g snarkjs @foundry-rs/cli
```

### Verify Installation
```bash
circom --version  # Should show v2.x.x
snarkjs --version # Should show v0.7.x
forge --version   # Should show foundry
node --version    # Should show v18+
```

## Environment Setup

### 1. Configure Environment Variables
```bash
# Copy and edit environment file
cp sigil/.env.example sigil/.env.local

# Edit .env.local with your values:
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/ouigpC_utbObH4NDiyunfv1nOUt8qQv8
# DEPLOYER_PRIVATE_KEY=95492791d9e40b7771b8b57117c399cc5e27d99d4959b7f9592925a398be7bdb
# PINATA_API_KEY=your_pinata_api_key
# PINATA_SECRET_KEY=your_pinata_secret_key
```

### 2. Install Dependencies
```bash
cd sigil
npm install
```

## ZK Circuit Deployment

### Step 1: Setup ZK Environment
```bash
npm run circuits:setup
```
This will:
- ✅ Create build directories
- ✅ Download trusted setup files (Powers of Tau)
- ✅ Check system dependencies
- ✅ Install SnarkJS if needed
- ✅ Create compilation scripts

### Step 2: Compile Circuits
```bash
npm run circuits:compile
```
This compiles all 18 ZK circuits:
- **Core Primitives**: hash_chain, merkle_tree, range_proof, set_membership, signature_verify
- **Aggregation**: commit_aggregator, repo_aggregator, stats_aggregator, time_aggregator  
- **Credentials**: repository_credential, language_credential, collaboration_credential, consistency_credential, diversity_credential, leadership_credential
- **Privacy**: differential_privacy, k_anonymity, zero_knowledge_sets

### Step 3: Trusted Setup Ceremony
```bash
npm run circuits:ceremony
```
This will:
- ✅ Generate proving keys (zkeys)
- ✅ Generate verification keys (vkeys) 
- ✅ Generate Solidity verifier contracts
- ✅ Create proof generation utilities

**Expected Output:**
```
🔑 ZKeys: build/circuits/zkeys/*.zkey
🔐 Verification Keys: build/circuits/zkeys/*_vkey.json
📜 Solidity Verifiers: build/circuits/verifiers/*Verifier.sol
```

### Step 4: Test Circuits
```bash
npm run circuits:test
```

## Smart Contract Deployment

### Step 1: Build Contracts
```bash
npm run contracts:build
```

### Step 2: Test Contracts
```bash
npm run contracts:test
```

### Step 3: Deploy to Sepolia
```bash
npm run contracts:deploy
```

This deploys:
- **SigilCredentialVerifier** - Main ZK proof verifier
- **CredentialRegistry** - Credential storage and management  
- **AggregateVerifier** - Multi-proof aggregation
- **CollaborationVerifier** - Collaboration proof verification
- **LanguageVerifier** - Programming language proof verification
- **RepositoryVerifier** - Repository credential verification

**Expected Output:**
```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contracts": {
    "SigilCredentialVerifier": "0x...",
    "CredentialRegistry": "0x...",
    "AggregateVerifier": "0x...",
    "CollaborationVerifier": "0x...",
    "LanguageVerifier": "0x...",
    "RepositoryVerifier": "0x..."
  }
}
```

## IPFS & Pinata Setup

### Step 1: Setup IPFS Integration
```bash
npm run ipfs:setup
```

### Step 2: Configure Pinata
1. Create account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys
3. Add to `.env.local`:
```bash
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

### Step 3: Test IPFS Storage
```bash
node scripts/setup-ipfs.js
```

## Frontend Integration

### Update Contract Addresses
Edit `sigil/src/lib/contracts.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  SEPOLIA: {
    SigilCredentialVerifier: "0x...", // From deployment output
    CredentialRegistry: "0x...",
    // ... other contracts
  }
};
```

### Start Development Server
```bash
npm run dev
```

## Complete Deployment Pipeline

### One-Command Deployment
```bash
npm run deploy:all
```

This runs the complete pipeline:
1. ✅ Circuit compilation
2. ✅ Trusted setup ceremony  
3. ✅ Contract building
4. ✅ Contract deployment
5. ✅ IPFS setup verification

## Testing & Verification

### Run Complete Test Suite
```bash
npm run test:all
```

### Manual Testing Steps

#### 1. Test ZK Proof Generation
```bash
cd sigil
node -e "
const { CircuitGenerators } = require('./web3/utils/proof-generator.ts');
const generator = CircuitGenerators.repository_credential;
const input = {
  repoHash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01',
  commitCount: 100,
  linesAdded: 5000,
  linesDeleted: 1500,
  languageProof: 1
};
generator.generateProof(input).then(console.log);
"
```

#### 2. Test IPFS Storage
```bash
node -e "
const { ipfsClient } = require('./web3/utils/ipfs-client.ts');
const testProof = { test: 'proof-data' };
ipfsClient.storeProof(testProof).then(console.log);
"
```

#### 3. Test Contract Interaction
```bash
cd web3/contracts
forge script script/Deploy.s.sol:SigilDeployScript --sig "verifyDeployment()" --rpc-url $SEPOLIA_RPC_URL
```

## Production Deployment Checklist

### Security
- [ ] Private keys stored securely (use hardware wallet for mainnet)
- [ ] Contract addresses verified on Etherscan
- [ ] ZK ceremony contributions from multiple parties
- [ ] IPFS pinning redundancy configured

### Performance
- [ ] Circuit constraint optimization completed
- [ ] Gas usage optimized for all contracts
- [ ] IPFS gateway load balancing configured
- [ ] Frontend caching implemented

### Monitoring
- [ ] Contract event monitoring setup
- [ ] IPFS uptime monitoring
- [ ] ZK proof generation metrics
- [ ] Error logging and alerting

## Troubleshooting

### Common Issues

#### Circom Compilation Errors
```bash
# Update Circom to latest version
cargo install --git https://github.com/iden3/circom.git --force

# Check circuit syntax
circom web3/circuits/core/primitives/hash_chain.circom --r1cs --wasm --sym
```

#### SnarkJS Issues
```bash
# Reinstall SnarkJS
npm uninstall -g snarkjs
npm install -g snarkjs@latest

# Clear build cache
rm -rf build/circuits
npm run circuits:setup
```

#### Contract Deployment Failures
```bash
# Check gas prices
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --gas-estimate

# Verify RPC endpoint
curl -X POST $SEPOLIA_RPC_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### IPFS Connection Issues
```bash
# Test IPFS connectivity
curl -X POST "https://ipfs.infura.io:5001/api/v0/version"

# Test Pinata authentication
curl -X GET "https://api.pinata.cloud/data/testAuthentication" -H "pinata_api_key: YOUR_API_KEY" -H "pinata_secret_api_key: YOUR_SECRET_KEY"
```

## File Structure

```
sigil/
├── scripts/                    # Deployment scripts
│   ├── setup-circuits.js      # ZK environment setup
│   ├── compile-circuits.js    # Circuit compilation
│   ├── trusted-setup.js       # Ceremony & key generation
│   ├── setup-ipfs.js         # IPFS integration
│   └── test-circuits.js      # Testing framework
├── build/circuits/            # ZK build outputs
│   ├── compiled/             # Compiled circuits
│   ├── zkeys/               # Proving/verification keys
│   ├── verifiers/           # Solidity verifiers
│   └── ptau/               # Trusted setup files
├── web3/
│   ├── contracts/           # Smart contracts
│   ├── utils/              # Proof generation utilities
│   └── artifacts/          # Contract artifacts
└── src/                    # Frontend application
    ├── app/               # Next.js pages
    ├── components/        # React components
    └── lib/              # Utility libraries
```

## Support & Documentation

### Resources
- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Guide](https://github.com/iden3/snarkjs)
- [Foundry Book](https://book.getfoundry.sh/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Pinata API Docs](https://docs.pinata.cloud/)

### Getting Help
1. Check this deployment guide
2. Review error logs in `build/` directory
3. Test individual components before full deployment
4. Verify all environment variables are set correctly

---

## 🎉 Deployment Complete!

Your Sigil ZK credential system is now deployed and ready for use. Users can:

1. **Connect** their GitHub accounts
2. **Generate** ZK proofs of their contributions
3. **Store** credentials on IPFS with Pinata pinning
4. **Verify** credentials on Ethereum Sepolia
5. **Share** verifiable credentials while maintaining privacy

The system provides privacy-preserving GitHub contribution verification with zero-knowledge proofs, decentralized storage, and on-chain verification. 