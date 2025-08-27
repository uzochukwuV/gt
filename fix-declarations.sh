#!/bin/bash

# Fix backend declarations to export types
backend_index="/home/uzo/icp/gtv2/src/declarations/backend/index.d.ts"

# Check if the exports are already there
if ! grep -q "export type {" "$backend_index"; then
    echo "Adding type exports to backend index.d.ts..."
    
    # Insert the type exports after the import
    sed -i '/import { _SERVICE } from '\''\.\/backend\.did'\'';/a\
export type { \
  Identity, \
  PrivacySettings, \
  VerifiableCredential, \
  AssetVerification, \
  ComplianceStatus, \
  RiskAssessment, \
  AuditEntry, \
  ChainType, \
  _SERVICE \
} from '\''./backend.did'\''; \
export { idlFactory } from '\''./backend.did'\'';' "$backend_index"
    
    echo "Type exports added successfully!"
else
    echo "Type exports already exist in backend index.d.ts"
fi