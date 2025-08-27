//! GlobalTrust Identity Management Canister
//! Handles creation, storage, and management of decentralized identities
//! with verifiable credentials and privacy controls

use candid::{CandidType, Decode, Encode, Principal};
use ic_cdk::api::{caller, id, time};
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell, Storable};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::cell::RefCell;

// Type aliases for memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;
type IdCell = StableCell<u64, Memory>;

// Global state management using stable structures
thread_local! {
static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // Core identity storage
    static IDENTITIES: RefCell<StableBTreeMap<String, Identity, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    // Identity counter for unique IDs
    static IDENTITY_COUNTER: RefCell<IdCell> = RefCell::new(
        IdCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
            0
        ).expect("Failed to init identity counter")
    );

    // Verification requests queue
    static VERIFICATION_REQUESTS: RefCell<StableBTreeMap<String, VerificationRequest, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );

    // Access control for admin functions
    static ADMIN_PRINCIPALS: RefCell<StableBTreeMap<String, AdminRole, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
        )
    );

    // DID registry for decentralized identifiers
    static DID_REGISTRY: RefCell<StableBTreeMap<String, DIDDocument, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))),
        )
    );

}

//=============================================================================
// CORE DATA STRUCTURES
//=============================================================================

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Identity {
pub id: String,
pub owner: Principal,
pub did: String,
pub credentials: Vec<VerifiableCredential>,
pub verification_status: VerificationStatus,
pub created_at: u64,
pub updated_at: u64,
pub privacy_settings: PrivacySettings,
pub cross_chain_anchors: Vec<CrossChainAnchor>,
pub reputation_score: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerifiableCredential {
pub id: String,
pub credential_type: CredentialType,
pub issuer: Principal,
pub issuer_name: String,
pub subject: Principal,
pub issuance_date: u64,
pub expiration_date: Option<u64>,
pub claim: CredentialClaim,
pub proof: CryptographicProof,
pub metadata_ipfs_hash: String,
pub status: CredentialStatus,
pub ai_validation_score: Option<f64>,
pub revocation_registry: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialType {
Government(GovernmentCredential),
Academic(AcademicCredential),
Professional(ProfessionalCredential),
Financial(FinancialCredential),
Property(PropertyCredential),
Biometric(BiometricCredential),
Custom(CustomCredential),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GovernmentCredential {
pub document_type: DocumentType,
pub issuing_country: String,
pub issuing_authority: String,
pub document_number: String,
pub nationality: String,
pub birth_date: u64,
pub expiry_date: Option<u64>,
pub biometric_hash: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum DocumentType {
Passport,
NationalId,
DriversLicense,
VoterRegistration,
TaxId,
SocialSecurity,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AcademicCredential {
pub institution: String,
pub institution_did: Option<String>,
pub degree_type: DegreeType,
pub field_of_study: String,
pub graduation_date: u64,
pub grade: Option<String>,
pub thesis_title: Option<String>,
pub academic_honors: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum DegreeType {
HighSchool,
Associate,
Bachelor,
Master,
Doctorate,
Certificate,
Diploma,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProfessionalCredential {
pub organization: String,
pub organization_did: Option<String>,
pub position: String,
pub employment_start: u64,
pub employment_end: Option<u64>,
pub license_number: Option<String>,
pub skills: Vec<Skill>,
pub endorsements: Vec<Endorsement>,
pub certifications: Vec<Certification>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Skill {
pub name: String,
pub proficiency_level: ProficiencyLevel,
pub years_experience: u32,
pub verified_by: Vec<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProficiencyLevel {
Beginner,
Intermediate,
Advanced,
Expert,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Endorsement {
pub endorser: Principal,
pub skill: String,
pub relationship: String,
pub message: String,
pub timestamp: u64,
pub signature: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Certification {
pub name: String,
pub issuing_body: String,
pub certificate_id: String,
pub issue_date: u64,
pub expiry_date: Option<u64>,
pub verification_url: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FinancialCredential {
pub credential_type: FinancialCredentialType,
pub issuing_institution: String,
pub credit_score_range: Option<CreditScoreRange>,
pub income_verification: bool,
pub asset_verification: bool,
pub kyc_status: KYCStatus,
pub aml_status: AMLStatus,
pub risk_assessment: RiskAssessment,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum FinancialCredentialType {
BankAccount,
CreditReport,
IncomeVerification,
AssetVerification,
KYCCompliance,
AMLClearance,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CreditScoreRange {
Poor(u16), // 300-579
Fair(u16), // 580-669
Good(u16), // 670-739
VeryGood(u16), // 740-799
Excellent(u16), // 800-850
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PropertyCredential {
pub property_id: String,
pub property_type: PropertyType,
pub location: PropertyLocation,
pub ownership_percentage: f64,
pub ownership_start_date: u64,
pub ownership_end_date: Option<u64>,
pub legal_description: String,
pub valuation: Option<PropertyValuation>,
pub encumbrances: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum PropertyType {
Residential,
Commercial,
Industrial,
Agricultural,
Recreational,
Mixed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PropertyLocation {
pub country: String,
pub state_province: String,
pub city: String,
pub address: String,
pub postal_code: String,
pub coordinates: Option<(f64, f64)>, // (latitude, longitude)
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PropertyValuation {
pub value: u64,
pub currency: String,
pub valuation_date: u64,
pub appraiser: String,
pub method: ValuationMethod,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ValuationMethod {
Market,
Cost,
Income,
Automated,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BiometricCredential {
pub biometric_type: BiometricType,
pub template_hash: String,
pub quality_score: f64,
pub capture_device: String,
pub capture_timestamp: u64,
pub liveness_verified: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum BiometricType {
Fingerprint,
FacialRecognition,
IrisRecognition,
VoicePrint,
PalmPrint,
Signature,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CustomCredential {
pub credential_name: String,
pub schema_url: String,
pub claims: Vec<(String, String)>, // key-value pairs
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialClaim {
Simple(String),
Structured(Vec<(String, String)>),
Encrypted(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CryptographicProof {
pub proof_type: ProofType,
pub created: u64,
pub verification_method: String,
pub proof_purpose: String,
pub signature: String,
pub challenge: Option<String>,
pub domain: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProofType {
Ed25519Signature,
EcdsaSecp256k1Signature,
RsaSignature,
BbsBlsSignature,
ZkProof,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationStatus {
Pending,
Verified,
Rejected(String),
UnderReview,
RequiresAdditionalInfo,
Suspended,
Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialStatus {
Active,
Suspended,
Revoked,
Expired,
PendingRenewal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum KYCStatus {
NotStarted,
InProgress,
BasicCompleted,
EnhancedCompleted,
Rejected,
RequiresUpdate,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AMLStatus {
NotChecked,
Cleared,
Flagged,
UnderInvestigation,
Blocked,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RiskAssessment {
Low,
Medium,
High,
Critical,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PrivacySettings {
pub public_credentials: Vec<String>,
pub selective_disclosure_enabled: bool,
pub zero_knowledge_proofs_enabled: bool,
pub cross_chain_visibility: Vec<String>,
pub data_minimization: bool,
pub consent_management: ConsentSettings,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ConsentSettings {
pub require_explicit_consent: bool,
pub consent_expiry_days: Option<u32>,
pub revocable_consent: bool,
pub purpose_limitation: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CrossChainAnchor {
pub chain_name: String,
pub chain_id: u64,
pub transaction_hash: String,
pub block_number: u64,
pub anchor_type: AnchorType,
pub timestamp: u64,
pub verification_status: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AnchorType {
IdentityRegistration,
CredentialVerification,
OwnershipProof,
BiometricHash,
RevocationRegistry,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationRequest {
pub id: String,
pub identity_id: String,
pub requester: Principal,
pub verification_type: VerificationType,
pub requested_credentials: Vec<String>,
pub purpose: String,
pub legal_basis: Option<String>,
pub data_retention_period: Option<u32>,
pub created_at: u64,
pub expires_at: u64,
pub status: RequestStatus,
pub response: Option<VerificationResponse>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationType {
BasicIdentity,
FullCredentials,
SelectiveDisclosure(Vec<String>),
ZeroKnowledgeProof(String),
CrossChainVerification(String),
BiometricMatch,
AgeVerification(u32),
CitizenshipVerification(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RequestStatus {
Pending,
Approved,
Denied(String),
Expired,
Revoked,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationResponse {
pub verified: bool,
pub verification_level: VerificationLevel,
pub credentials_disclosed: Vec<String>,
pub proof: Option<String>,
pub timestamp: u64,
pub expires_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationLevel {
Basic,
Standard,
Enhanced,
Premium,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AdminRole {
pub principal: Principal,
pub role: AdminRoleType,
pub permissions: Vec<Permission>,
pub created_at: u64,
pub last_active: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AdminRoleType {
SuperAdmin,
SystemAdmin,
VerificationAdmin,
SupportAgent,
Auditor,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum Permission {
ManageIdentities,
ManageCredentials,
ManageVerifications,
ManageSystem,
ViewAuditLogs,
ManageAdmins,
EmergencyActions,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DIDDocument {
pub did: String,
pub context: Vec<String>,
pub verification_methods: Vec<VerificationMethod>,
pub authentication: Vec<String>,
pub assertion_method: Vec<String>,
pub key_agreement: Vec<String>,
pub capability_invocation: Vec<String>,
pub capability_delegation: Vec<String>,
pub service_endpoints: Vec<ServiceEndpoint>,
pub created: u64,
pub updated: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationMethod {
pub id: String,
pub method_type: String,
pub controller: String,
pub public_key: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ServiceEndpoint {
pub id: String,
pub service_type: String,
pub service_endpoint: String,
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

}

impl Storable for VerificationRequest {
fn to_bytes(&self) -> Cow<[u8]> {
Cow::Owned(Encode!(self).unwrap())
}

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

}

impl Storable for AdminRole {
fn to_bytes(&self) -> Cow<[u8]> {
Cow::Owned(Encode!(self).unwrap())
}

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

}

impl Storable for DIDDocument {
fn to_bytes(&self) -> Cow<[u8]> {
Cow::Owned(Encode!(self).unwrap())
}

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

}

//=============================================================================
// ACCESS CONTROL & SECURITY
//=============================================================================

fn is*admin() -> Result<(), String> {
let caller_principal = caller();
ADMIN_PRINCIPALS.with(|admins| {
match admins.borrow().get(&caller_principal.to_string()) {
Some(*) => Ok(()),
None => Err("Unauthorized: Admin access required".to_string()),
}
})
}

fn is*identity_owner(identity_id: &str) -> Result<(), String> {
let caller_principal = caller();
IDENTITIES.with(|identities| {
match identities.borrow().get(identity_id) {
Some(identity) if identity.owner == caller_principal => Ok(()),
Some(*) => Err("Unauthorized: Not identity owner".to_string()),
None => Err("Identity not found".to_string()),
}
})
}

fn has*permission(permission: Permission) -> Result<(), String> {
let caller_principal = caller();
ADMIN_PRINCIPALS.with(|admins| {
match admins.borrow().get(&caller_principal.to_string()) {
Some(admin_role) if admin_role.permissions.contains(&permission) => Ok(()),
Some(*) => Err("Insufficient permissions".to_string()),
None => Err("Unauthorized access".to_string()),
}
})
}

//=============================================================================
// CANISTER INITIALIZATION
//=============================================================================

#[init]
fn init() {
let deployer = caller();
let admin_role = AdminRole {
principal: deployer,
role: AdminRoleType::SuperAdmin,
permissions: vec![
            Permission::ManageIdentities,
            Permission::ManageCredentials,
            Permission::ManageVerifications,
            Permission::ManageSystem,
            Permission::ViewAuditLogs,
            Permission::ManageAdmins,
            Permission::EmergencyActions,
        ],
created_at: time(),
last_active: time(),
};

    ADMIN_PRINCIPALS.with(|admins| {
        admins.borrow_mut().insert(deployer.to_string(), admin_role);
    });

}

//=============================================================================
// CORE IDENTITY FUNCTIONS
//=============================================================================

#[update]
async fn create_identity(
credentials: Vec<VerifiableCredential>,
privacy_settings: PrivacySettings,
) -> Result<String, String> {
let caller_principal = caller();
let current_time = time();

    // Generate unique identity ID
    let identity_id = IDENTITY_COUNTER.with(|counter| {
        let current_count = counter.borrow().get();
        let new_count = current_count + 1;
        counter.borrow_mut().set(new_count).expect("Failed to update counter");
        format!("gt_identity_{:08x}", new_count)
    });

    // Generate DID
    let did = generate_did(&identity_id, &caller_principal);

    // Create DID document
    let did_document = create_did_document(&did, &caller_principal);

    // Create identity
    let identity = Identity {
        id: identity_id.clone(),
        owner: caller_principal,
        did: did.clone(),
        credentials,
        verification_status: VerificationStatus::Pending,
        created_at: current_time,
        updated_at: current_time,
        privacy_settings,
        cross_chain_anchors: Vec::new(),
        reputation_score: 0.0,
    };

    // Store identity and DID document
    IDENTITIES.with(|identities| {
        identities.borrow_mut().insert(identity_id.clone(), identity);
    });

    DID_REGISTRY.with(|registry| {
        registry.borrow_mut().insert(did.clone(), did_document);
    });

    // Trigger AI validation
    ic_cdk::spawn(trigger_ai_validation(identity_id.clone()));

    Ok(identity_id)

}

#[update]
async fn add_credential(
identity_id: String,
credential: VerifiableCredential,
) -> Result<(), String> {
is_identity_owner(&identity_id)?;

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        match identities_map.get(&identity_id) {
            Some(mut identity) => {
                // Validate credential before adding
                if validate_credential(&credential)? {
                    identity.credentials.push(credential);
                    identity.updated_at = time();
                    identity.verification_status = VerificationStatus::UnderReview;
                    identities_map.insert(identity_id.clone(), identity);

                    // Trigger AI re-validation
                    ic_cdk::spawn(trigger_ai_validation(identity_id));
                    Ok(())
                } else {
                    Err("Invalid credential".to_string())
                }
            }
            None => Err("Identity not found".to_string()),
        }
    })

}

#[query]
fn get_identity(identity_id: String) -> Result<Identity, String> {
IDENTITIES.with(|identities| {
match identities.borrow().get(&identity_id) {
Some(identity) => {
let caller_principal = caller();
if identity.owner == caller_principal {
Ok(identity)
} else {
// Return filtered view based on privacy settings
Ok(filter_identity_for_public_view(identity))
}
}
None => Err("Identity not found".to_string()),
}
})
}

#[query]
fn get_did_document(did: String) -> Result<DIDDocument, String> {
DID_REGISTRY.with(|registry| {
registry.borrow().get(&did).ok_or("DID document not found".to_string())
})
}

#[update]
async fn request_verification(
identity_id: String,
verification_type: VerificationType,
requested_credentials: Vec<String>,
purpose: String,
legal_basis: Option<String>,
) -> Result<String, String> {
let caller_principal = caller();
let current_time = time();

    // Validate that identity exists
    let identity_exists = IDENTITIES.with(|identities| {
        identities.borrow().contains_key(&identity_id)
    });

    if !identity_exists {
        return Err("Identity not found".to_string());
    }

    let request_id = format!("vr_{}_{}", current_time, caller_principal.to_text());

    let verification_request = VerificationRequest {
        id: request_id.clone(),
        identity_id,
        requester: caller_principal,
        verification_type,
        requested_credentials,
        purpose,
        legal_basis,
        data_retention_period: Some(30), // Default 30 days
        created_at: current_time,
        expires_at: current_time + (24 * 60 * 60 * 1_000_000_000), // 24 hours in nanoseconds
        status: RequestStatus::Pending,
        response: None,
    };

    VERIFICATION_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id.clone(), verification_request);
    });

    Ok(request_id)

}

#[update]
async fn approve_verification_request(
request_id: String,
disclosed_credentials: Vec<String>,
) -> Result<(), String> {
VERIFICATION_REQUESTS.with(|requests| {
let mut requests_map = requests.borrow_mut();
match requests_map.get(&request_id) {
Some(mut request) => {
// Verify caller is identity owner
is_identity_owner(&request.identity_id)?;

                let current_time = time();
                let response = VerificationResponse {
                    verified: true,
                    verification_level: VerificationLevel::Standard,
                    credentials_disclosed: disclosed_credentials,
                    proof: None, // Could include ZK proof
                    timestamp: current_time,
                    expires_at: current_time + (7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
                };

                request.status = RequestStatus::Approved;
                request.response = Some(response);
                requests_map.insert(request_id, request);
                Ok(())
            }
            None => Err("Verification request not found".to_string()),
        }
    })

}

#[update]
async fn deny_verification_request(
request_id: String,
reason: String,
) -> Result<(), String> {
VERIFICATION_REQUESTS.with(|requests| {
let mut requests_map = requests.borrow_mut();
match requests_map.get(&request_id) {
Some(mut request) => {
is_identity_owner(&request.identity_id)?;
request.status = RequestStatus::Denied(reason);
requests_map.insert(request_id, request);
Ok(())
}
None => Err("Verification request not found".to_string()),
}
})
}

#[query]
fn get_verification_request(request_id: String) -> Result<VerificationRequest, String> {
VERIFICATION_REQUESTS.with(|requests| {
match requests.borrow().get(&request_id) {
Some(request) => {
let caller_principal = caller();
// Only requester or identity owner can view
if request.requester == caller_principal {
Ok(request)
} else {
is_identity_owner(&request.identity_id)?;
Ok(request)
}
}
None => Err("Verification request not found".to_string()),
}
})
}

//=============================================================================
// CROSS-CHAIN FUNCTIONS
//=============================================================================

#[update]
async fn add_cross_chain_anchor(
identity_id: String,
chain_name: String,
chain_id: u64,
transaction_hash: String,
block_number: u64,
anchor_type: AnchorType,
) -> Result<(), String> {
is_identity_owner(&identity_id)?;

    // Verify the cross-chain transaction
    let verification_result = verify_cross_chain_transaction(
        &chain_name,
        &transaction_hash,
        block_number,
    ).await?;

    if verification_result {
        let anchor = CrossChainAnchor {
            chain_name,
            chain_id,
            transaction_hash,
            block_number,
            anchor_type,
            timestamp: time(),
            verification_status: true,
        };

        IDENTITIES.with(|identities| {
            let mut identities_map = identities.borrow_mut();
            match identities_map.get(&identity_id) {
                Some(mut identity) => {
                    identity.cross_chain_anchors.push(anchor);
                    identity.updated_at = time();
                    identities_map.insert(identity_id, identity);
                    Ok(())
                }
                None => Err("Identity not found".to_string()),
            }
        })
    } else {
        Err("Cross-chain anchor verification failed".to_string())
    }

}

//=============================================================================
// ADMIN FUNCTIONS
//=============================================================================

#[update]
fn add_admin(
principal: Principal,
role: AdminRoleType,
permissions: Vec<Permission>,
) -> Result<(), String> {
has_permission(Permission::ManageAdmins)?;

    let admin_role = AdminRole {
        principal,
        role,
        permissions,
        created_at: time(),
        last_active: time(),
    };

    ADMIN_PRINCIPALS.with(|admins| {
        admins.borrow_mut().insert(principal.to_string(), admin_role);
    });

    Ok(())

}

#[update]
fn remove_admin(principal: Principal) -> Result<(), String> {
has_permission(Permission::ManageAdmins)?;

    // Prevent removing the last super admin
    let super_admin_count = ADMIN_PRINCIPALS.with(|admins| {
        admins.borrow().iter()
            .filter(|(_, role)| matches!(role.role, AdminRoleType::SuperAdmin))
            .count()
    });

    if super_admin_count <= 1 {
        return Err("Cannot remove the last super admin".to_string());
    }

    ADMIN_PRINCIPALS.with(|admins| {
        admins.borrow_mut().remove(&principal.to_string());
    });

    Ok(())

}

#[update]
fn revoke_credential(
identity_id: String,
credential_id: String,
reason: String,
) -> Result<(), String> {
// Either admin or identity owner can revoke
let caller_principal = caller();
let is_admin_call = is_admin().is_ok();
let is_owner_call = is_identity_owner(&identity_id).is_ok();

    if !is_admin_call && !is_owner_call {
        return Err("Unauthorized to revoke credential".to_string());
    }

    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        match identities_map.get(&identity_id) {
            Some(mut identity) => {
                // Find and revoke the credential
                for credential in &mut identity.credentials {
                    if credential.id == credential_id {
                        credential.status = CredentialStatus::Revoked;
                        identity.updated_at = time();
                        identities_map.insert(identity_id, identity);
                        return Ok(());
                    }
                }
                Err("Credential not found".to_string())
            }
            None => Err("Identity not found".to_string()),
        }
    })

}

//=============================================================================
// UTILITY FUNCTIONS
//=============================================================================

fn generate_did(identity_id: &str, owner: &Principal) -> String {
let mut hasher = Sha256::new();
hasher.update(identity_id.as_bytes());
hasher.update(owner.as_slice());
hasher.update(id().as_slice());
hasher.update(&time().to_be_bytes());
let hash = hasher.finalize();
format!("did:icp:{:x}", hash)
}

fn create_did_document(did: &str, controller: &Principal) -> DIDDocument {
DIDDocument {
did: did.to_string(),
context: vec![
            "https://www.w3.org/ns/did/v1".to_string(),
            "https://w3id.org/security/v1".to_string(),
        ],
verification_methods: vec![
            VerificationMethod {
                id: format!("{}#controller", did),
                method_type: "Ed25519VerificationKey2020".to_string(),
                controller: controller.to_string(),
                public_key: "".to_string(), // Would be populated with actual key
            }
        ],
authentication: vec![format!("{}#controller", did)],
assertion_method: vec![format!("{}#controller", did)],
key_agreement: vec![],
capability_invocation: vec![format!("{}#controller", did)],
capability_delegation: vec![],
service_endpoints: vec![],
created: time(),
updated: time(),
}
}

fn validate_credential(credential: &VerifiableCredential) -> Result<bool, String> {
// Basic validation checks
if credential.id.is_empty() {
return Err("Credential ID cannot be empty".to_string());
}

    if credential.issuance_date > time() {
        return Err("Issuance date cannot be in the future".to_string());
    }

    if let Some(expiry) = credential.expiration_date {
        if expiry <= time() {
            return Err("Credential has expired".to_string());
        }
    }

    // TODO: Add cryptographic proof verification

    Ok(true)

}

fn filter_identity_for_public_view(identity: Identity) -> Identity {
let mut public_identity = identity.clone();

    // Filter credentials based on privacy settings
    public_identity.credentials = identity.credentials
        .into_iter()
        .filter(|cred| identity.privacy_settings.public_credentials.contains(&cred.id))
        .map(|mut cred| {
            // Remove sensitive information from public credentials
            match &mut cred.credential_type {
                CredentialType::Government(ref mut gov_cred) => {
                    gov_cred.document_number = "***REDACTED***".to_string();
                    gov_cred.biometric_hash = None;
                }
                CredentialType::Financial(ref mut fin_cred) => {
                    fin_cred.credit_score_range = None;
                }
                _ => {}
            }
            cred
        })
        .collect();

    // Clear sensitive cross-chain anchors
    public_identity.cross_chain_anchors = identity.cross_chain_anchors
        .into_iter()
        .filter(|anchor| {
            identity.privacy_settings.cross_chain_visibility.contains(&anchor.chain_name)
        })
        .collect();

    public_identity

}

//=============================================================================
// INTER-CANISTER CALLS
//=============================================================================

async fn trigger_ai_validation(identity_id: String) {
let ai_canister_id = Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai") // Replace with actual AI canister ID
.expect("Invalid AI canister ID");

    match ic_cdk::call::<(String,), (Result<f64, String>,)>(
        ai_canister_id,
        "validate_identity",
        (identity_id.clone(),),
    ).await {
        Ok((Ok(score),)) => {
            update_verification_status_from_ai(identity_id, score).await;
        }
        Ok((Err(e),)) => {
            ic_cdk::println!("AI validation error: {}", e);
            mark_for_manual_review(identity_id).await;
        }
        Err((_, msg)) => {
            ic_cdk::println!("AI canister call failed: {}", msg);
            mark_for_manual_review(identity_id).await;
        }
    }

}

async fn verify_cross_chain_transaction(
chain: &str,
transaction_hash: &str,
block_number: u64,
) -> Result<bool, String> {
let crosschain_canister_id = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai") // Replace with actual canister ID
.expect("Invalid cross-chain canister ID");

    match ic_cdk::call::<(String, String, u64), (Result<bool, String>,)>(
        crosschain_canister_id,
        "verify_transaction",
        (chain.to_string(), transaction_hash.to_string(), block_number),
    ).await {
        Ok((Ok(verified),)) => Ok(verified),
        Ok((Err(e),)) => Err(e),
        Err((_, msg)) => Err(format!("Cross-chain verification failed: {}", msg)),
    }

}

async fn update_verification_status_from_ai(identity_id: String, ai_score: f64) {
IDENTITIES.with(|identities| {
let mut identities_map = identities.borrow_mut();
if let Some(mut identity) = identities_map.get(&identity_id) {
// Update verification status based on AI score
identity.verification_status = if ai_score >= 0.9 {
VerificationStatus::Verified
} else if ai_score >= 0.7 {
VerificationStatus::UnderReview
} else if ai_score >= 0.5 {
VerificationStatus::RequiresAdditionalInfo
} else {
VerificationStatus::Rejected("AI validation failed".to_string())
};

            // Update reputation score
            identity.reputation_score = ai_score;
            identity.updated_at = time();

            identities_map.insert(identity_id, identity);
        }
    });

}

async fn mark_for_manual_review(identity_id: String) {
IDENTITIES.with(|identities| {
let mut identities_map = identities.borrow_mut();
if let Some(mut identity) = identities_map.get(&identity_id) {
identity.verification_status = VerificationStatus::RequiresAdditionalInfo;
identity.updated_at = time();
identities_map.insert(identity_id, identity);
}
});
}

//=============================================================================
// CANISTER UPGRADE HOOKS
//=============================================================================

#[pre_upgrade]
fn pre_upgrade() {
ic_cdk::println!("Preparing identity management canister for upgrade...");
// Stable memory is automatically preserved with stable structures
}

#[post_upgrade]
fn post_upgrade() {
ic_cdk::println!("Identity management canister upgrade completed successfully");
// Stable structures are automatically restored
}

//=============================================================================
// QUERY FUNCTIONS FOR STATISTICS AND MONITORING
//=============================================================================

#[query]
fn get_identity_count() -> u64 {
IDENTITIES.with(|identities| identities.borrow().len())
}

#[query]
fn get_verification_requests_count() -> u64 {
VERIFICATION_REQUESTS.with(|requests| requests.borrow().len())
}

#[query]
fn get_canister_stats() -> Result<CanisterStats, String> {
is_admin()?;

    let identity_count = IDENTITIES.with(|identities| identities.borrow().len());
    let request_count = VERIFICATION_REQUESTS.with(|requests| requests.borrow().len());
    let admin_count = ADMIN_PRINCIPALS.with(|admins| admins.borrow().len());
    let did_count = DID_REGISTRY.with(|registry| registry.borrow().len());

    Ok(CanisterStats {
        total_identities: identity_count,
        total_verification_requests: request_count,
        total_admins: admin_count,
        total_did_documents: did_count,
        uptime_seconds: time() / 1_000_000_000, // Convert nanoseconds to seconds
    })

}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CanisterStats {
pub total_identities: u64,
pub total_verification_requests: u64,
pub total_admins: u64,
pub total_did_documents: u64,
pub uptime_seconds: u64,
}
