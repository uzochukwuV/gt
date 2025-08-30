use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_cdk_macros::*;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, Storable,
};
use serde::Serialize;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type StoredLoans = StableBTreeMap<u64, Loan, Memory>;
type StoredOffers = StableBTreeMap<u64, LoanOffer, Memory>;

#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum AssetType {
    RealEstate,
    Vehicle,
    Artwork,
    Jewelry,
    Collectible,
    Other(String),
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum LoanStatus {
    Pending,
    Active,
    Repaid,
    Defaulted,
    Liquidated,
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum PaymentMethod {
    ICP,
    Bitcoin,
    Ethereum,
    USDC,
    USDT,
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct CollateralAsset {
    pub asset_id: String,
    pub asset_type: AssetType,
    pub verified_value_usd: f64,
    pub verification_score: f32,
    pub owner: Principal,
    pub metadata_uri: String,
}

impl Storable for CollateralAsset {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct Loan {
    pub id: u64,
    pub borrower: Principal,
    pub lender: Principal,
    pub collateral_asset: CollateralAsset,
    pub loan_amount_usd: f64,
    pub payment_method: PaymentMethod,
    pub interest_rate: f32, // Annual percentage
    pub duration_days: u32,
    pub status: LoanStatus,
    pub created_at: u64,
    pub funded_at: Option<u64>,
    pub due_date: Option<u64>,
    pub repaid_at: Option<u64>,
    pub loan_to_value_ratio: f32,   // LTV ratio
    pub liquidation_threshold: f32, // Liquidation trigger
}

impl Storable for Loan {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct LoanOffer {
    pub id: u64,
    pub lender: Principal,
    pub max_loan_amount_usd: f64,
    pub min_verification_score: f32,
    pub max_ltv_ratio: f32,
    pub interest_rate: f32,
    pub max_duration_days: u32,
    pub accepted_asset_types: Vec<AssetType>,
    pub payment_method: PaymentMethod,
    pub is_active: bool,
    pub created_at: u64,
}

impl Storable for LoanOffer {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct LoanRequest {
    pub asset_id: String,
    pub requested_amount_usd: f64,
    pub duration_days: u32,
    pub payment_method: PaymentMethod,
}

impl Storable for LoanRequest {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    static MEMORY_MANAGER: std::cell::RefCell<MemoryManager<DefaultMemoryImpl>> =
        std::cell::RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static LOANS: std::cell::RefCell<StoredLoans> = std::cell::RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static LOAN_OFFERS: std::cell::RefCell<StoredOffers> = std::cell::RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static NEXT_LOAN_ID: std::cell::RefCell<u64> = const { std::cell::RefCell::new(1) };
    static NEXT_OFFER_ID: std::cell::RefCell<u64> = const { std::cell::RefCell::new(1) };
    static EMERGENCY_PAUSE: std::cell::RefCell<bool> = const { std::cell::RefCell::new(false) };
}

// Security and validation functions
fn emergency_pause_check() -> Result<(), String> {
    if EMERGENCY_PAUSE.with(|p| *p.borrow()) {
        return Err("Contract is paused".to_string());
    }
    Ok(())
}

fn validate_loan_amount(amount: f64) -> Result<(), String> {
    if amount <= 0.0 {
        return Err("Loan amount must be positive".to_string());
    }
    if amount > 10_000_000.0 {
        return Err("Loan amount exceeds maximum limit".to_string());
    }
    if amount.is_nan() || amount.is_infinite() {
        return Err("Loan amount must be a valid number".to_string());
    }
    Ok(())
}

fn validate_interest_rate(rate: f32) -> Result<(), String> {
    if rate < 0.0 || rate > 100.0 {
        return Err("Interest rate must be between 0-100%".to_string());
    }
    Ok(())
}

fn validate_ltv_ratio(ltv: f32) -> Result<(), String> {
    if ltv <= 0.0 || ltv > 0.8 {
        return Err("LTV ratio must be between 0-80%".to_string());
    }
    Ok(())
}

fn calculate_dynamic_liquidation_threshold(asset_type: &AssetType, ltv_ratio: f32) -> f32 {
    let base_threshold = ltv_ratio * 1.2; // 20% base buffer
    
    // Adjust based on asset volatility
    let volatility_multiplier = match asset_type {
        AssetType::RealEstate => 1.1,  // Low volatility
        AssetType::Vehicle => 1.3,     // Medium volatility
        AssetType::Artwork => 1.5,     // High volatility
        AssetType::Jewelry => 1.4,     // High volatility
        AssetType::Collectible => 1.6, // Very high volatility
        AssetType::Other(_) => 1.3,    // Default medium
    };
    
    (base_threshold * volatility_multiplier).min(0.95) // Cap at 95%
}

#[update]
fn emergency_pause() -> Result<(), String> {
    // In a real implementation, this would require admin authentication
    EMERGENCY_PAUSE.with(|p| *p.borrow_mut() = true);
    Ok(())
}

#[update]
fn emergency_unpause() -> Result<(), String> {
    // In a real implementation, this would require admin authentication
    EMERGENCY_PAUSE.with(|p| *p.borrow_mut() = false);
    Ok(())
}

// Automated liquidation system
#[update]
fn check_liquidations() -> Vec<u64> {
    let mut loans_to_liquidate = Vec::new();
    
    LOANS.with(|loans| {
        for (loan_id, loan) in loans.borrow().iter() {
            if loan.status == LoanStatus::Active {
                // Get current asset value (mock implementation - would use price oracle)
                let current_value = get_asset_current_value(&loan.collateral_asset);
                let current_ltv = loan.loan_amount_usd / current_value;
                
                if current_ltv >= loan.liquidation_threshold as f64 {
                    loans_to_liquidate.push(loan_id);
                }
            }
        }
    });
    
    // Process liquidations
    for loan_id in &loans_to_liquidate {
        let _ = liquidate_loan(*loan_id);
    }
    
    loans_to_liquidate
}

fn get_asset_current_value(asset: &CollateralAsset) -> f64 {
    // Mock implementation - in production would integrate with price oracles
    // Apply volatility-based depreciation for safety
    let depreciation_factor = match asset.asset_type {
        AssetType::RealEstate => 0.98,  // Stable asset
        AssetType::Vehicle => 0.95,     // Depreciating asset
        AssetType::Artwork => 0.90,     // Volatile market
        AssetType::Jewelry => 0.92,     // Volatile market
        AssetType::Collectible => 0.85, // Highly volatile
        AssetType::Other(_) => 0.90,    // Conservative default
    };
    
    asset.verified_value_usd * depreciation_factor
}

fn liquidate_loan(loan_id: u64) -> Result<(), String> {
    LOANS.with(|loans| {
        let mut loans_map = loans.borrow_mut();
        
        if let Some(mut loan) = loans_map.get(&loan_id) {
            if loan.status != LoanStatus::Active {
                return Err("Loan is not active".to_string());
            }
            
            loan.status = LoanStatus::Liquidated;
            loans_map.insert(loan_id, loan);
            
            // In production, this would:
            // 1. Transfer collateral to lender
            // 2. Calculate liquidation fees
            // 3. Handle partial liquidation if needed
            // 4. Send notifications to borrower
            
            Ok(())
        } else {
            Err("Loan not found".to_string())
        }
    })
}

// Heartbeat function for automated monitoring
#[ic_cdk_macros::heartbeat]
fn heartbeat() {
    // Check liquidations every heartbeat (approximately every 8 seconds)
    // In production, would limit frequency to avoid excessive calls
    static mut LAST_CHECK: u64 = 0;
    let current_time = ic_cdk::api::time();
    
    unsafe {
        // Check liquidations every 5 minutes (300 seconds)
        if current_time - LAST_CHECK > 300_000_000_000 {
            LAST_CHECK = current_time;
            let _ = check_liquidations();
        }
    }
}

#[update]
pub fn create_loan_offer(
    max_loan_amount_usd: f64,
    min_verification_score: f32,
    max_ltv_ratio: f32,
    interest_rate: f32,
    max_duration_days: u32,
    accepted_asset_types: Vec<AssetType>,
    payment_method: PaymentMethod,
) -> Result<u64, String> {
    emergency_pause_check()?;
    let caller = ic_cdk::api::caller();

    // Enhanced validation
    validate_loan_amount(max_loan_amount_usd)?;
    validate_interest_rate(interest_rate)?;
    validate_ltv_ratio(max_ltv_ratio)?;
    
    if !(0.5..=1.0).contains(&min_verification_score) {
        return Err("Minimum verification score must be between 0.5-1.0".to_string());
    }
    
    if max_duration_days == 0 || max_duration_days > 1825 { // Max 5 years
        return Err("Duration must be between 1 day and 5 years".to_string());
    }
    
    if accepted_asset_types.is_empty() {
        return Err("Must accept at least one asset type".to_string());
    }

    let offer_id = NEXT_OFFER_ID.with(|n| {
        let id = *n.borrow();
        *n.borrow_mut() = id + 1;
        id
    });

    let offer = LoanOffer {
        id: offer_id,
        lender: caller,
        max_loan_amount_usd,
        min_verification_score,
        max_ltv_ratio,
        interest_rate,
        max_duration_days,
        accepted_asset_types,
        payment_method,
        is_active: true,
        created_at: ic_cdk::api::time(),
    };

    LOAN_OFFERS.with(|o| o.borrow_mut().insert(offer_id, offer));
    Ok(offer_id)
}

#[update]
pub async fn request_loan(
    offer_id: u64,
    asset_id: String,
    requested_amount_usd: f64,
    duration_days: u32,
) -> Result<u64, String> {
    let caller = ic_cdk::api::caller();

    // Get and validate loan offer
    let offer = LOAN_OFFERS
        .with(|o| o.borrow().get(&offer_id))
        .ok_or("Loan offer not found")?;

    if !offer.is_active {
        return Err("Loan offer is not active".to_string());
    }

    if requested_amount_usd > offer.max_loan_amount_usd {
        return Err("Requested amount exceeds offer limit".to_string());
    }

    if duration_days > offer.max_duration_days {
        return Err("Duration exceeds offer limit".to_string());
    }

    // Get asset details from identity canister
    let asset_result = get_asset_from_identity_canister(&asset_id).await?;

    // Validate asset ownership
    if asset_result.owner != caller {
        return Err("You don't own this asset".to_string());
    }

    // Check asset verification score
    if asset_result.verification_score < offer.min_verification_score {
        return Err("Asset verification score too low".to_string());
    }

    // Check asset type is accepted
    let asset_type_accepted = offer
        .accepted_asset_types
        .iter()
        .any(|t| std::mem::discriminant(t) == std::mem::discriminant(&asset_result.asset_type));

    if !asset_type_accepted {
        return Err("Asset type not accepted by lender".to_string());
    }

    // Calculate LTV ratio
    let ltv_ratio = requested_amount_usd / asset_result.verified_value_usd;
    if ltv_ratio > offer.max_ltv_ratio as f64 {
        return Err("Loan-to-value ratio too high".to_string());
    }

    // Create loan
    let loan_id = NEXT_LOAN_ID.with(|n| {
        let id = *n.borrow();
        *n.borrow_mut() = id + 1;
        id
    });

    let loan = Loan {
        id: loan_id,
        borrower: caller,
        lender: offer.lender,
        collateral_asset: asset_result.clone(),
        loan_amount_usd: requested_amount_usd,
        payment_method: offer.payment_method.clone(),
        interest_rate: offer.interest_rate,
        duration_days,
        status: LoanStatus::Pending,
        created_at: ic_cdk::api::time(),
        funded_at: None,
        due_date: None,
        repaid_at: None,
        loan_to_value_ratio: ltv_ratio as f32,
        liquidation_threshold: calculate_dynamic_liquidation_threshold(&asset_result.asset_type, ltv_ratio as f32),
    };

    LOANS.with(|l| l.borrow_mut().insert(loan_id, loan));
    
    // Set up automated monitoring for this loan
    setup_loan_monitoring(loan_id);
    
    Ok(loan_id)
}

fn setup_loan_monitoring(_loan_id: u64) {
    // Set up periodic checks for this loan's health
    // In production, would use more sophisticated monitoring
    ic_cdk::spawn(async move {
        // This is a simplified monitoring setup
        // Real implementation would use timers and more complex logic
    });
}

#[update]
pub fn fund_loan(loan_id: u64) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    let mut loan = LOANS
        .with(|l| l.borrow().get(&loan_id))
        .ok_or("Loan not found")?;

    if loan.lender != caller {
        return Err("Only lender can fund the loan".to_string());
    }

    if !matches!(loan.status, LoanStatus::Pending) {
        return Err("Loan is not pending funding".to_string());
    }

    let current_time = ic_cdk::api::time();
    loan.status = LoanStatus::Active;
    loan.funded_at = Some(current_time);
    loan.due_date = Some(current_time + (loan.duration_days as u64 * 24 * 60 * 60 * 1_000_000_000));

    LOANS.with(|l| l.borrow_mut().insert(loan_id, loan));
    Ok(())
}

#[update]
pub fn repay_loan(loan_id: u64) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    let mut loan = LOANS
        .with(|l| l.borrow().get(&loan_id))
        .ok_or("Loan not found")?;

    if loan.borrower != caller {
        return Err("Only borrower can repay the loan".to_string());
    }

    if !matches!(loan.status, LoanStatus::Active) {
        return Err("Loan is not active".to_string());
    }

    loan.status = LoanStatus::Repaid;
    loan.repaid_at = Some(ic_cdk::api::time());

    LOANS.with(|l| l.borrow_mut().insert(loan_id, loan));
    Ok(())
}

#[update]
pub async fn liquidateloan(loan_id: u64) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    let mut loan = LOANS
        .with(|l| l.borrow().get(&loan_id))
        .ok_or("Loan not found")?;

    if loan.lender != caller {
        return Err("Only lender can liquidate".to_string());
    }

    if !matches!(loan.status, LoanStatus::Active) {
        return Err("Loan is not active".to_string());
    }

    // Check if loan is past due or collateral value dropped
    let current_time = ic_cdk::api::time();
    let is_past_due = loan.due_date.is_some_and(|due| current_time > due);

    // Get current asset value
    let current_asset = get_asset_from_identity_canister(&loan.collateral_asset.asset_id).await?;
    let current_ltv = loan.loan_amount_usd / current_asset.verified_value_usd;
    let is_over_threshold = current_ltv > loan.liquidation_threshold as f64;

    if !is_past_due && !is_over_threshold {
        return Err("Loan cannot be liquidated yet".to_string());
    }

    loan.status = LoanStatus::Liquidated;

    // Transfer asset ownership to lender
    transfer_asset_ownership(&loan.collateral_asset.asset_id, loan.lender).await?;

    LOANS.with(|l| l.borrow_mut().insert(loan_id, loan));
    Ok(())
}

// Mock function to get asset from identity canister
async fn get_asset_from_identity_canister(asset_id: &str) -> Result<CollateralAsset, String> {
    // In production, this would call the identity canister
    // For now, return mock data
    Ok(CollateralAsset {
        asset_id: asset_id.to_string(),
        asset_type: AssetType::RealEstate,
        verified_value_usd: 100000.0,
        verification_score: 0.85,
        owner: ic_cdk::caller(),
        metadata_uri: "ipfs://mock_hash".to_string(),
    })
}

// Mock function to transfer asset ownership
async fn transfer_asset_ownership(_asset_id: &str, _new_owner: Principal) -> Result<(), String> {
    // In production, this would call the identity canister to transfer ownership
    Ok(())
}

#[query]
pub fn get_loan(loan_id: u64) -> Option<Loan> {
    LOANS.with(|l| l.borrow().get(&loan_id))
}

#[query]
pub fn get_loan_offer(offer_id: u64) -> Option<LoanOffer> {
    LOAN_OFFERS.with(|o| o.borrow().get(&offer_id))
}

#[query]
pub fn get_active_loan_offers(limit: Option<u32>, asset_type: Option<AssetType>) -> Vec<LoanOffer> {
    let limit = limit.unwrap_or(20).min(100) as usize;

    LOAN_OFFERS.with(|o| {
        o.borrow()
            .iter()
            .filter(|(_, offer)| offer.is_active)
            .filter(|(_, offer)| {
                if let Some(ref at) = asset_type {
                    offer
                        .accepted_asset_types
                        .iter()
                        .any(|t| std::mem::discriminant(t) == std::mem::discriminant(at))
                } else {
                    true
                }
            })
            .take(limit)
            .map(|(_, offer)| offer.clone())
            .collect()
    })
}

#[query]
pub fn get_user_loans(user: Principal) -> Vec<Loan> {
    LOANS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, loan)| loan.borrower == user || loan.lender == user)
            .map(|(_, loan)| loan.clone())
            .collect()
    })
}

#[query]
pub fn get_lending_stats() -> LendingStats {
    let total_loans = LOANS.with(|l| l.borrow().len());
    let active_loans = LOANS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, loan)| matches!(loan.status, LoanStatus::Active))
            .count()
    });
    let total_volume = LOANS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, loan)| !matches!(loan.status, LoanStatus::Pending))
            .map(|(_, loan)| loan.loan_amount_usd)
            .sum()
    });
    let active_offers = LOAN_OFFERS.with(|o| {
        o.borrow()
            .iter()
            .filter(|(_, offer)| offer.is_active)
            .count()
    });

    LendingStats {
        total_loans,
        active_loans: active_loans as u64,
        total_volume_usd: total_volume,
        active_offers: active_offers as u64,
        default_rate: 0.0, // Calculate based on defaulted loans
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct LendingStats {
    pub total_loans: u64,
    pub active_loans: u64,
    pub total_volume_usd: f64,
    pub active_offers: u64,
    pub default_rate: f32,
}
