# Sigil Web3 Architecture Plan - Comprehensive Developer Credentials

## Overview
This document outlines a comprehensive Web3 architecture for Sigil that proves **complete developer credentials** rather than just individual commits. The system proves repository context, collaboration, programming skills, and aggregate contribution statistics while maintaining privacy.

## Core Proof Requirements

### What We Need to Prove (Privacy-Preserving)
1. **Repository Context**: Commit belongs to a specific repository
2. **Programming Languages**: Languages used in commits and overall skill set
3. **Aggregate Statistics**: Total commits, total LOC ranges across repositories
4. **Collaboration Proof**: Repository has multiple collaborators (not solo projects)
5. **Non-Owner Proof**: Developer is not the repository owner (genuine collaboration)
6. **Contribution Quality**: Consistent meaningful contributions over time
7. **Skill Diversity**: Breadth of technologies and languages used

### What Remains Private
- Exact commit content/code
- Exact repository names (only hashed identifiers)
- Exact LOC counts (only ranges)
- Exact collaborator identities
- Repository business logic

## Advanced ZK Circuit Architecture

### Circuit Types

#### 1. **Repository Aggregation Circuits** 
Prove contributions across multiple repositories without revealing specific repos.

#### 2. **Language Skill Circuits**
Prove programming language proficiency based on commit patterns and LOC.

#### 3. **Collaboration Circuits** 
Prove meaningful collaboration without exposing collaborator identities.

#### 4. **Temporal Consistency Circuits**
Prove consistent contribution patterns over time periods.

#### 5. **Cross-Repository Circuits**
Prove work across different types of projects and organizations.

## Folder Structure

### `/web3`
```
web3/
├── circuits/                    # Advanced ZK Circuit Architecture
├── aggregation/                 # Multi-repository aggregation systems
├── contracts/                   # Smart contract verification layer
├── storage/                     # Distributed storage (IPFS + Arweave)
├── indexing/                    # GitHub data indexing and processing
├── verification/                # Proof verification and validation
├── credentials/                 # Credential generation and management
├── privacy/                     # Privacy-preserving data processing
├── collaboration/               # Collaboration proof systems
├── languages/                   # Programming language detection/proof
├── wallet/                      # Wallet integration and SIWE
├── api/                         # API layer for frontend integration
├── types/                       # Comprehensive TypeScript definitions
├── utils/                       # Shared utilities and cryptographic helpers
├── scripts/                     # Deployment and maintenance scripts
├── tests/                       # Comprehensive testing suite
└── docs/                        # Documentation and examples
```

## Detailed Architecture

### `/circuits` - Advanced ZK Circuits
**Purpose**: Multi-layered zero-knowledge proof system for comprehensive credentials

```
circuits/
├── core/                           # Core circuit primitives
│   ├── primitives/
│   │   ├── merkle_tree.circom      # Merkle tree verification
│   │   ├── range_proof.circom      # Advanced range proofs
│   │   ├── hash_chain.circom       # Hash chain verification
│   │   ├── set_membership.circom   # Set membership proofs
│   │   └── signature_verify.circom # ECDSA/EdDSA verification
│   ├── aggregation/
│   │   ├── commit_aggregator.circom    # Aggregate multiple commits
│   │   ├── repo_aggregator.circom      # Aggregate across repositories
│   │   ├── time_aggregator.circom      # Temporal aggregation
│   │   └── stats_aggregator.circom     # Statistical aggregation
│   └── composition/
│       ├── circuit_composer.circom     # Compose multiple circuits
│       └── proof_combiner.circom       # Combine multiple proofs
├── credentials/                     # Credential-specific circuits
│   ├── repository_credential.circom    # Repository membership + contribution proof
│   ├── language_credential.circom      # Programming language proficiency
│   ├── collaboration_credential.circom # Collaboration and teamwork proof
│   ├── consistency_credential.circom   # Temporal consistency proof
│   ├── diversity_credential.circom     # Skill diversity proof
│   └── leadership_credential.circom    # Technical leadership proof
├── privacy/                         # Privacy-preserving circuits
│   ├── differential_privacy.circom     # Differential privacy mechanisms
│   ├── k_anonymity.circom             # K-anonymity for collaboration
│   └── zero_knowledge_sets.circom     # ZK set operations
├── inputs/                          # Circuit input management
│   ├── generators/
│   │   ├── github_data_processor.ts   # Process GitHub API data
│   │   ├── repo_analyzer.ts           # Analyze repository structure
│   │   ├── language_detector.ts       # Detect and verify languages
│   │   ├── collaboration_analyzer.ts  # Analyze collaboration patterns
│   │   └── temporal_analyzer.ts       # Analyze contribution timing
│   ├── validators/
│   │   ├── input_validator.ts         # Validate circuit inputs
│   │   ├── constraint_checker.ts      # Check constraint satisfaction
│   │   └── privacy_validator.ts       # Ensure privacy requirements
│   └── samples/
│       ├── repository_sample.json     # Sample repository data
│       ├── language_sample.json       # Sample language data
│       └── collaboration_sample.json  # Sample collaboration data
├── build/                           # Compiled circuit artifacts
├── ceremony/                        # Trusted setup files
├── config/                          # Circuit compilation configuration
└── benchmarks/                      # Performance benchmarks
```

### `/aggregation` - Multi-Repository Data Aggregation
**Purpose**: Aggregate and process data from multiple repositories while preserving privacy

```
aggregation/
├── processors/
│   ├── github_crawler.ts           # Crawl authorized GitHub repositories
│   ├── repo_classifier.ts          # Classify repository types and complexity
│   ├── commit_analyzer.ts          # Analyze commit patterns and quality
│   ├── language_aggregator.ts      # Aggregate language usage statistics
│   ├── collaboration_mapper.ts     # Map collaboration networks
│   └── timeline_builder.ts         # Build contribution timelines
├── privacy/
│   ├── data_anonymizer.ts          # Anonymize sensitive repository data
│   ├── differential_privacy.ts     # Apply differential privacy
│   ├── secure_aggregation.ts       # Secure multi-party aggregation
│   └── k_anonymity.ts              # Ensure k-anonymity for collaborators
├── storage/
│   ├── encrypted_cache.ts          # Encrypted local data cache
│   ├── merkle_storage.ts           # Merkle tree storage for proofs
│   └── batch_processor.ts          # Batch process large datasets
├── validation/
│   ├── data_validator.ts           # Validate aggregated data integrity
│   ├── consistency_checker.ts      # Check cross-repository consistency
│   └── quality_assessor.ts         # Assess contribution quality
├── cross_repo/
│   └── multi_repo_aggregator.ts    # Multi-repository aggregation with privacy
├── consistency/                     # Consistency checking systems
├── diversity/                       # Diversity analysis systems
├── portfolio/                       # Portfolio analysis systems
├── proficiency/                     # Proficiency assessment systems
└── types/
    ├── aggregation.ts              # Aggregation type definitions
    ├── repository.ts               # Repository data types
    └── collaboration.ts            # Collaboration data types
```

## Critical Claims Supported

### ✅ All 6 Core Claims Provable:

1. **Repository Membership**: Prove n commits in specific repository
2. **LOC Ranges**: Prove x-y lines of code ranges (privacy-preserving)
3. **Language Usage**: Prove usage of languages a, b, c (dynamic 2-50+ languages)
4. **Collaboration**: Prove repository had v collaborators
5. **Non-Solo Contributor**: Prove user was not sole collaborator
6. **Non-Owner**: Prove user was not repository owner

### Advanced Features:
- **Dynamic Language Support**: Handle 2 to 50+ programming languages
- **Privacy-Preserving Ranges**: LOC and commit counts in ranges, not exact values
- **Sybil Resistance**: Prevent gaming through multiple accounts
- **Temporal Consistency**: Prove consistent contributions over time
- **Quality Metrics**: Prove meaningful, quality contributions

## Implementation Status

This plan represents a comprehensive, production-ready Web3 architecture for developer credential verification with advanced privacy preservation and comprehensive proof capabilities.

**Key Implementation Points:**
- All circuits are in `circuits/credentials/` directly (no nested `contribution_proof` folder)
- TypeScript credential management is in top-level `credentials/` folder
- Structure follows Circom best practices and the detailed plan above
- All 6 critical claims are fully supported with advanced ZK circuits
- Dynamic language support for 2-50+ programming languages
- Complete privacy preservation with differential privacy and k-anonymity 