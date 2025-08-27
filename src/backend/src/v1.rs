//! GlobalTrust Production Identity Management Canister
//! 
//! A comprehensive identity management system leveraging:
//! - ICP Internet Identity integration
//! - vetKeys for privacy-preserving operations
//! - Chain Fusion for cross-chain identity anchoring
//! - AI-powered fraud detection
//! - Real-world asset tokenization support

use std::collections::HashMap;
use std::cell::RefCell;
use std::borrow::Cow;
use std::vec::Vec;
use ic_cdk::api;

use candid::{CandidType, Decode, Encode, Principal};
use serde::{Deserialize, Serialize};
use ic_cdk::api::{caller, id, time, management_canister::main::raw_rand};
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update, heartbeat, export_candid};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, StableCell, Storable,
};

use sha2::{Digest, Sha256};
use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signature, Signer, Verifier};
use k256::{ecdsa::{SigningKey, VerifyingKey}, elliptic_curve::rand_core::OsRng};
use getrandom;

// Memory management types
type Memory = VirtualMemory<DefaultMemoryImpl>;
type IdCell = StableCell<u64, Memory>;

//=============================================================================
// GLOBAL STATE MANAGEMENT
//=============================================================================

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
    
    // DID document registry
    static DID_REGISTRY: RefCell<StableBTreeMap<String, DIDDocument, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
    
    // Cross-chain anchors for identity verification
    static CROSS_CHAIN_ANCHORS: RefCell<StableBTreeMap<String, Vec<CrossChainAnchor>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
        )
    );
    
    // Verification requests queue
    static VERIFICATION_REQUESTS: RefCell<StableBTreeMap<String, VerificationRequest, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))),
        )
    );
    
    // Access control and permissions
    static ACCESS_CONTROL: RefCell<StableBTreeMap<String, AccessControlRole, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))),
        )
    );
    
    // Privacy vault for vetKeys integration
    static PRIVACY_VAULT: RefCell<StableBTreeMap<String, PrivacyVaultEntry, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6))),
        )
    );
    
    // Canister configuration and settings
    static CANISTER_CONFIG: RefCell<StableCell<CanisterConfig, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(7))),
            CanisterConfig::default()
        ).expect("Failed to init canister config")
    );
    
    // Audit trail for compliance
    static AUDIT_TRAIL: RefCell<StableBTreeMap<String, AuditEntry, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(8))),
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
    pub internet_identity_anchor: Option<u64>,
    pub credentials: Vec<VerifiableCredential>,
    pub verification_status: VerificationStatus,
    pub reputation_score: f64,
    pub privacy_settings: PrivacySettings,
    pub cross_chain_anchors: Vec<String>, // References to cross-chain anchor IDs
    pub created_at: u64,
    pub updated_at: u64,
    pub last_activity: u64,
    pub metadata: IdentityMetadata,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct IdentityMetadata {
    pub version: String,
    pub schema_version: u32,
    pub recovery_mechanisms: Vec<RecoveryMechanism>,
    pub compliance_status: ComplianceStatus,
    pub risk_assessment: RiskAssessment,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RecoveryMechanism {
    InternetIdentity,
    SocialRecovery(Vec<Principal>),
    HardwareKey(String),
    BackupPhrase(String), // Encrypted
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ComplianceStatus {
    pub kyc_level: KYCLevel,
    pub aml_status: AMLStatus,
    pub sanctions_check: SanctionsStatus,
    pub last_compliance_update: u64,
    pub compliance_jurisdiction: String,
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
    pub overall_risk_score: f64, // 0.0 (low) to 1.0 (high)
    pub fraud_risk: f64,
    pub compliance_risk: f64,
    pub operational_risk: f64,
    pub last_assessment: u64,
    pub assessment_factors: Vec<RiskFactor>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RiskFactor {
    pub factor_type: String,
    pub weight: f64,
    pub score: f64,
    pub description: String,
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
    pub privacy_level: PrivacyLevel,
    pub metadata_hash: String, // IPFS hash for additional metadata
    pub revocation_registry: Option<String>,
    pub ai_validation_score: Option<f64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CredentialIssuer {
    pub id: Principal,
    pub name: String,
    pub did: Option<String>,
    pub reputation_score: f64,
    pub verification_method: String,
    pub trust_framework: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialType {
    Government(GovernmentCredential),
    Academic(AcademicCredential),
    Professional(ProfessionalCredential),
    Financial(FinancialCredential),
    Medical(MedicalCredential),
    Property(PropertyCredential),
    Biometric(BiometricCredential),
    Digital(DigitalCredential),
    Custom(CustomCredential),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GovernmentCredential {
    pub document_type: GovernmentDocumentType,
    pub issuing_country: String,
    pub issuing_authority: String,
    pub document_number: String,
    pub personal_details: PersonalDetails,
    pub validity_period: ValidityPeriod,
    pub biometric_reference: Option<String>,
    pub security_features: Vec<SecurityFeature>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum GovernmentDocumentType {
    Passport,
    NationalId,
    DriversLicense,
    VoterRegistration,
    TaxId,
    SocialSecurity,
    ResidencePermit,
    WorkVisa,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PersonalDetails {
    pub full_name: String,
    pub date_of_birth: u64,
    pub place_of_birth: String,
    pub nationality: String,
    pub gender: Option<String>,
    pub address: Option<Address>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Address {
    pub street: String,
    pub city: String,
    pub state_province: String,
    pub postal_code: String,
    pub country: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ValidityPeriod {
    pub issued_date: u64,
    pub expiry_date: Option<u64>,
    pub renewal_date: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SecurityFeature {
    pub feature_type: String,
    pub description: String,
    pub verification_method: String,
    pub integrity_hash: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AcademicCredential {
    pub institution: InstitutionInfo,
    pub degree_type: DegreeType,
    pub field_of_study: String,
    pub graduation_date: u64,
    pub gpa: Option<f64>,
    pub honors: Vec<String>,
    pub thesis_title: Option<String>,
    pub verification_code: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InstitutionInfo {
    pub name: String,
    pub did: Option<String>,
    pub accreditation: Vec<AccreditationInfo>,
    pub location: Address,
    pub established: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AccreditationInfo {
    pub accrediting_body: String,
    pub accreditation_type: String,
    pub valid_until: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum DegreeType {
    Certificate,
    Diploma,
    Associate,
    Bachelor,
    Master,
    Doctorate,
    Professional,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProfessionalCredential {
    pub organization: InstitutionInfo,
    pub position: String,
    pub employment_period: EmploymentPeriod,
    pub skills: Vec<SkillEndorsement>,
    pub certifications: Vec<ProfessionalCertification>,
    pub performance_metrics: Option<PerformanceMetrics>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EmploymentPeriod {
    pub start_date: u64,
    pub end_date: Option<u64>,
    pub employment_type: EmploymentType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum EmploymentType {
    FullTime,
    PartTime,
    Contract,
    Freelance,
    Internship,
    Volunteer,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SkillEndorsement {
    pub skill: String,
    pub proficiency_level: ProficiencyLevel,
    pub years_experience: u32,
    pub endorsers: Vec<Principal>,
    pub verification_method: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProficiencyLevel {
    Beginner,
    Intermediate,
    Advanced,
    Expert,
    Master,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProfessionalCertification {
    pub name: String,
    pub issuing_body: String,
    pub certification_id: String,
    pub issue_date: u64,
    pub expiry_date: Option<u64>,
    pub verification_url: Option<String>,
    pub continuing_education_required: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PerformanceMetrics {
    pub overall_rating: f64,
    pub categories: Vec<PerformanceCategory>,
    pub achievements: Vec<String>,
    pub feedback_summary: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PerformanceCategory {
    pub category: String,
    pub score: f64,
    pub description: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FinancialCredential {
    pub credential_subtype: FinancialCredentialType,
    pub issuing_institution: InstitutionInfo,
    pub account_details: Option<AccountDetails>,
    pub credit_information: Option<CreditInformation>,
    pub compliance_status: ComplianceStatus,
    pub risk_profile: RiskProfile,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum FinancialCredentialType {
    BankAccount,
    CreditReport,
    IncomeVerification,
    AssetVerification,
    InsurancePolicy,
    InvestmentAccount,
    PaymentHistory,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AccountDetails {
    pub account_type: String,
    pub account_status: String,
    pub opening_date: u64,
    pub currency: String,
    pub average_balance_range: BalanceRange,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum BalanceRange {
    Low,      // < $1K
    Medium,   // $1K - $10K  
    High,     // $10K - $100K
    VeryHigh, // > $100K
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreditInformation {
    pub credit_score: CreditScore,
    pub credit_history_length: u32, // months
    pub payment_history_score: f64,
    pub credit_utilization_ratio: f64,
    pub total_accounts: u32,
    pub recent_inquiries: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CreditScore {
    Poor(u16),      // 300-579
    Fair(u16),      // 580-669
    Good(u16),      // 670-739
    VeryGood(u16),  // 740-799
    Excellent(u16), // 800-850
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RiskProfile {
    pub risk_level: RiskLevel,
    pub risk_factors: Vec<RiskFactor>,
    pub mitigation_measures: Vec<String>,
    pub last_assessment: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RiskLevel {
    VeryLow,
    Low,
    Medium,
    High,
    VeryHigh,
    Critical,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MedicalCredential {
    pub credential_subtype: MedicalCredentialType,
    pub healthcare_provider: InstitutionInfo,
    pub patient_id: String, // Encrypted
    pub medical_data: MedicalData,
    pub privacy_consents: Vec<PrivacyConsent>,
    pub emergency_access: Option<EmergencyAccess>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MedicalCredentialType {
    VaccinationRecord,
    MedicalHistory,
    Prescription,
    TestResult,
    InsuranceCard,
    EmergencyContact,
    AllergyRecord,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MedicalData {
    pub data_type: String,
    pub encrypted_content: String,
    pub content_hash: String,
    pub timestamp: u64,
    pub authorized_viewers: Vec<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PrivacyConsent {
    pub purpose: String,
    pub granted_to: Principal,
    pub expiry_date: Option<u64>,
    pub revocable: bool,
    pub data_categories: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EmergencyAccess {
    pub emergency_contacts: Vec<Principal>,
    pub medical_conditions: String, // Encrypted
    pub medications: String,        // Encrypted
    pub allergies: String,          // Encrypted
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PropertyCredential {
    pub property_id: String,
    pub property_details: PropertyDetails,
    pub ownership_info: OwnershipInfo,
    pub valuation_data: PropertyValuation,
    pub legal_status: LegalStatus,
    pub tokenization_info: Option<TokenizationInfo>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PropertyDetails {
    pub property_type: PropertyType,
    pub address: Address,
    pub legal_description: String,
    pub lot_size: Option<f64>,
    pub building_area: Option<f64>,
    pub year_built: Option<u32>,
    pub zoning: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum PropertyType {
    Residential,
    Commercial,
    Industrial,
    Agricultural,
    Recreational,
    Mixed,
    Land,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct OwnershipInfo {
    pub ownership_type: OwnershipType,
    pub ownership_percentage: f64,
    pub acquisition_date: u64,
    pub acquisition_price: Option<u64>,
    pub title_number: String,
    pub encumbrances: Vec<Encumbrance>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum OwnershipType {
    FeeSimple,
    Leasehold,
    Cooperative,
    Condominium,
    Timeshare,
    Trust,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Encumbrance {
    pub encumbrance_type: String,
    pub description: String,
    pub amount: Option<u64>,
    pub beneficiary: Option<String>,
    pub expiry_date: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PropertyValuation {
    pub current_value: u64,
    pub currency: String,
    pub valuation_date: u64,
    pub valuation_method: ValuationMethod,
    pub appraiser_info: AppraiserInfo,
    pub market_indicators: Vec<MarketIndicator>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ValuationMethod {
    ComparativeMarketAnalysis,
    CostApproach,
    IncomeCapitalization,
    AutomatedValuation,
    Hybrid,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AppraiserInfo {
    pub name: String,
    pub license_number: String,
    pub certification: String,
    pub experience_years: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketIndicator {
    pub indicator_type: String,
    pub value: f64,
    pub trend: MarketTrend,
    pub source: String,
    pub date: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketTrend {
    Increasing,
    Stable,
    Decreasing,
    Volatile,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LegalStatus {
    pub title_status: TitleStatus,
    pub outstanding_issues: Vec<LegalIssue>,
    pub permits_approvals: Vec<Permit>,
    pub tax_status: TaxStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TitleStatus {
    Clear,
    Clouded,
    Disputed,
    InProbate,
    Foreclosure,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LegalIssue {
    pub issue_type: String,
    pub description: String,
    pub severity: IssueSeverity,
    pub resolution_timeline: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum IssueSeverity {
    Minor,
    Moderate,
    Major,
    Critical,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Permit {
    pub permit_type: String,
    pub permit_number: String,
    pub issue_date: u64,
    pub expiry_date: Option<u64>,
    pub status: PermitStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum PermitStatus {
    Active,
    Expired,
    Pending,
    Revoked,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TaxStatus {
    pub current_year_paid: bool,
    pub outstanding_amount: u64,
    pub assessment_value: u64,
    pub tax_rate: f64,
    pub exemptions: Vec<TaxExemption>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TaxExemption {
    pub exemption_type: String,
    pub amount: u64,
    pub expiry_date: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TokenizationInfo {
    pub token_contract_address: String,
    pub token_standard: TokenStandard,
    pub total_tokens: u64,
    pub tokens_owned: u64,
    pub token_metadata_uri: String,
    pub trading_restrictions: Vec<TradingRestriction>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TokenStandard {
    ERC721,
    ERC1155,
    ICPNFTStandard,
    Custom(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TradingRestriction {
    pub restriction_type: String,
    pub description: String,
    pub expiry_date: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BiometricCredential {
    pub biometric_type: BiometricType,
    pub template_hash: String,
    pub quality_metrics: QualityMetrics,
    pub capture_metadata: CaptureMetadata,
    pub liveness_verification: LivenessVerification,
    pub privacy_preserving_template: String, // Using vetKeys encryption
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum BiometricType {
    Fingerprint,
    FacialRecognition,
    IrisRecognition,
    VoicePrint,
    PalmPrint,
    Signature,
    Keystroke,
    Gait,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct QualityMetrics {
    pub overall_quality: f64,
    pub sharpness: f64,
    pub contrast: f64,
    pub illumination: f64,
    pub uniqueness: f64,
    pub completeness: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CaptureMetadata {
    pub capture_device: String,
    pub capture_timestamp: u64,
    pub capture_location: Option<String>,
    pub capture_conditions: CaptureConditions,
    pub operator_id: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CaptureConditions {
    pub lighting_conditions: String,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub ambient_noise: Option<f64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LivenessVerification {
    pub liveness_score: f64,
    pub verification_method: String,
    pub anti_spoofing_measures: Vec<AntiSpoofingMeasure>,
    pub verification_timestamp: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AntiSpoofingMeasure {
    pub measure_type: String,
    pub confidence: f64,
    pub description: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DigitalCredential {
    pub platform: String,
    pub account_id: String,
    pub verification_method: String,
    pub account_status: AccountStatus,
    pub creation_date: u64,
    pub activity_metrics: ActivityMetrics,
    pub reputation_data: ReputationData,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AccountStatus {
    Active,
    Suspended,
    Deactivated,
    Verified,
    Unverified,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ActivityMetrics {
    pub last_activity: u64,
    pub activity_frequency: f64,
    pub engagement_score: f64,
    pub network_size: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ReputationData {
    pub reputation_score: f64,
    pub trust_indicators: Vec<TrustIndicator>,
    pub feedback_summary: FeedbackSummary,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TrustIndicator {
    pub indicator_type: String,
    pub score: f64,
    pub weight: f64,
    pub source: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FeedbackSummary {
    pub positive_feedback: u64,
    pub negative_feedback: u64,
    pub average_rating: f64,
    pub feedback_count: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CustomCredential {
    pub credential_name: String,
    pub schema_uri: String,
    pub claims: Vec<CustomClaim>,
    pub validation_rules: Vec<ValidationRule>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CustomClaim {
    pub claim_type: String,
    pub claim_value: String,
    pub claim_proof: Option<String>,
    pub confidence: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ValidationRule {
    pub rule_type: String,
    pub rule_expression: String,
    pub error_message: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialClaims {
    Public(Vec<PublicClaim>),
    Private(String), // Encrypted using vetKeys
    Selective(Vec<SelectiveClaim>), // Zero-knowledge proofs
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
    pub proof_reference: String, // Reference to ZK proof
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
    pub signature_algorithm: String,
    pub created: u64,
    pub verification_method: String,
    pub proof_purpose: String,
    pub challenge: Option<String>,
    pub domain: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProofType {
    Ed25519Signature,
    EcdsaSecp256k1Signature,
    EcdsaSecp256r1Signature,
    RsaSignature,
    BbsBlsSignature,
    ZkSnarkProof,
    ZkStarkProof,
    BulletProof,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationStatus {
    Pending,
    InProgress,
    Verified,
    PartiallyVerified,
    Rejected(RejectionReason),
    RequiresAdditionalInfo,
    Suspended,
    Expired,
    UnderReview,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RejectionReason {
    pub reason_code: String,
    pub description: String,
    pub suggested_actions: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CredentialStatus {
    Active,
    Inactive,
    Suspended,
    Revoked(RevocationInfo),
    Expired,
    PendingRenewal,
    UnderReview,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RevocationInfo {
    pub revocation_date: u64,
    pub revocation_reason: String,
    pub revoked_by: Principal,
    pub appeal_deadline: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum PrivacyLevel {
    Public,
    Restricted,
    Private,
    Confidential,
    TopSecret,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PrivacySettings {
    pub default_privacy_level: PrivacyLevel,
    pub selective_disclosure_enabled: bool,
    pub zero_knowledge_proofs_enabled: bool,
    pub public_credentials: Vec<String>,
    pub restricted_credentials: Vec<String>,
    pub cross_chain_visibility: Vec<CrossChainVisibility>,
    pub data_retention_policy: DataRetentionPolicy,
    pub consent_management: ConsentManagement,
    pub vetkeys_encryption_enabled: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CrossChainVisibility {
    pub chain_name: String,
    pub visible_credentials: Vec<String>,
    pub visibility_level: PrivacyLevel,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DataRetentionPolicy {
    pub default_retention_period: u64, // seconds
    pub credential_specific_policies: HashMap<String, u64>,
    pub auto_deletion_enabled: bool,
    pub backup_policy: BackupPolicy,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum BackupPolicy {
    NoBackup,
    EncryptedBackup,
    DistributedBackup,
    CrossChainBackup,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ConsentManagement {
    pub require_explicit_consent: bool,
    pub consent_expiry_period: Option<u64>,
    pub granular_consent_enabled: bool,
    pub consent_withdrawal_enabled: bool,
    pub consent_audit_trail: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CrossChainAnchor {
    pub id: String,
    pub identity_id: String,
    pub chain_type: ChainType,
    pub chain_id: u64,
    pub transaction_hash: String,
    pub block_number: u64,
    pub anchor_type: AnchorType,
    pub anchor_data: AnchorData,
    pub verification_status: AnchorVerificationStatus,
    pub created_at: u64,
    pub last_verified: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ChainType {
    Bitcoin,
    Ethereum,
    Solana,
    Polygon,
    Avalanche,
    BSC,
    ICP,
    Custom(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AnchorType {
    IdentityRegistration,
    CredentialVerification,
    PropertyOwnership,
    BiometricHash,
    RevocationRegistry,
    ComplianceRecord,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AnchorData {
    pub data_hash: String,
    pub merkle_proof: Option<String>,
    pub witness_signatures: Vec<String>,
    pub metadata: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AnchorVerificationStatus {
    Pending,
    Verified,
    Failed(String),
    Expired,
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
    pub jurisdiction: String,
    pub data_retention_period: Option<u64>,
    pub privacy_requirements: PrivacyRequirements,
    pub created_at: u64,
    pub expires_at: u64,
    pub status: RequestStatus,
    pub response: Option<VerificationResponse>,
    pub compliance_check: ComplianceCheck,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationType {
    BasicIdentity,
    EnhancedIdentity,
    FullCredentials,
    SelectiveDisclosure(Vec<String>),
    ZeroKnowledgeProof(ZKProofRequest),
    CrossChainVerification(String),
    BiometricMatch,
    AgeVerification { min_age: u32 },
    CitizenshipVerification { country: String },
    ComplianceVerification { framework: String },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ZKProofRequest {
    pub proof_type: String,
    pub circuit_id: String,
    pub public_inputs: Vec<String>,
    pub verification_key: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PrivacyRequirements {
    pub minimum_privacy_level: PrivacyLevel,
    pub data_minimization: bool,
    pub purpose_limitation: bool,
    pub consent_required: bool,
    pub right_to_deletion: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RequestStatus {
    Pending,
    UnderReview,
    Approved,
    PartiallyApproved,
    Denied(DenialReason),
    Expired,
    Revoked,
    ComplianceHold,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DenialReason {
    pub reason_code: String,
    pub description: String,
    pub appeal_process: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationResponse {
    pub verified: bool,
    pub verification_level: VerificationLevel,
    pub credentials_disclosed: Vec<CredentialDisclosure>,
    pub proofs: Vec<ProofData>,
    pub limitations: Vec<String>,
    pub expires_at: u64,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum VerificationLevel {
    Basic,
    Standard,
    Enhanced,
    Premium,
    Regulatory,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CredentialDisclosure {
    pub credential_id: String,
    pub disclosed_fields: Vec<String>,
    pub redacted_fields: Vec<String>,
    pub disclosure_method: DisclosureMethod,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum DisclosureMethod {
    Direct,
    Hashed,
    ZeroKnowledge,
    Selective,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProofData {
    pub proof_type: String,
    pub proof: String,
    pub verification_method: String,
    pub validity_period: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ComplianceCheck {
    pub frameworks: Vec<String>,
    pub jurisdiction: String,
    pub compliance_status: ComplianceCheckStatus,
    pub required_actions: Vec<String>,
    pub last_updated: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ComplianceCheckStatus {
    Compliant,
    NonCompliant(Vec<String>),
    PartiallyCompliant(Vec<String>),
    UnderReview,
    NotApplicable,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AccessControlRole {
    pub principal: Principal,
    pub role_type: RoleType,
    pub permissions: Vec<Permission>,
    pub granted_by: Principal,
    pub created_at: u64,
    pub expires_at: Option<u64>,
    pub last_active: u64,
    pub access_conditions: Vec<AccessCondition>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RoleType {
    SuperAdmin,
    SystemAdmin,
    IdentityAdmin,
    ComplianceOfficer,
    AuditorReadOnly,
    APIUser,
    ServiceAccount,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug,PartialEq, Eq, Hash)]
pub enum Permission {
    CreateIdentity,
    UpdateIdentity,
    DeleteIdentity,
    ViewIdentity,
    ManageCredentials,
    ManageVerifications,
    ManageAccessControl,
    ViewAuditTrail,
    ManageSystem,
    EmergencyActions,
    CrossChainOperations,
    PrivacyOperations,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AccessCondition {
    pub condition_type: String,
    pub condition_value: String,
    pub operator: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PrivacyVaultEntry {
    pub id: String,
    pub identity_id: String,
    pub encrypted_data: String,
    pub encryption_method: String,
    pub vetkey_id: String,
    pub access_policy: VaultAccessPolicy,
    pub created_at: u64,
    pub expires_at: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VaultAccessPolicy {
    pub authorized_principals: Vec<Principal>,
    pub access_conditions: Vec<AccessCondition>,
    pub purpose_limitation: Vec<String>,
    pub audit_required: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CanisterConfig {
    pub version: String,
    pub ai_canister_id: Option<Principal>,
    pub crosschain_canister_id: Option<Principal>,
    pub asset_canister_id: Option<Principal>,
    pub privacy_canister_id: Option<Principal>,
    pub max_identities: u64,
    pub verification_timeout: u64,
    pub compliance_frameworks: Vec<String>,
    pub supported_chains: Vec<ChainType>,
    pub feature_flags: FeatureFlags,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FeatureFlags {
    pub ai_validation_enabled: bool,
    pub cross_chain_enabled: bool,
    pub vetkeys_enabled: bool,
    pub zero_knowledge_proofs: bool,
    pub biometric_verification: bool,
    pub real_time_monitoring: bool,
}

impl Default for CanisterConfig {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            ai_canister_id: None,
            crosschain_canister_id: None,
            asset_canister_id: None,
            privacy_canister_id: None,
            max_identities: 1_000_000,
            verification_timeout: 24 * 60 * 60 * 1_000_000_000, // 24 hours in nanoseconds
            compliance_frameworks: vec![
                "GDPR".to_string(),
                "CCPA".to_string(),
                "KYC".to_string(),
                "AML".to_string(),
            ],
            supported_chains: vec![
                ChainType::Bitcoin,
                ChainType::Ethereum,
                ChainType::Solana,
                ChainType::ICP,
            ],
            feature_flags: FeatureFlags {
                ai_validation_enabled: true,
                cross_chain_enabled: true,
                vetkeys_enabled: true,
                zero_knowledge_proofs: true,
                biometric_verification: true,
                real_time_monitoring: true,
            },
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: u64,
    pub principal: Principal,
    pub action: AuditAction,
    pub resource_id: String,
    pub resource_type: String,
    pub details: String,
    pub result: ActionResult,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AuditAction {
    Create,
    Read,
    Update,
    Delete,
    Verify,
    Revoke,
    Grant,
    Deny,
    Login,
    Logout,
    Export,
    Import,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ActionResult {
    Success,
    Failure(String),
    Partial(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DIDDocument {
    pub did: String,
    pub version: u32,
    pub created: u64,
    pub updated: u64,
    pub deactivated: bool,
    pub context: Vec<String>,
    pub controller: Vec<String>,
    pub verification_methods: Vec<VerificationMethod>,
    pub authentication: Vec<String>,
    pub assertion_method: Vec<String>,
    pub key_agreement: Vec<String>,
    pub capability_invocation: Vec<String>,
    pub capability_delegation: Vec<String>,
    pub service_endpoints: Vec<ServiceEndpoint>,
    pub also_known_as: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationMethod {
    pub id: String,
    pub vm_type: String,
    pub controller: String,
    pub public_key_multibase: Option<String>,
    pub public_key_jwk: Option<String>,
    pub blockchain_account_id: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ServiceEndpoint {
    pub id: String,
    pub service_type: String,
    pub service_endpoint: ServiceEndpointValue,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ServiceEndpointValue {
    String(String),
    Map(HashMap<String, String>),
    Set(Vec<String>),
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

impl Storable for DIDDocument {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl Storable for Vec<CrossChainAnchor> {
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

impl Storable for AccessControlRole {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl Storable for PrivacyVaultEntry {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl Storable for CanisterConfig {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl Storable for AuditEntry {
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

/// Verifies if the caller has admin privileges
/// 
fn verify_admin() -> Result<(), String> {
    let caller_principal = api::caller();;
    ACCESS_CONTROL.with(|access| {
        match access.borrow().get(&caller_principal.to_string()) {
            Some(role) => {
                if matches!(role.role_type, RoleType::SuperAdmin | RoleType::SystemAdmin) {
                    // Update last active timestamp
                    let mut updated_role = role.clone();
                    updated_role.last_active = time();
                    access.borrow_mut().insert(caller_principal.to_string(), updated_role);
                    Ok(())
                } else {
                    Err("Insufficient admin privileges".to_string())
                }
            }
            None => Err("Access denied: Not authorized".to_string()),
        }
    })
}

/// Verifies if the caller owns the specified identity
fn verify_identity_owner(identity_id: &str) -> Result<(), String> {
    let caller_principal = api::caller();;
    IDENTITIES.with(|identities| {
        match identities.borrow().get(identity_id) {
            Some(identity) => {
                if identity.owner == caller_principal {
                    Ok(())
                } else {
                    Err("Access denied: Not identity owner".to_string())
                }
            }
            None => Err("Identity not found".to_string()),
        }
    })
}

/// Verifies if the caller has specific permission
fn verify_permission(permission: Permission) -> Result<(), String> {
    let caller_principal = api::caller();;
    ACCESS_CONTROL.with(|access| {
        match access.borrow().get(&caller_principal.to_string()) {
            Some(role) => {
                if role.permissions.contains(&permission) {
                    // Check if role has expired
                    if let Some(expiry) = role.expires_at {
                        if time() > expiry {
                            return Err("Access role has expired".to_string());
                        }
                    }
                    
                    // Update last active timestamp
                    let mut updated_role = role.clone();
                    updated_role.last_active = time();
                    access.borrow_mut().insert(caller_principal.to_string(), updated_role);
                    Ok(())
                } else {
                    Err("Insufficient permissions".to_string())
                }
            }
            None => Err("Access denied: No role assigned".to_string()),
        }
    })
}

/// Creates audit trail entry
fn create_audit_entry(
    action: AuditAction,
    resource_id: String,
    resource_type: String,
    details: String,
    result: ActionResult,
) {
    let audit_id = generate_unique_id("audit");
    let audit_entry = AuditEntry {
        id: audit_id.clone(),
        timestamp: time(),
        principal: api::caller(),
        action,
        resource_id,
        resource_type,
        details,
        result,
        ip_address: None, // Would need to extract from request context
        user_agent: None, // Would need to extract from request context
    };
    
    AUDIT_TRAIL.with(|trail| {
        trail.borrow_mut().insert(audit_id, audit_entry);
    });
}

//=============================================================================
// CANISTER INITIALIZATION
//=============================================================================

#[init]
fn init() {
    let deployer = api::caller();;
    
    // Create super admin role for deployer
    let admin_role = AccessControlRole {
        principal: deployer,
        role_type: RoleType::SuperAdmin,
        permissions: vec![
            Permission::CreateIdentity,
            Permission::UpdateIdentity,
            Permission::DeleteIdentity,
            Permission::ViewIdentity,
            Permission::ManageCredentials,
            Permission::ManageVerifications,
            Permission::ManageAccessControl,
            Permission::ViewAuditTrail,
            Permission::ManageSystem,
            Permission::EmergencyActions,
            Permission::CrossChainOperations,
            Permission::PrivacyOperations,
        ],
        granted_by: deployer,
        created_at: time(),
        expires_at: None, // Super admin never expires
        last_active: time(),
        access_conditions: vec![],
    };
    
    ACCESS_CONTROL.with(|access| {
        access.borrow_mut().insert(deployer.to_string(), admin_role);
    });
    
    // Log initialization
    create_audit_entry(
        AuditAction::Create,
        "canister".to_string(),
        "system".to_string(),
        "Identity canister initialized".to_string(),
        ActionResult::Success,
    );
    
    ic_cdk::println!("GlobalTrust Identity Management Canister initialized successfully");
}

//=============================================================================
// CORE IDENTITY MANAGEMENT FUNCTIONS
//=============================================================================

#[update]
async fn create_identity(
    internet_identity_anchor: Option<u64>,
    initial_credentials: Vec<VerifiableCredential>,
    privacy_settings: PrivacySettings,
) -> Result<String, String> {
    verify_permission(Permission::CreateIdentity)?;
    
    let caller_principal = api::caller();;
    let current_time = time();
    
    // Check canister limits
    let config = CANISTER_CONFIG.with(|config| config.borrow().get().clone());
    let current_identity_count = IDENTITIES.with(|identities| identities.borrow().len());
    
    if current_identity_count >= config.max_identities {
        return Err("Maximum identity limit reached".to_string());
    }
    
    // Generate unique identity ID
    let identity_id = IDENTITY_COUNTER.with(|counter| {
        let current_count = counter.borrow().get();
        let new_count = current_count + 1;
        counter.borrow_mut().set(new_count).expect("Failed to update counter");
        format!("gt_id_{:016x}_{:08x}", current_time, new_count)
    });
    
    // Generate DID
    let did = generate_did(&identity_id, &caller_principal);
    
    // Create DID document
    let did_document = create_did_document(&did, &caller_principal);
    
    // Validate initial credentials
    for credential in &initial_credentials {
        validate_credential(credential)?;
    }
    
    // Create identity metadata
    let metadata = IdentityMetadata {
        version: config.version.clone(),
        schema_version: 1,
        recovery_mechanisms: match internet_identity_anchor {
            Some(_) => vec![RecoveryMechanism::InternetIdentity],
            None => vec![],
        },
        compliance_status: ComplianceStatus {
            kyc_level: KYCLevel::None,
            aml_status: AMLStatus::NotScreened,
            sanctions_check: SanctionsStatus::NotChecked,
            last_compliance_update: current_time,
            compliance_jurisdiction: "global".to_string(),
        },
        risk_assessment: RiskAssessment {
            overall_risk_score: 0.5, // Neutral starting score
            fraud_risk: 0.5,
            compliance_risk: 0.5,
            operational_risk: 0.5,
            last_assessment: current_time,
            assessment_factors: vec![],
        },
    };
    
    // Create identity
    let identity = Identity {
        id: identity_id.clone(),
        owner: caller_principal,
        did: did.clone(),
        internet_identity_anchor,
        credentials: initial_credentials,
        verification_status: VerificationStatus::Pending,
        reputation_score: 0.0,
        privacy_settings,
        cross_chain_anchors: Vec::new(),
        created_at: current_time,
        updated_at: current_time,
        last_activity: current_time,
        metadata,
    };
    
    // Store identity and DID document
    IDENTITIES.with(|identities| {
        identities.borrow_mut().insert(identity_id.clone(), identity);
    });
    
    DID_REGISTRY.with(|registry| {
        registry.borrow_mut().insert(did.clone(), did_document);
    });
    
    // Trigger AI validation if enabled
    if config.feature_flags.ai_validation_enabled {
        if let Some(ai_canister) = config.ai_canister_id {
            ic_cdk::spawn(trigger_ai_validation(identity_id.clone(), ai_canister));
        }
    }
    
    // Create audit entry
    create_audit_entry(
        AuditAction::Create,
        identity_id.clone(),
        "identity".to_string(),
        format!("Identity created with {} credentials", initial_credentials.len()),
        ActionResult::Success,
    );
    
    Ok(identity_id)
}

#[query]
fn get_identity(identity_id: String) -> Result<Identity, String> {
    let caller_principal = api::caller();;
    
    IDENTITIES.with(|identities| {
        match identities.borrow().get(&identity_id) {
            Some(identity) => {
                if identity.owner == caller_principal {
                    // Owner gets full access
                    Ok(identity.clone())
                } else {
                    // Others get filtered view based on privacy settings
                    Ok(filter_identity_for_public_view(identity))
                }
            }
            None => Err("Identity not found".to_string()),
        }
    })
}

#[query]
fn get_canister_stats() -> Result<CanisterStats, String> {
    verify_permission(Permission::ViewAuditTrail)?;
    
    let identity_count = IDENTITIES.with(|identities| identities.borrow().len());
    let request_count = VERIFICATION_REQUESTS.with(|requests| requests.borrow().len());
    let did_count = DID_REGISTRY.with(|registry| registry.borrow().len());
    let anchor_count = CROSS_CHAIN_ANCHORS.with(|anchors| anchors.borrow().len());
    let vault_count = PRIVACY_VAULT.with(|vault| vault.borrow().len());
    let audit_count = AUDIT_TRAIL.with(|trail| trail.borrow().len());
    
    Ok(CanisterStats {
        total_identities: identity_count,
        total_did_documents: did_count,
        total_verification_requests: request_count,
        total_cross_chain_anchors: anchor_count,
        total_vault_entries: vault_count,
        total_audit_entries: audit_count,
        canister_version: CANISTER_CONFIG.with(|config| config.borrow().get().version.clone()),
        uptime_seconds: time() / 1_000_000_000,
    })
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CanisterStats {
    pub total_identities: u64,
    pub total_did_documents: u64,
    pub total_verification_requests: u64,
    pub total_cross_chain_anchors: u64,
    pub total_vault_entries: u64,
    pub total_audit_entries: u64,
    pub canister_version: String,
    pub uptime_seconds: u64,
}

//=============================================================================
// UTILITY FUNCTIONS
//=============================================================================

fn generate_unique_id(prefix: &str) -> String {
    let timestamp = time();
    let random_bytes = match raw_rand() {
        Ok((bytes,)) => bytes,
        Err(_) => vec![0u8; 4], // Fallback to timestamp-based ID
    };
    
    let random_suffix = hex::encode(&random_bytes[0..4]);
    format!("{}_{:016x}_{}", prefix, timestamp, random_suffix)
}

fn generate_did(identity_id: &str, owner: &Principal) -> String {
    let mut hasher = Sha256::new();
    hasher.update(identity_id.as_bytes());
    hasher.update(owner.as_slice());
    hasher.update(id().as_slice());
    hasher.update(&time().to_be_bytes());
    let hash = hasher.finalize();
    format!("did:icp:{}", hex::encode(&hash[..16]))
}

fn create_did_document(did: &str, controller: &Principal) -> DIDDocument {
    let current_time = time();
    
    DIDDocument {
        did: did.to_string(),
        version: 1,
        created: current_time,
        updated: current_time,
        deactivated: false,
        context: vec![
            "https://www.w3.org/ns/did/v1".to_string(),
            "https://w3id.org/security/suites/ed25519-2020/v1".to_string(),
        ],
        controller: vec![controller.to_string()],
        verification_methods: vec![
            VerificationMethod {
                id: format!("{}#controller", did),
                vm_type: "Ed25519VerificationKey2020".to_string(),
                controller: controller.to_string(),
                public_key_multibase: None, // Would be populated with actual key
                public_key_jwk: None,
                blockchain_account_id: None,
            }
        ],
        authentication: vec![format!("{}#controller", did)],
        assertion_method: vec![format!("{}#controller", did)],
        key_agreement: vec![],
        capability_invocation: vec![format!("{}#controller", did)],
        capability_delegation: vec![],
        service_endpoints: vec![],
        also_known_as: vec![],
    }
}

fn validate_credential(credential: &VerifiableCredential) -> Result<(), String> {
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
    
    Ok(())
}

fn filter_identity_for_public_view(identity: Identity) -> Identity {
    let mut public_identity = identity.clone();
    
    // Filter credentials based on privacy settings
    public_identity.credentials = identity.credentials
        .into_iter()
        .filter(|cred| {
            identity.privacy_settings.public_credentials.contains(&cred.id) ||
            matches!(cred.privacy_level, PrivacyLevel::Public)
        })
        .map(|mut cred| {
            // Redact sensitive information from public credentials
            match &mut cred.credential_type {
                CredentialType::Government(ref mut gov_cred) => {
                    gov_cred.document_number = "***REDACTED***".to_string();
                    gov_cred.personal_details.full_name = "***REDACTED***".to_string();
                    gov_cred.biometric_reference = None;
                }
                CredentialType::Financial(ref mut fin_cred) => {
                    if let Some(ref mut account) = fin_cred.account_details {
                        account.average_balance_range = BalanceRange::Low;
                    }
                }
                CredentialType::Medical(ref mut med_cred) => {
                    med_cred.patient_id = "***REDACTED***".to_string();
                    med_cred.medical_data.encrypted_content = "***REDACTED***".to_string();
                }
                _ => {}
            }
            cred
        })
        .collect();
    
    public_identity
}

//=============================================================================
// INTER-CANISTER COMMUNICATION
//=============================================================================

async fn trigger_ai_validation(identity_id: String, ai_canister_id: Principal) {
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
        }
        Err((_, msg)) => {
            ic_cdk::println!("AI canister call failed: {}", msg);
        }
    }
}

async fn update_verification_status_from_ai(identity_id: String, ai_score: f64) {
    IDENTITIES.with(|identities| {
        let mut identities_map = identities.borrow_mut();
        if let Some(mut identity) = identities_map.get(&identity_id) {
            identity.verification_status = if ai_score >= 0.9 {
                VerificationStatus::Verified
            } else if ai_score >= 0.7 {
                VerificationStatus::InProgress
            } else if ai_score >= 0.5 {
                VerificationStatus::RequiresAdditionalInfo
            } else {
                VerificationStatus::Rejected(RejectionReason {
                    reason_code: "AI_VALIDATION_FAILED".to_string(),
                    description: format!("AI validation score too low: {:.2}", ai_score),
                    suggested_actions: vec![
                        "Provide additional documentation".to_string(),
                        "Submit biometric verification".to_string(),
                    ],
                })
            };
            
            identity.reputation_score = ai_score;
            identity.updated_at = time();
            identity.last_activity = time();
            
            identities_map.insert(identity_id, identity);
        }
    });
}

//=============================================================================
// CANISTER UPGRADE HOOKS
//=============================================================================

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("Preparing GlobalTrust Identity Canister for upgrade...");
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("GlobalTrust Identity Canister upgrade completed successfully");
}

//=============================================================================
// GETRANDOM IMPLEMENTATION FOR WASM
//=============================================================================

fn custom_getrandom(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    match raw_rand() {
        Ok((random_bytes,)) => {
            for (i, byte) in buf.iter_mut().enumerate() {
                *byte = random_bytes.get(i % random_bytes.len()).copied().unwrap_or(0);
            }
            Ok(())
        }
        Err(_) => {
            let timestamp = time();
            for (i, byte) in buf.iter_mut().enumerate() {
                *byte = ((timestamp >> (i % 8)) & 0xff) as u8;
            }
            Ok(())
        }
    }
}

getrandom::register_custom_getrandom!(custom_getrandom);

export_candid!();
