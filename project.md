# GlobalTrust Project Restructuring Plan

## 🏗️ Recommended Project Structure

```
globaltrust/
├── dfx.json                           # Multi-canister configuration
├── Cargo.toml                         # Workspace configuration
├── package.json                       # Root package.json for scripts
├──
├── canisters/                         # All canister code
│   ├── identity_backend/
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs                 # Identity management canister
│   │   │   ├── types.rs               # Shared data structures
│   │   │   ├── storage.rs             # Stable storage management
│   │   │   ├── access_control.rs      # Security and permissions
│   │   │   └── utils.rs               # Helper functions
│   │   └── identity_backend.did       # Candid interface
│   │
│   ├── ai_backend/
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs                 # AI fraud detection canister
│   │   │   ├── models.rs              # AI model structures
│   │   │   ├── inference.rs           # ML inference engine
│   │   │   ├── training.rs            # Model training logic
│   │   │   └── fraud_detection.rs     # Fraud pattern detection
│   │   └── ai_backend.did
│   │
│   ├── crosschain_backend/
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs                 # Cross-chain orchestration
│   │   │   ├── bitcoin.rs             # Bitcoin integration
│   │   │   ├── ethereum.rs            # Ethereum integration
│   │   │   ├── solana.rs              # Solana integration
│   │   │   └── chain_fusion.rs        # Chain Fusion utilities
│   │   └── crosschain_backend.did
│   │
│   ├── asset_backend/
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs                 # Asset tokenization engine
│   │   │   ├── nft.rs                 # NFT minting and management
│   │   │   ├── marketplace.rs         # Asset marketplace logic
│   │   │   └── valuation.rs           # Asset valuation
│   │   └── asset_backend.did
│   │
│   ├── dao_backend/
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs                 # DAO governance canister
│   │   │   ├── proposals.rs           # Proposal management
│   │   │   ├── voting.rs              # Voting mechanisms
│   │   │   └── treasury.rs            # DAO treasury management
│   │   └── dao_backend.did
│   │
│   └── privacy_backend/
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs                 # Privacy and encryption layers
│       │   ├── zkp.rs                 # Zero-knowledge proofs
│       │   ├── encryption.rs          # Data encryption
│       │   └── selective_disclosure.rs # Selective disclosure
│       └── privacy_backend.did
│
├── frontend/                          # Enhanced React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── identity/              # Identity management UI
│   │   │   ├── verification/          # Verification flow UI
│   │   │   ├── assets/                # Asset tokenization UI
│   │   │   ├── crosschain/            # Cross-chain interaction UI
│   │   │   └── dao/                   # DAO governance UI
│   │   ├── services/
│   │   │   ├── identityService.ts     # Identity canister service
│   │   │   ├── aiService.ts           # AI canister service
│   │   │   ├── crosschainService.ts   # Cross-chain canister service
│   │   │   ├── assetService.ts        # Asset canister service
│   │   │   └── daoService.ts          # DAO canister service
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── utils/                     # Frontend utilities
│   │   └── types/                     # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                            # Shared libraries
│   ├── types/
│   │   └── src/
│   │       ├── identity.rs            # Shared identity types
│   │       ├── assets.rs              # Shared asset types
│   │       └── common.rs              # Common utilities
│   └── Cargo.toml
│
├── tests/                             # Comprehensive test suite
│   ├── integration/
│   │   ├── identity_tests.rs
│   │   ├── ai_tests.rs
│   │   ├── crosschain_tests.rs
│   │   └── end_to_end_tests.rs
│   ├── unit/
│   └── performance/
│
├── scripts/                           # Development and deployment scripts
│   ├── setup.sh                      # Project setup
│   ├── deploy-local.sh               # Local deployment
│   ├── deploy-mainnet.sh             # Mainnet deployment
│   └── generate-types.sh             # Type generation
│
└── docs/                             # Documentation
    ├── API.md                        # API documentation
    ├── ARCHITECTURE.md               # System architecture
    └── DEPLOYMENT.md                 # Deployment guide
```

## 🔄 Migration Steps from Current Repo

### Step 1: Restructure dfx.json

Update your `dfx.json` to support multiple canisters:

```json
{
  "canisters": {
    "llm": {
      "type": "pull",
      "id": "w36hm-eqaaa-aaaal-qr76a-cai"
    },
    "identity_backend": {
      "dependencies": ["llm"],
      "candid": "canisters/identity_backend/identity_backend.did",
      "package": "identity_backend",
      "type": "custom",
      "shrink": true,
      "gzip": true,
      "wasm": "target/wasm32-unknown-unknown/release/identity_backend.wasm",
      "build": ["bash ./scripts/generate-candid.sh identity_backend"]
    },
    "ai_backend": {
      "dependencies": ["llm", "identity_backend"],
      "candid": "canisters/ai_backend/ai_backend.did",
      "package": "ai_backend",
      "type": "custom",
      "shrink": true,
      "gzip": true,
      "wasm": "target/wasm32-unknown-unknown/release/ai_backend.wasm",
      "build": ["bash ./scripts/generate-candid.sh ai_backend"]
    },
    "crosschain_backend": {
      "dependencies": ["identity_backend"],
      "candid": "canisters/crosschain_backend/crosschain_backend.did",
      "package": "crosschain_backend",
      "type": "custom",
      "shrink": true,
      "gzip": true,
      "wasm": "target/wasm32-unknown-unknown/release/crosschain_backend.wasm",
      "build": ["bash ./scripts/generate-candid.sh crosschain_backend"]
    },
    "asset_backend": {
      "dependencies": ["identity_backend", "crosschain_backend"],
      "candid": "canisters/asset_backend/asset_backend.did",
      "package": "asset_backend",
      "type": "custom",
      "shrink": true,
      "gzip": true,
      "wasm": "target/wasm32-unknown-unknown/release/asset_backend.wasm",
      "build": ["bash ./scripts/generate-candid.sh asset_backend"]
    },
    "dao_backend": {
      "dependencies": ["identity_backend"],
      "candid": "canisters/dao_backend/dao_backend.did",
      "package": "dao_backend",
      "type": "custom",
      "shrink": true,
      "gzip": true,
      "wasm": "target/wasm32-unknown-unknown/release/dao_backend.wasm",
      "build": ["bash ./scripts/generate-candid.sh dao_backend"]
    },
    "privacy_backend": {
      "dependencies": ["identity_backend"],
      "candid": "canisters/privacy_backend/privacy_backend.did",
      "package": "privacy_backend",
      "type": "custom",
      "shrink": true,
      "gzip": true,
      "wasm": "target/wasm32-unknown-unknown/release/privacy_backend.wasm",
      "build": ["bash ./scripts/generate-candid.sh privacy_backend"]
    },
    "frontend": {
      "dependencies": [
        "identity_backend",
        "ai_backend",
        "crosschain_backend",
        "asset_backend",
        "dao_backend",
        "privacy_backend"
      ],
      "type": "assets",
      "source": ["frontend/dist/"]
    }
  },
  "output_env_file": ".env",
  "version": 1,
  "dfx": "0.25.0"
}
```

### Step 2: Update Root Cargo.toml

```toml
[workspace]
members = [
    "canisters/identity_backend",
    "canisters/ai_backend",
    "canisters/crosschain_backend",
    "canisters/asset_backend",
    "canisters/dao_backend",
    "canisters/privacy_backend",
    "shared/types"
]
resolver = "2"

[workspace.dependencies]
ic-cdk = "0.18"
ic-cdk-macros = "0.18"
ic-stable-structures = "0.6.9"
candid = "0.10"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sha2 = "0.10"
ed25519-dalek = "2.0"
getrandom = { version = "0.2", features = ["custom"] }
ciborium = "0.2"
```

### Step 3: Create Shared Types Library

Create `shared/types/Cargo.toml`:

```toml
[package]
name = "globaltrust-types"
version = "0.1.0"
edition = "2021"

[dependencies]
candid.workspace = true
serde.workspace = true
```

### Step 4: Migration Script

Create `scripts/migrate-from-template.sh`:

```bash
#!/bin/bash

echo "🚀 Migrating to GlobalTrust multi-canister architecture..."

# Create new directory structure
mkdir -p canisters/{identity_backend,ai_backend,crosschain_backend,asset_backend,dao_backend,privacy_backend}/src
mkdir -p shared/types/src
mkdir -p tests/{integration,unit,performance}

# Move existing backend to identity_backend
cp -r src/backend/* canisters/identity_backend/
mv canisters/identity_backend/backend.did canisters/identity_backend/identity_backend.did

# Update package names in Cargo.toml files
sed -i 's/name = "backend"/name = "identity_backend"/' canisters/identity_backend/Cargo.toml

# Move frontend to new location
mv src/frontend frontend/

echo "✅ Migration structure created. Please implement the canister logic."
```

## 🎯 Implementation Priority

### Phase 1: Core Identity (Weeks 1-2)

1. **Identity Management Canister**
   - Start with the identity management canister (use the code I provided earlier)
   - Implement basic DID creation and credential storage
   - Add Internet Identity integration

### Phase 2: AI Integration (Weeks 3-4)

2. **AI Fraud Detection Canister**
   - Implement the AI fraud detection system
   - Create basic ML models for verification
   - Add integration with identity canister

### Phase 3: Cross-Chain (Weeks 5-6)

3. **Cross-Chain Orchestration**
   - Implement Chain Fusion integration
   - Add Bitcoin and Ethereum verification
   - Create cross-chain proof system

### Phase 4: Advanced Features (Weeks 7-8)

4. **Asset Tokenization & DAO**
   - Implement RWA tokenization
   - Add marketplace functionality
   - Create DAO governance system

## 🔧 Enhanced Dependencies

Update each canister's `Cargo.toml` with specific dependencies:

```toml
# For canisters/identity_backend/Cargo.toml
[package]
name = "identity_backend"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
ic-cdk.workspace = true
ic-cdk-macros.workspace = true
ic-stable-structures.workspace = true
candid.workspace = true
serde.workspace = true
serde_json.workspace = true
sha2.workspace = true
ed25519-dalek.workspace = true
globaltrust-types = { path = "../../shared/types" }

# For AI canister - add ML dependencies
[dependencies]
# ... existing dependencies
linfa = "0.7"          # Machine learning
ndarray = "0.15"       # Numerical arrays
```

## 🚀 Quick Start Commands

1. **Run migration script:**

```bash
chmod +x scripts/migrate-from-template.sh
./scripts/migrate-from-template.sh
```

2. **Start with identity canister:**

```bash
# Copy the identity management code I provided into:
# canisters/identity_backend/src/lib.rs

# Build and deploy
dfx start --clean
dfx deploy identity_backend
```

3. **Add other canisters incrementally:**

```bash
# As you implement each canister
dfx deploy ai_backend
dfx deploy crosschain_backend
# etc.
```

## 🧪 Enhanced Testing Strategy

Update your test structure to handle multiple canisters:

```typescript
// tests/integration/multi_canister_test.ts
describe("GlobalTrust Integration Tests", () => {
  let identityCanister: Actor;
  let aiCanister: Actor;

  beforeEach(async () => {
    // Setup multiple canisters
    const identityFixture = await pic.setupCanister({
      idlFactory: identityIdl,
      wasm: IDENTITY_WASM_PATH,
    });

    const aiFixture = await pic.setupCanister({
      idlFactory: aiIdl,
      wasm: AI_WASM_PATH,
    });

    identityCanister = identityFixture.actor;
    aiCanister = aiFixture.actor;
  });

  it("should create identity and validate with AI", async () => {
    // Test end-to-end workflow
  });
});
```

## 📋 Next Immediate Steps

1. **Create the migration script and run it**
2. **Implement the identity management canister first** (I've provided the complete code)
3. **Set up the multi-canister deployment**
4. **Create basic frontend integration for identity management**
5. **Add AI canister (code provided) and test integration**

This structure gives you a solid foundation for the WCHL25 hackathon while being scalable for production. The modular approach allows you to develop and test each component independently while maintaining clean interfaces between canisters.

Would you like me to help you implement any specific part of this migration or create additional scripts for the setup?
