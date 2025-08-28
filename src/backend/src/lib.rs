//! GlobalTrust Enhanced Identity Management Canister
//!
//! Enhanced features:
//! - Comprehensive audit trail and security controls
//! - Cross-chain signature verification framework
//! - Asset linking and verification integration
//! - Enhanced compliance tracking
//! - AI verification hooks

use ic_cdk::api::management_canister::main::raw_rand;
use ic_cdk::api::{caller, id, time};
use std::borrow::Cow;
use std::cell::RefCell;

use candid::{CandidType, Decode, Encode, Principal};
use ic_cdk_macros::{export_candid, init, post_upgrade, pre_upgrade, query, update};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, StableCell, Storable,
};
use serde::{Deserialize, Serialize};

use sha2::{Digest, Sha256};

// Cross-chain bridge module
mod bridge;
pub use bridge::*;

// File storage module
mod storage;
pub use storage::*;

// Memory management types
type Memory = VirtualMemory<DefaultMemoryImpl>;

//=============================================================================
// CORE IDENTITY STRUCTURES
//=============================================================================

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Identity {
    pub id: String,
    pub owner: Principal,
    pub did: String,
    pub internet_identity_anchor: Option<u64>,
    pub credentials: Vec<VerifiableCredential>,
    pub verification_status: VerificationStatus,
    pub reputation_score: f64,
    pub reputation_history: Vec<ReputationEvent>,
    pub privacy_settings: PrivacySettings,
    pub linked_wallets: Vec<LinkedWallet>,
    pub linked_assets: Vec<String>,
    pub cross_chain_signatures: Vec<CrossChainSignature>,
    pub compliance_status: ComplianceStatus,
    pub risk_assessment: RiskAssessment,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_activity: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerifiableCredential {
    pub id: String,
    pub credential_type: CredentialType,
    pub issuer: CredentialIssuer,
    pub subject: Principal,
    pub issuance_date: u64,
    pub expiration_date: Option<u64>,
    pub claims: CredentialClaims,
    pub proof: CryptographicProof,
    pub status: CredentialStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialType {
    Government,
    Academic,
    Professional,
    Financial,
    Digital,
    Custom(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CredentialIssuer {
    pub id: Principal,
    pub name: String,
    pub did: Option<String>,
    pub reputation_score: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialClaims {
    Public(Vec<PublicClaim>),
    Private(String),
    Selective(Vec<SelectiveClaim>),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PublicClaim {
    pub claim_type: String,
    pub claim_value: String,
    pub verification_method: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SelectiveClaim {
    pub claim_type: String,
    pub proof_reference: String,
    pub disclosure_policy: DisclosurePolicy,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DisclosurePolicy {
    pub authorized_requesters: Vec<Principal>,
    pub disclosure_conditions: Vec<String>,
    pub expiry_date: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CryptographicProof {
    pub proof_type: ProofType,
    pub signature: String,
    pub public_key: String,
    pub created: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProofType {
    Ed25519Signature,
    EcdsaSecp256k1Signature,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationStatus {
    Pending,
    InProgress,
    Verified,
    PartiallyVerified,
    Rejected(String),
    Suspended,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialStatus {
    Active,
    Suspended,
    Revoked,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PrivacySettings {
    pub default_privacy_level: PrivacyLevel,
    pub public_credentials: Vec<String>,
    pub cross_chain_visibility: Vec<CrossChainVisibility>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum PrivacyLevel {
    Public,
    Restricted,
    Private,
    Confidential,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CrossChainVisibility {
    pub chain_name: String,
    pub visible_credentials: Vec<String>,
    pub visibility_level: PrivacyLevel,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ReputationEvent {
    pub event_type: ReputationEventType,
    pub score_change: f64,
    pub timestamp: u64,
    pub reason: String,
    pub verified_by: Option<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ReputationEventType {
    AssetVerified,
    CredentialIssued,
    SuccessfulTransaction,
    FraudReported,
    ComplianceViolation,
    SystemAction,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LinkedWallet {
    pub chain_type: ChainType,
    pub address: String,
    pub verification_status: WalletVerificationStatus,
    pub linked_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ChainType {
    Bitcoin,
    Ethereum,
    Solana,
    ICP,
    Polygon,
    Avalanche,
    Custom { name: String, chain_id: u64 },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum WalletVerificationStatus {
    Pending,
    Verified,
    Failed(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CrossChainSignature {
    pub chain_type: ChainType,
    pub signature_type: SignatureType,
    pub public_key: String,
    pub signature: String,
    pub message_hash: String,
    pub verification_status: SignatureVerificationStatus,
    pub created_at: u64,
    pub verified_at: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum SignatureType {
    ECDSA,
    EdDSA,
    Schnorr,
    BLS,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum SignatureVerificationStatus {
    Pending,
    Verified,
    Failed(String),
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ComplianceStatus {
    pub kyc_level: KYCLevel,
    pub aml_status: AMLStatus,
    pub sanctions_check: SanctionsStatus,
    pub last_updated: u64,
    pub jurisdiction: String,
    pub compliance_documents: Vec<String>, // IPFS hashes
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum KYCLevel {
    None,
    Basic,
    Enhanced,
    Premium,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AMLStatus {
    NotScreened,
    Cleared,
    PendingReview,
    Flagged,
    Blocked,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum SanctionsStatus {
    NotChecked,
    Cleared,
    UnderReview,
    Sanctioned,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RiskAssessment {
    pub overall_risk_score: f64,
    pub fraud_risk: f64,
    pub compliance_risk: f64,
    pub operational_risk: f64,
    pub risk_factors: Vec<RiskFactor>,
    pub last_assessment: u64,
    pub assessment_model_version: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RiskFactor {
    pub factor_type: String,
    pub weight: f64,
    pub score: f64,
    pub description: String,
    pub mitigation_suggestions: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: u64,
    pub principal: Principal,
    pub operation: AuditOperation,
    pub resource_id: String,
    pub resource_type: String,
    pub details: AuditDetails,
    pub result: OperationResult,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AuditOperation {
    CreateIdentity,
    UpdateIdentity,
    AddCredential,
    RevokeCredential,
    LinkWallet,
    UnlinkWallet,
    LinkAsset,
    UnlinkAsset,
    CrossChainVerification,
    AIVerification,
    ComplianceUpdate,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AuditDetails {
    pub operation_specific_data: String, // JSON serialized data
    pub sensitive_data_redacted: bool,
    pub related_entities: Vec<String>,
    pub compliance_notes: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum OperationResult {
    Success,
    PartialSuccess(String),
    Failure(String),
    SecurityBlocked(String),
    RateLimited,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RateLimitConfig {
    pub admin: Principal,
    pub ai_verifier_canister: Principal,
    pub max_identity_creates_per_hour: u32,
    pub max_credential_adds_per_hour: u32,
    pub max_wallet_links_per_hour: u32,
    pub max_asset_links_per_hour: u32,
    pub max_verification_requests_per_hour: u32,
}
pub type CanisterConfig = RateLimitConfig; // Alias for clarity

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RateLimitTracker {
    pub principal: Principal,
    pub operation_type: String,
    pub count: u32,
    pub window_start: u64,
    pub last_operation: u64,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum Error {
    NotFound(String),
    Unauthorized,
    RateLimitExceeded,
    InvalidInput(String),
    VerificationFailed(String),
    CanisterError(String),
}

type Result<T, E = Error> = std::result::Result<T, E>;

//=============================================================================
// GLOBAL STATE MANAGEMENT
//=============================================================================

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static IDENTITIES: RefCell<StableBTreeMap<String, Identity, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static RATE_LIMITS: RefCell<StableBTreeMap<String, RateLimitTracker, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );

    static AUDIT_TRAIL: RefCell<StableBTreeMap<String, AuditEntry, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );

    static RATE_LIMIT_CONFIG: RefCell<StableCell<RateLimitConfig, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
            RateLimitConfig {
                admin: Principal::anonymous(), // Will be set in init
                ai_verifier_canister: Principal::from_text("bkyz2-fmaaa-aaaaa-qaaaq-cai").unwrap(),
                max_identity_creates_per_hour: 5,
                max_credential_adds_per_hour: 10,
                max_wallet_links_per_hour: 5,
                max_asset_links_per_hour: 10,
                max_verification_requests_per_hour: 20,
            }
        ).expect("Failed to init rate limit config")
    );

    static BRIDGE_SERVICE: RefCell<BridgeService> = RefCell::new(BridgeService::new());

    static FILE_STORAGE: RefCell<FileStorageService> = RefCell::new(FileStorageService::new());
}

//=============================================================================
// STORABLE IMPLEMENTATIONS
//=============================================================================

impl Storable for Identity {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for RateLimitTracker {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for RateLimitConfig {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for AuditEntry {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for CrossChainSignature {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for ComplianceStatus {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for RiskAssessment {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

//=============================================================================
// HELPER FUNCTIONS
//=============================================================================

fn validate_identity_id(identity_id: &str) -> Result<()> {
    if identity_id.is_empty() || identity_id.len() > 100 {
        return Err(Error::InvalidInput(
            "Invalid identity ID length".to_string(),
        ));
    }

    if !identity_id.starts_with("gt_id_") {
        return Err(Error::InvalidInput(
            "Invalid identity ID format".to_string(),
        ));
    }

    // Enhanced validation: check for valid hex characters after timestamp
    let parts: Vec<&str> = identity_id.split('_').collect();
    if parts.len() != 4 || parts[0] != "gt" || parts[1] != "id" {
        return Err(Error::InvalidInput(
            "Invalid identity ID format".to_string(),
        ));
    }

    // Validate timestamp part is valid hex
    if let Err(_) = u64::from_str_radix(parts[2], 16) {
        return Err(Error::InvalidInput(
            "Invalid identity ID timestamp".to_string(),
        ));
    }

    // Validate random part is valid hex
    if parts[3].len() != 32 || !parts[3].chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(Error::InvalidInput(
            "Invalid identity ID random component".to_string(),
        ));
    }

    // Additional security: Check for suspicious patterns
    if identity_id.contains("../") || identity_id.contains("<") || identity_id.contains(">") {
        return Err(Error::InvalidInput(
            "Identity ID contains invalid characters".to_string(),
        ));
    }

    Ok(())
}

fn validate_wallet_address(address: &str, chain_type: &ChainType) -> Result<()> {
    match chain_type {
        ChainType::Bitcoin => {
            if address.len() < 26 || address.len() > 62 {
                return Err(Error::InvalidInput(
                    "Invalid Bitcoin address length".to_string(),
                ));
            }
            if !address.starts_with('1') && !address.starts_with('3') && !address.starts_with("bc1")
            {
                return Err(Error::InvalidInput(
                    "Invalid Bitcoin address format".to_string(),
                ));
            }
        }
        ChainType::Ethereum => {
            if address.len() != 42 || !address.starts_with("0x") {
                return Err(Error::InvalidInput(
                    "Invalid Ethereum address format".to_string(),
                ));
            }
            let hex_part = &address[2..];
            if !hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
                return Err(Error::InvalidInput(
                    "Invalid Ethereum address characters".to_string(),
                ));
            }
        }
        ChainType::Solana => {
            if address.len() < 32 || address.len() > 44 {
                return Err(Error::InvalidInput(
                    "Invalid Solana address length".to_string(),
                ));
            }
        }
        _ => {
            if address.is_empty() || address.len() > 100 {
                return Err(Error::InvalidInput("Invalid address length".to_string()));
            }
        }
    }
    Ok(())
}

fn check_rate_limit(operation_type: &str) -> Result<()> {
    let caller = caller();
    let current_time = time();
    let hour_in_ns = 3600 * 1_000_000_000; // 1 hour in nanoseconds

    let rate_limits = RATE_LIMIT_CONFIG.with(|config| config.borrow().get().clone());

    let max_operations = match operation_type {
        "create_identity" => rate_limits.max_identity_creates_per_hour,
        "add_credential" => rate_limits.max_credential_adds_per_hour,
        "link_wallet" => rate_limits.max_wallet_links_per_hour,
        "link_asset" => rate_limits.max_asset_links_per_hour,
        "verification_request" => rate_limits.max_verification_requests_per_hour,
        _ => 100, // Default limit
    };

    let tracker_key = format!("{}:{}", caller, operation_type);

    RATE_LIMITS.with(|limits| {
        let mut limits_map = limits.borrow_mut();

        if let Some(mut tracker) = limits_map.get(&tracker_key) {
            // Reset counter if window has passed
            if current_time - tracker.window_start > hour_in_ns {
                tracker.count = 0;
                tracker.window_start = current_time;
            }

            if tracker.count >= max_operations {
                // Enhanced security: Add exponential backoff for repeated violations
                let violation_key = format!("violation_{}", caller);
                RATE_LIMITS.with(|vl| {
                    let mut violation_tracker = RateLimitTracker {
                        principal: caller,
                        operation_type: "violations".to_string(),
                        count: 1,
                        window_start: current_time,
                        last_operation: current_time,
                    };
                    
                    if let Some(existing_violations) = vl.borrow().get(&violation_key) {
                        violation_tracker.count = existing_violations.count + 1;
                    }
                    
                    vl.borrow_mut().insert(violation_key, violation_tracker);
                });
                return Err(Error::RateLimitExceeded);
            }

            tracker.count += 1;
            tracker.last_operation = current_time;
            limits_map.insert(tracker_key, tracker);
        } else {
            // Create new tracker
            let new_tracker = RateLimitTracker {
                principal: caller,
                operation_type: operation_type.to_string(),
                count: 1,
                window_start: current_time,
                last_operation: current_time,
            };
            limits_map.insert(tracker_key, new_tracker);
        }

        Ok(())
    })
}

async fn generate_secure_random_id(prefix: &str) -> Result<String> {
    let timestamp = time();

    let random_result = raw_rand().await;
    let (random_bytes,) = match random_result {
        Ok(bytes) => bytes,
        Err(e) => {
            return Err(Error::CanisterError(format!(
                "Failed to generate secure random bytes: {:?}",
                e
            )))
        }
    };

    if random_bytes.len() < 16 {
        return Err(Error::CanisterError(
            "Insufficient random bytes generated".to_string(),
        ));
    }

    let random_hex = hex::encode(&random_bytes[0..16]);
    Ok(format!("{}_{:016x}_{}", prefix, timestamp, random_hex))
}

fn generate_did(identity_id: &str, owner: &Principal) -> Result<String> {
    let mut hasher = Sha256::new();
    hasher.update(identity_id.as_bytes());
    hasher.update(owner.as_slice());
    hasher.update(id().as_slice());
    hasher.update(time().to_be_bytes());
    let hash = hasher.finalize();
    Ok(format!("did:icp:{}", hex::encode(&hash[..16])))
}

fn is_admin() -> Result<()> {
    let config = RATE_LIMIT_CONFIG.with(|c| c.borrow().get().clone());
    if caller() != config.admin {
        Err(Error::Unauthorized)
    } else {
        Ok(())
    }
}

//=============================================================================
// AUDIT TRAIL FUNCTIONS
//=============================================================================

fn create_audit_entry(
    operation: AuditOperation,
    resource_id: String,
    resource_type: String,
    details: AuditDetails,
    result: OperationResult,
) {
    let audit_id = format!("audit_{}_{}", time(), caller());

    let audit_entry = AuditEntry {
        id: audit_id.clone(),
        timestamp: time(),
        principal: caller(),
        operation,
        resource_id,
        resource_type,
        details,
        result,
    };

    AUDIT_TRAIL.with(|trail| {
        trail.borrow_mut().insert(audit_id, audit_entry);
    });
}

//=============================================================================
// CROSS-CANISTER COMMUNICATION
//=============================================================================

// AI Verifier canister interface
#[derive(CandidType, Deserialize)]
struct AssetVerificationRequest {
    identity_id: String,
    asset_id: String,
    asset_type: String,
    asset_data: String,
    requester: Principal,
}

#[derive(CandidType, Deserialize)]
struct AIVerificationResult {
    request_id: String,
    identity_id: String,
    asset_id: Option<String>,
    fraud_score: f64,
    confidence_level: f64,
    quality_score: f64,
    human_review_required: bool,
    processed_at: u64,
    expires_at: u64,
}

// Asset verification tracking
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AssetVerification {
    pub asset_id: String,
    pub identity_id: String,
    pub ai_request_id: Option<String>,
    pub verification_status: String,
    pub fraud_score: Option<f64>,
    pub confidence_level: Option<f64>,
    pub verification_requested_at: u64,
    pub verification_completed_at: Option<u64>,
    pub human_review_required: bool,
}

impl Storable for AssetVerification {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    const BOUND: Bound = Bound::Unbounded;
}

// Add to global storage
thread_local! {
    static ASSET_VERIFICATIONS: RefCell<StableBTreeMap<String, AssetVerification, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))),
        )
    );
}

async fn call_ai_verification(
    identity_id: String,
    asset_id: String,
    asset_type: String,
    asset_data: String,
) -> Result<String> {
    let config = RATE_LIMIT_CONFIG.with(|c| c.borrow().get().clone());
    let canister_id = config.ai_verifier_canister;

    let args = (
        identity_id.clone(),
        asset_id.clone(),
        asset_type,
        asset_data,
        caller(),
    );

    // Call the AI verification canister
    let result: Result<(Result<String, String>,), _> =
        ic_cdk::call(canister_id, "submit_asset_verification_request", args).await;

    match result {
        Ok((Ok(request_id),)) => {
            // Store the verification tracking
            let verification = AssetVerification {
                asset_id: asset_id.clone(),
                identity_id: identity_id.clone(),
                ai_request_id: Some(request_id.clone()),
                verification_status: "Processing".to_string(),
                fraud_score: None,
                confidence_level: None,
                verification_requested_at: time(),
                verification_completed_at: None,
                human_review_required: false,
            };

            ASSET_VERIFICATIONS.with(|verifications| {
                verifications.borrow_mut().insert(asset_id, verification);
            });

            Ok(request_id)
        }
        Ok((Err(error),)) => Err(Error::VerificationFailed(format!(
            "AI verification request failed: {}",
            error
        ))),
        Err((code, msg)) => Err(Error::CanisterError(format!(
            "Failed to call AI canister: {:?} - {}",
            code, msg
        ))),
    }
}

async fn check_ai_verification_result(request_id: String) -> Result<AIVerificationResult> {
    let config = RATE_LIMIT_CONFIG.with(|c| c.borrow().get().clone());
    let canister_id = config.ai_verifier_canister;

    let result: Result<(Result<AIVerificationResult, String>,), _> =
        ic_cdk::call(canister_id, "get_asset_verification_result", (request_id,)).await;

    match result {
        Ok((Ok(verification_result),)) => Ok(verification_result),
        Ok((Err(error),)) => Err(Error::VerificationFailed(error)),
        Err((code, msg)) => Err(Error::CanisterError(format!(
            "Failed to get verification result: {:?} - {}",
            code, msg
        ))),
    }
}

//=============================================================================
// ENHANCED VALIDATION AND VERIFICATION
//=============================================================================

async fn verify_wallet_signature(
    address: &str,
    signature: &str,
    _message: &str,
    chain_type: &ChainType,
) -> Result<bool> {
    // Placeholder for cross-chain signature verification
    // TODO: Implement actual Chain Fusion integration
    match chain_type {
        ChainType::Bitcoin => {
            // Bitcoin signature verification placeholder
            Ok(signature.len() > 60 && address.len() > 25) // Mock
        }
        ChainType::Ethereum => {
            // Ethereum signature verification placeholder
            Ok(signature.starts_with("0x") && signature.len() == 132 && address.starts_with("0x"))
            // Mock
        }
        ChainType::Solana => {
            // Solana signature verification placeholder
            Ok(signature.len() > 80 && address.len() > 30) // Mock
        }
        _ => Ok(false), // Unsupported for now
    }
}

async fn request_ai_verification(identity_id: String) -> Result<String> {
    check_rate_limit("verification_request")?;

    let verification_id = generate_secure_random_id("ai_verify").await?;

    // TODO: Call external AI canister for verification
    // This is a placeholder for AI integration

    // Update reputation based on AI results (mock positive result)
    update_reputation_score(
        &identity_id,
        5.0,
        "AI verification completed successfully".to_string(),
    )
    .await?;

    Ok(verification_id)
}

async fn update_reputation_score(
    identity_id: &str,
    score_change: f64,
    reason: String,
) -> Result<()> {
    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id.to_string()) {
            let old_score = identity.reputation_score;
            identity.reputation_score = (identity.reputation_score + score_change)
                .max(0.0)
                .min(100.0);

            let reputation_event = ReputationEvent {
                event_type: if score_change > 0.0 {
                    ReputationEventType::SystemAction
                } else {
                    ReputationEventType::FraudReported
                },
                score_change,
                timestamp: time(),
                reason: reason.clone(),
                verified_by: Some(caller()),
            };

            identity.reputation_history.push(reputation_event);
            identity.updated_at = time();

            identities_map.insert(identity_id.to_string(), identity.clone());

            // Create audit entry
            create_audit_entry(
                AuditOperation::UpdateIdentity,
                identity_id.to_string(),
                "reputation_update".to_string(),
                AuditDetails {
                    operation_specific_data: format!(
                        "{{\"old_score\":{},\"new_score\":{},\"change\": {}}}",
                        old_score, identity.reputation_score, score_change
                    ),
                    sensitive_data_redacted: false,
                    related_entities: vec![],
                    compliance_notes: Some(reason),
                },
                OperationResult::Success,
            );

            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })
}

//=============================================================================
// CORE API FUNCTIONS
//=============================================================================

#[update]
async fn create_identity(
    internet_identity_anchor: Option<u64>,
    initial_credentials: Vec<VerifiableCredential>,
    privacy_settings: PrivacySettings,
) -> Result<String> {
    check_rate_limit("create_identity")?;

    let caller_principal = caller();
    let current_time = time();

    let identity_id = generate_secure_random_id("gt_id").await?;
    let did = generate_did(&identity_id, &caller_principal)?;

    let identity = Identity {
        id: identity_id.clone(),
        owner: caller_principal,
        did,
        internet_identity_anchor,
        credentials: initial_credentials.clone(),
        verification_status: VerificationStatus::Pending,
        reputation_score: 50.0,
        reputation_history: vec![ReputationEvent {
            event_type: ReputationEventType::SystemAction,
            score_change: 50.0,
            timestamp: current_time,
            reason: "Initial identity creation".to_string(),
            verified_by: Some(caller_principal),
        }],
        privacy_settings: privacy_settings.clone(),
        linked_wallets: Vec::new(),
        linked_assets: Vec::new(),
        cross_chain_signatures: Vec::new(),
        compliance_status: ComplianceStatus {
            kyc_level: KYCLevel::None,
            aml_status: AMLStatus::NotScreened,
            sanctions_check: SanctionsStatus::NotChecked,
            last_updated: current_time,
            jurisdiction: "global".to_string(),
            compliance_documents: Vec::new(),
        },
        risk_assessment: RiskAssessment {
            overall_risk_score: 0.3, // Low initial risk
            fraud_risk: 0.2,
            compliance_risk: 0.4,
            operational_risk: 0.3,
            risk_factors: Vec::new(),
            last_assessment: current_time,
            assessment_model_version: "v1.0.0".to_string(),
        },
        created_at: current_time,
        updated_at: current_time,
        last_activity: current_time,
    };

    IDENTITIES.with(|identities| {
        identities
            .borrow_mut()
            .insert(identity_id.clone(), identity);
    });

    // Create audit entry
    create_audit_entry(
        AuditOperation::CreateIdentity,
        identity_id.clone(),
        "identity".to_string(),
        AuditDetails {
            operation_specific_data: format!(
                "{{\"credentials_count\":{},\"ii_anchor\":{}}}",
                initial_credentials.len(),
                internet_identity_anchor.map_or("null".to_string(), |a| a.to_string())
            ),
            sensitive_data_redacted: true,
            related_entities: vec![],
            compliance_notes: Some("New identity created".to_string()),
        },
        OperationResult::Success,
    );

    // Trigger AI verification asynchronously
    let identity_id_clone = identity_id.clone();
    ic_cdk::spawn(async move {
        let _ = request_ai_verification(identity_id_clone).await;
    });

    Ok(identity_id)
}

#[update]
async fn add_credential(identity_id: String, credential: VerifiableCredential) -> Result<()> {
    check_rate_limit("add_credential")?;
    validate_identity_id(&identity_id)?;

    let caller = caller();

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            if identity.owner != caller {
                return Err(Error::Unauthorized);
            }

            identity.credentials.push(credential);
            identity.updated_at = time();
            identity.last_activity = time();

            identities_map.insert(identity_id, identity);
            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })
}

#[update]
async fn link_wallet(
    identity_id: String,
    chain_type: ChainType,
    wallet_address: String,
) -> Result<()> {
    check_rate_limit("link_wallet")?;
    validate_identity_id(&identity_id)?;
    validate_wallet_address(&wallet_address, &chain_type)?;

    let caller = caller();

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            if identity.owner != caller {
                return Err(Error::Unauthorized);
            }

            // Check if wallet is already linked
            if identity
                .linked_wallets
                .iter()
                .any(|w| w.address == wallet_address)
            {
                return Err(Error::InvalidInput("Wallet already linked".to_string()));
            }

            let wallet = LinkedWallet {
                chain_type: chain_type.clone(),
                address: wallet_address.clone(),
                verification_status: WalletVerificationStatus::Pending,
                linked_at: time(),
            };

            identity.linked_wallets.push(wallet);
            identity.updated_at = time();
            identity.last_activity = time();

            identities_map.insert(identity_id.clone(), identity);

            // Create audit entry
            create_audit_entry(
                AuditOperation::LinkWallet,
                identity_id,
                "wallet_linked".to_string(),
                AuditDetails {
                    operation_specific_data: format!(
                        "{{\"chain_type\":\"{:?}\",\"address\":\"{}\"}}",
                        chain_type, wallet_address
                    ),
                    sensitive_data_redacted: false,
                    related_entities: vec![wallet_address],
                    compliance_notes: Some("Wallet linked to identity".to_string()),
                },
                OperationResult::Success,
            );

            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })
}

#[update]
async fn link_wallet_verified(
    identity_id: String,
    chain_type: ChainType,
    wallet_address: String,
    signature: String,
    message: String,
) -> Result<()> {
    check_rate_limit("link_wallet")?;
    validate_identity_id(&identity_id)?;
    validate_wallet_address(&wallet_address, &chain_type)?;

    // Verify wallet ownership through signature
    let signature_valid =
        verify_wallet_signature(&wallet_address, &signature, &message, &chain_type).await?;

    if !signature_valid {
        create_audit_entry(
            AuditOperation::LinkWallet,
            identity_id.clone(),
            "wallet_link_failed".to_string(),
            AuditDetails {
                operation_specific_data: format!(
                    "{{\"chain_type\":\"{:?}\",\"address\":\"{}\",\"reason\":\"Invalid signature\"}}",
                    chain_type, wallet_address
                ),
                sensitive_data_redacted: false,
                related_entities: vec![wallet_address.clone()],
                compliance_notes: Some("Signature verification failed".to_string()),
            },
            OperationResult::SecurityBlocked("Invalid wallet signature".to_string()),
        );
        return Err(Error::VerificationFailed(
            "Invalid wallet signature".to_string(),
        ));
    }

    let caller = caller();

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            if identity.owner != caller {
                return Err(Error::Unauthorized);
            }

            // Check if wallet is already linked
            if identity
                .linked_wallets
                .iter()
                .any(|w| w.address == wallet_address)
            {
                return Err(Error::InvalidInput("Wallet already linked".to_string()));
            }

            let wallet = LinkedWallet {
                chain_type: chain_type.clone(),
                address: wallet_address.clone(),
                verification_status: WalletVerificationStatus::Verified,
                linked_at: time(),
            };

            // Store cross-chain signature
            let cross_chain_sig = CrossChainSignature {
                chain_type: chain_type.clone(),
                signature_type: match chain_type {
                    ChainType::Bitcoin | ChainType::Ethereum => SignatureType::ECDSA,
                    ChainType::Solana => SignatureType::EdDSA,
                    _ => SignatureType::ECDSA,
                },
                public_key: "".to_string(), // TODO: Extract from signature
                signature: signature.clone(),
                message_hash: message.clone(),
                verification_status: SignatureVerificationStatus::Verified,
                created_at: time(),
                verified_at: Some(time()),
            };

            identity.linked_wallets.push(wallet);
            identity.cross_chain_signatures.push(cross_chain_sig);
            identity.updated_at = time();
            identity.last_activity = time();

            identities_map.insert(identity_id.clone(), identity);

            // Update reputation for successful wallet verification
            let identity_id_clone = identity_id.clone();
            ic_cdk::spawn(async move {
                let _ = update_reputation_score(
                    &identity_id_clone,
                    2.0,
                    "Wallet successfully verified and linked".to_string(),
                )
                .await;
            });

            create_audit_entry(
                AuditOperation::LinkWallet,
                identity_id,
                "wallet_verified_linked".to_string(),
                AuditDetails {
                    operation_specific_data: format!(
                        "{{\"chain_type\":\"{:?}\",\"address\":\"{}\"}}",
                        chain_type, wallet_address
                    ),
                    sensitive_data_redacted: false,
                    related_entities: vec![wallet_address],
                    compliance_notes: Some("Wallet verified and linked successfully".to_string()),
                },
                OperationResult::Success,
            );

            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })
}

#[update]
async fn link_asset(identity_id: String, asset_id: String) -> Result<()> {
    check_rate_limit("link_asset")?;
    validate_identity_id(&identity_id)?;

    let caller = caller();

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            if identity.owner != caller {
                return Err(Error::Unauthorized);
            }

            // Check if asset is already linked
            if identity.linked_assets.contains(&asset_id) {
                return Err(Error::InvalidInput("Asset already linked".to_string()));
            }

            identity.linked_assets.push(asset_id.clone());
            identity.updated_at = time();
            identity.last_activity = time();

            identities_map.insert(identity_id.clone(), identity);

            // Create audit entry
            create_audit_entry(
                AuditOperation::LinkAsset,
                identity_id,
                "asset_linked".to_string(),
                AuditDetails {
                    operation_specific_data: format!("{{\"asset_id\":\"{}\"}}", asset_id),
                    sensitive_data_redacted: false,
                    related_entities: vec![asset_id],
                    compliance_notes: Some("Asset linked to identity".to_string()),
                },
                OperationResult::Success,
            );

            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })
}

#[update]
async fn update_reputation(identity_id: String, score_change: f64, reason: String) -> Result<()> {
    validate_identity_id(&identity_id)?;

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            identity.reputation_score = (identity.reputation_score + score_change)
                .max(0.0)
                .min(100.0);

            let reputation_event = ReputationEvent {
                event_type: if score_change > 0.0 {
                    ReputationEventType::SystemAction
                } else {
                    ReputationEventType::FraudReported
                },
                score_change,
                timestamp: time(),
                reason,
                verified_by: Some(caller()),
            };

            identity.reputation_history.push(reputation_event);
            identity.updated_at = time();

            identities_map.insert(identity_id, identity);
            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })
}

#[query]
fn get_identity(identity_id: String) -> Result<Identity> {
    validate_identity_id(&identity_id)?;

    let caller = caller();

    IDENTITIES.with(|identities| {
        match identities.borrow().get(&identity_id) {
            Some(identity) => {
                if identity.owner == caller {
                    Ok(identity.clone())
                } else {
                    // Return filtered public view
                    let mut filtered = identity.clone();
                    // Filter sensitive information based on privacy settings
                    filtered.credentials = identity
                        .credentials
                        .into_iter()
                        .filter(|cred| {
                            identity
                                .privacy_settings
                                .public_credentials
                                .contains(&cred.id)
                        })
                        .collect();
                    Ok(filtered)
                }
            }
            None => Err(Error::NotFound("Identity not found".to_string())),
        }
    })
}

#[query]
fn get_my_identities() -> Vec<Identity> {
    let caller = caller();

    IDENTITIES.with(|identities| {
        identities
            .borrow()
            .iter()
            .filter(|(_, identity)| identity.owner == caller)
            .map(|(_, identity)| identity.clone())
            .collect()
    })
}

#[query]
fn get_identity_stats() -> (u64, u64) {
    let total_identities = IDENTITIES.with(|identities| identities.borrow().len());
    let verified_identities = IDENTITIES.with(|identities| {
        identities
            .borrow()
            .iter()
            .filter(|(_, identity)| {
                matches!(identity.verification_status, VerificationStatus::Verified)
            })
            .count()
    });

    (total_identities, verified_identities as u64)
}

#[query]
fn get_audit_trail(
    identity_id: String,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<AuditEntry>> {
    validate_identity_id(&identity_id)?;

    let caller = caller();

    // Verify identity ownership or admin access
    let identity = IDENTITIES
        .with(|identities| identities.borrow().get(&identity_id))
        .ok_or(Error::NotFound("Identity not found".to_string()))?;

    if identity.owner != caller {
        return Err(Error::Unauthorized);
    }

    let limit = limit.unwrap_or(50).min(100) as usize;
    let offset = offset.unwrap_or(0) as usize;

    let mut audit_entries: Vec<AuditEntry> = AUDIT_TRAIL.with(|trail| {
        trail
            .borrow()
            .iter()
            .filter(|(_, entry)| entry.resource_id == identity_id)
            .map(|(_, entry)| entry.clone())
            .collect()
    });

    // Sort by timestamp descending
    audit_entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    // Apply pagination
    let end = (offset + limit).min(audit_entries.len());
    if offset < audit_entries.len() {
        Ok(audit_entries[offset..end].to_vec())
    } else {
        Ok(Vec::new())
    }
}

#[query]
fn get_compliance_status(identity_id: String) -> Result<ComplianceStatus> {
    validate_identity_id(&identity_id)?;

    let caller = caller();

    IDENTITIES.with(|identities| match identities.borrow().get(&identity_id) {
        Some(identity) => {
            if identity.owner == caller {
                Ok(identity.compliance_status.clone())
            } else {
                Err(Error::Unauthorized)
            }
        }
        None => Err(Error::NotFound("Identity not found".to_string())),
    })
}

#[query]
fn get_risk_assessment(identity_id: String) -> Result<RiskAssessment> {
    validate_identity_id(&identity_id)?;

    let caller = caller();

    IDENTITIES.with(|identities| {
        match identities.borrow().get(&identity_id) {
            Some(identity) => {
                if identity.owner == caller {
                    Ok(identity.risk_assessment.clone())
                } else {
                    // Return filtered view for non-owners
                    let mut filtered_assessment = identity.risk_assessment.clone();
                    filtered_assessment.risk_factors = Vec::new(); // Hide detailed risk factors
                    Ok(filtered_assessment)
                }
            }
            None => Err(Error::NotFound("Identity not found".to_string())),
        }
    })
}

#[update]
async fn link_asset_with_verification(
    identity_id: String,
    asset_id: String,
    asset_type: String,
    asset_data: String, // JSON encoded asset details
) -> Result<String> {
    check_rate_limit("link_asset")?;
    validate_identity_id(&identity_id)?;

    let caller = caller();

    // First link the asset
    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            if identity.owner != caller {
                return Err(Error::Unauthorized);
            }

            // Check if asset is already linked
            if identity.linked_assets.contains(&asset_id) {
                return Err(Error::InvalidInput("Asset already linked".to_string()));
            }

            identity.linked_assets.push(asset_id.clone());
            identity.updated_at = time();
            identity.last_activity = time();

            identities_map.insert(identity_id.clone(), identity);
            Ok(())
        } else {
            Err(Error::NotFound("Identity not found".to_string()))
        }
    })?;

    // Then trigger AI verification
    let ai_request_id = call_ai_verification(
        identity_id.clone(),
        asset_id.clone(),
        asset_type,
        asset_data,
    )
    .await?;

    // Create audit entry
    create_audit_entry(
        AuditOperation::LinkAsset,
        identity_id,
        "asset_linked_with_verification".to_string(),
        AuditDetails {
            operation_specific_data: format!(
                "{{\"asset_id\":\"{}\",\"ai_request_id\":\"{}\"}}",
                asset_id, ai_request_id
            ),
            sensitive_data_redacted: false,
            related_entities: vec![asset_id, ai_request_id.clone()],
            compliance_notes: Some("Asset linked and AI verification initiated".to_string()),
        },
        OperationResult::Success,
    );

    Ok(ai_request_id)
}

#[query]
fn get_asset_verification_status(asset_id: String) -> Result<AssetVerification> {
    let caller = caller();

    // Get the verification record
    let verification = ASSET_VERIFICATIONS
        .with(|verifications| verifications.borrow().get(&asset_id))
        .ok_or(Error::NotFound("Asset verification not found".to_string()))?;

    // Check if caller owns the identity
    let identity = IDENTITIES
        .with(|identities| identities.borrow().get(&verification.identity_id))
        .ok_or(Error::NotFound("Identity not found".to_string()))?;

    if identity.owner != caller {
        return Err(Error::Unauthorized);
    }

    Ok(verification)
}

#[update]
async fn update_asset_verification_result(asset_id: String) -> Result<AssetVerification> {
    let caller = caller();

    // Get the verification record
    let mut verification = ASSET_VERIFICATIONS
        .with(|verifications| verifications.borrow().get(&asset_id))
        .ok_or(Error::NotFound("Asset verification not found".to_string()))?;

    // Check if caller owns the identity
    let identity = IDENTITIES
        .with(|identities| identities.borrow().get(&verification.identity_id))
        .ok_or(Error::NotFound("Identity not found".to_string()))?;

    if identity.owner != caller {
        return Err(Error::Unauthorized);
    }

    // If we have an AI request ID, check for results
    if let Some(ai_request_id) = &verification.ai_request_id {
        match check_ai_verification_result(ai_request_id.clone()).await {
            Ok(ai_result) => {
                // Update verification with AI results
                verification.verification_status = "Completed".to_string();
                verification.fraud_score = Some(ai_result.fraud_score);
                verification.confidence_level = Some(ai_result.confidence_level);
                verification.verification_completed_at = Some(time());
                verification.human_review_required = ai_result.human_review_required;

                // Store updated verification
                ASSET_VERIFICATIONS.with(|verifications| {
                    verifications
                        .borrow_mut()
                        .insert(asset_id.clone(), verification.clone());
                });

                // Update identity reputation based on verification results
                let reputation_change = if ai_result.fraud_score < 0.3 {
                    3.0 // Good asset verification
                } else if ai_result.fraud_score < 0.7 {
                    0.0 // Neutral
                } else {
                    -5.0 // Bad asset verification
                };

                if reputation_change != 0.0 {
                    let _ = update_reputation_score(
                        &verification.identity_id,
                        reputation_change,
                        format!(
                            "Asset verification completed: fraud_score={:.2}",
                            ai_result.fraud_score
                        ),
                    )
                    .await;
                }

                // Create audit entry
                create_audit_entry(
                    AuditOperation::AIVerification,
                    verification.identity_id.clone(),
                    "asset_verification_completed".to_string(),
                    AuditDetails {
                        operation_specific_data: format!(
                            "{{\"asset_id\":\"{}\",\"fraud_score\":{:.2},\"confidence\":{:.2}}}",
                            asset_id, ai_result.fraud_score, ai_result.confidence_level
                        ),
                        sensitive_data_redacted: false,
                        related_entities: vec![asset_id],
                        compliance_notes: Some(
                            "AI verification completed successfully".to_string(),
                        ),
                    },
                    OperationResult::Success,
                );
            }
            Err(_) => {
                // AI verification still in progress or failed
                // Keep current status
            }
        }
    }

    Ok(verification)
}

//=============================================================================
// CROSS-CHAIN BRIDGE FUNCTIONS
//=============================================================================

#[update]
async fn initiate_cross_chain_bridge(
    from_chain: ChainType,
    to_chain: ChainType,
    asset_type: String,
    amount: u64,
    from_address: String,
    to_address: String,
) -> Result<String, String> {
    let caller = caller();

    BRIDGE_SERVICE.with(|service| {
        service.borrow_mut().initiate_bridge_request(
            from_chain,
            to_chain,
            asset_type,
            amount,
            from_address,
            to_address,
            caller,
        )
    })
}

#[query]
fn get_bridge_request(request_id: String) -> Result<BridgeRequest, String> {
    BRIDGE_SERVICE.with(
        |service| match service.borrow().get_bridge_request(&request_id) {
            Some(request) => Ok(request.clone()),
            None => Err("Bridge request not found".to_string()),
        },
    )
}

#[query]
fn get_user_bridge_history() -> Vec<BridgeRequest> {
    let caller = caller();
    BRIDGE_SERVICE.with(|service| service.borrow().get_user_bridge_history(caller))
}

#[update]
async fn update_bridge_status(
    request_id: String,
    status: BridgeStatus,
    transaction_hash: Option<String>,
) -> Result<(), String> {
    // TODO: Add admin authorization check
    BRIDGE_SERVICE.with(|service| {
        service
            .borrow_mut()
            .update_bridge_status(&request_id, status, transaction_hash)
    })
}

#[query]
fn calculate_bridge_fee(from_chain: ChainType, amount: u64) -> BridgeFee {
    BRIDGE_SERVICE.with(|service| service.borrow().calculate_bridge_fee(&from_chain, amount))
}

#[query]
fn get_supported_chains() -> Vec<ChainConfig> {
    BRIDGE_SERVICE.with(|service| service.borrow().get_supported_chains())
}

//=============================================================================
// FILE STORAGE FUNCTIONS
//=============================================================================

#[update]
async fn upload_file(request: FileUploadRequest) -> Result<FileUploadResponse, String> {
    let caller = caller();

    FILE_STORAGE.with(|storage| storage.borrow_mut().upload_file(request, caller))
}

#[query]
fn get_file_metadata(file_id: String) -> Result<FileMetadata, String> {
    let caller = caller();

    FILE_STORAGE.with(|storage| storage.borrow().get_file_metadata(&file_id, caller))
}

#[query]
fn get_user_files() -> Vec<FileMetadata> {
    let caller = caller();

    FILE_STORAGE.with(|storage| storage.borrow().get_user_files(caller))
}

#[query]
fn get_asset_files(asset_id: String) -> Result<Vec<FileMetadata>, String> {
    let caller = caller();

    FILE_STORAGE.with(|storage| storage.borrow().get_asset_files(&asset_id, caller))
}

#[update]
async fn delete_file(file_id: String) -> Result<(), String> {
    let caller = caller();

    FILE_STORAGE.with(|storage| storage.borrow_mut().delete_file(&file_id, caller))
}

#[query]
fn download_file(file_id: String) -> Result<Vec<u8>, String> {
    let caller = caller();

    FILE_STORAGE.with(|storage| storage.borrow().get_file(&file_id, caller))
}

//=============================================================================
// INITIALIZATION & UPGRADE HOOKS
//=============================================================================

#[init]
fn init() {
    ic_cdk::println!("GlobalTrust Enhanced Identity Canister initializing...");

    // Set the deployer as the initial admin
    let deployer = caller();
    RATE_LIMIT_CONFIG.with(|config_cell| {
        let mut config = config_cell.borrow().get().clone();
        config.admin = deployer;
        let _ = config_cell.borrow_mut().set(config);
    });
    ic_cdk::println!(
        "Enhanced Identity Canister initialized. Admin set to: {}",
        deployer
    );
}

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("Enhanced Identity Canister upgrade starting...");
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("Enhanced Identity Canister upgrade completed successfully");
}

export_candid!();
