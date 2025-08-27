use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_cdk::api::management_canister::ecdsa::{
    ecdsa_public_key, EcdsaCurve, EcdsaKeyId, EcdsaPublicKeyArgument,
};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use ic_cdk_macros::*;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, Storable,
};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type StoredAssets = StableBTreeMap<u64, VerifiedAsset, Memory>;
type StoredListings = StableBTreeMap<u64, MarketplaceListing, Memory>;
type StoredOrders = StableBTreeMap<u64, Order, Memory>;

// Asset types supported in the marketplace
#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum AssetType {
    RealEstate,
    AcademicCredential,
    ProfessionalLicense,
    IntellectualProperty,
    Collectible,
    Identity,
    Other(String),
}

// Asset verification status
#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum VerificationStatus {
    Pending,
    Verified,
    Rejected,
    UnderReview,
}

// Cross-chain network support
#[derive(CandidType, Deserialize, Clone, Debug, Serialize, Hash, Eq, PartialEq)]
pub enum CrossChainNetwork {
    Bitcoin,
    Ethereum,
    ICP,
    Solana,
    Other(String),
}

// Payment methods supported
#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum PaymentMethod {
    ICP,
    Bitcoin,
    Ethereum,
    USDC,
    USDT,
    Other(String),
}

// Core verified asset structure
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct VerifiedAsset {
    pub id: u64,
    pub owner: Principal,
    pub asset_type: AssetType,
    pub title: String,
    pub description: String,
    pub verification_status: VerificationStatus,
    pub verification_score: f32, // AI fraud detection score (0-100)
    pub metadata_uri: String,    // IPFS hash
    pub cross_chain_anchors: HashMap<CrossChainNetwork, String>, // Asset presence on other chains
    pub value_usd: Option<f64>,
    pub created_at: u64,
    pub last_updated: u64,
    pub verification_documents: Vec<String>, // IPFS hashes of documents
    pub ai_validation_report: Option<String>, // AI analysis results
}

impl Storable for VerifiedAsset {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

// Marketplace listing structure
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct MarketplaceListing {
    pub id: u64,
    pub asset_id: u64,
    pub seller: Principal,
    pub price: f64,
    pub payment_method: PaymentMethod,
    pub listing_type: ListingType,
    pub is_active: bool,
    pub created_at: u64,
    pub expires_at: Option<u64>,
    pub minimum_verification_score: f32,
    pub cross_chain_settlement: Option<CrossChainNetwork>,
}

impl Storable for MarketplaceListing {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum ListingType {
    Sale,
    Auction,
    Rental,
    Collateral, // For DeFi lending
}

// Order management
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct Order {
    pub id: u64,
    pub listing_id: u64,
    pub buyer: Principal,
    pub seller: Principal,
    pub amount: f64,
    pub payment_method: PaymentMethod,
    pub status: OrderStatus,
    pub created_at: u64,
    pub escrow_address: Option<String>,
    pub settlement_tx_hash: Option<String>,
}

impl Storable for Order {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Encode!(self).unwrap().into()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize, PartialEq)]
pub enum OrderStatus {
    Pending,
    EscrowDeposited,
    Completed,
    Cancelled,
    Disputed,
}

// Cross-chain transaction data
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CrossChainTx {
    pub network: CrossChainNetwork,
    pub tx_hash: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: f64,
    pub status: TxStatus,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TxStatus {
    Pending,
    Confirmed,
    Failed,
}

// Global state management
thread_local! {
    static MEMORY_MANAGER: std::cell::RefCell<MemoryManager<DefaultMemoryImpl>> =
        std::cell::RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static ASSETS: std::cell::RefCell<StoredAssets> = std::cell::RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static LISTINGS: std::cell::RefCell<StoredListings> = std::cell::RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static ORDERS: std::cell::RefCell<StoredOrders> = std::cell::RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    static NEXT_ASSET_ID: std::cell::RefCell<u64> = const { std::cell::RefCell::new(1) };
    static NEXT_LISTING_ID: std::cell::RefCell<u64> = const { std::cell::RefCell::new(1) };
    static NEXT_ORDER_ID: std::cell::RefCell<u64> = const { std::cell::RefCell::new(1) };
}

// Marketplace core functions
#[update]
pub async fn create_listing(
    asset_id: u64,
    price: f64,
    payment_method: PaymentMethod,
    listing_type: ListingType,
    expires_at: Option<u64>,
    minimum_verification_score: f32,
    cross_chain_settlement: Option<CrossChainNetwork>,
) -> Result<u64, String> {
    let caller = ic_cdk::api::caller();

    // Verify asset exists and caller owns it
    let asset = ASSETS.with(|a| a.borrow().get(&asset_id));
    let asset = match asset {
        Some(a) => a,
        None => return Err("Asset not found".to_string()),
    };

    if asset.owner != caller {
        return Err("Only asset owner can create listings".to_string());
    }

    // Check asset is verified
    if !matches!(asset.verification_status, VerificationStatus::Verified) {
        return Err("Only verified assets can be listed".to_string());
    }

    let listing_id = NEXT_LISTING_ID.with(|n| {
        let id = *n.borrow();
        *n.borrow_mut() = id + 1;
        id
    });

    let listing = MarketplaceListing {
        id: listing_id,
        asset_id,
        seller: caller,
        price,
        payment_method,
        listing_type,
        is_active: true,
        created_at: ic_cdk::api::time(),
        expires_at,
        minimum_verification_score,
        cross_chain_settlement,
    };

    LISTINGS.with(|l| l.borrow_mut().insert(listing_id, listing));
    Ok(listing_id)
}

#[query]
pub fn get_listings(
    limit: Option<u32>,
    offset: Option<u32>,
    asset_type: Option<AssetType>,
    payment_method: Option<PaymentMethod>,
    min_verification_score: Option<f32>,
) -> Vec<(MarketplaceListing, VerifiedAsset)> {
    let limit = limit.unwrap_or(20).min(100) as usize;
    let offset = offset.unwrap_or(0) as usize;

    let listings: Vec<_> = LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, listing)| listing.is_active)
            .filter(|(_, listing)| {
                if let Some(ref pm) = payment_method {
                    std::mem::discriminant(&listing.payment_method) == std::mem::discriminant(pm)
                } else {
                    true
                }
            })
            .skip(offset)
            .take(limit)
            .map(|(_, listing)| listing.clone())
            .collect()
    });

    let mut results = Vec::new();
    for listing in listings {
        if let Some(asset) = ASSETS.with(|a| a.borrow().get(&listing.asset_id)) {
            // Apply filters
            if let Some(ref at) = asset_type {
                if std::mem::discriminant(&asset.asset_type) != std::mem::discriminant(at) {
                    continue;
                }
            }

            if let Some(min_score) = min_verification_score {
                if asset.verification_score < min_score {
                    continue;
                }
            }

            results.push((listing, asset));
        }
    }

    results
}

#[update]
pub async fn create_order(listing_id: u64, amount: f64) -> Result<u64, String> {
    let caller = ic_cdk::api::caller();

    // Get listing and validate
    let listing = LISTINGS.with(|l| l.borrow().get(&listing_id));
    let listing = match listing {
        Some(l) => l,
        None => return Err("Listing not found".to_string()),
    };

    if !listing.is_active {
        return Err("Listing is not active".to_string());
    }

    if caller == listing.seller {
        return Err("Cannot buy your own asset".to_string());
    }

    // Check if listing has expired
    if let Some(expires_at) = listing.expires_at {
        if ic_cdk::api::time() > expires_at {
            return Err("Listing has expired".to_string());
        }
    }

    // Validate amount for different listing types
    match listing.listing_type {
        ListingType::Sale => {
            if amount != listing.price {
                return Err("Amount must match listing price".to_string());
            }
        }
        ListingType::Auction => {
            if amount < listing.price {
                return Err("Bid must be at least the minimum price".to_string());
            }
        }
        _ => {} // Other types handled separately
    }

    let order_id = NEXT_ORDER_ID.with(|n| {
        let id = *n.borrow();
        *n.borrow_mut() = id + 1;
        id
    });

    let order = Order {
        id: order_id,
        listing_id,
        buyer: caller,
        seller: listing.seller,
        amount,
        payment_method: listing.payment_method.clone(),
        status: OrderStatus::Pending,
        created_at: ic_cdk::api::time(),
        escrow_address: None,
        settlement_tx_hash: None,
    };

    ORDERS.with(|o| o.borrow_mut().insert(order_id, order));

    // Initialize cross-chain settlement if required
    if let Some(ref network) = listing.cross_chain_settlement {
        let _escrow_result = initialize_cross_chain_escrow(order_id, network.clone()).await;
    }

    Ok(order_id)
}

// Cross-chain integration functions
async fn initialize_cross_chain_escrow(
    order_id: u64,
    network: CrossChainNetwork,
) -> Result<String, String> {
    match network {
        CrossChainNetwork::Bitcoin => generate_bitcoin_escrow_address(order_id).await,
        CrossChainNetwork::Ethereum => generate_ethereum_escrow_address(order_id).await,
        _ => Err("Unsupported network for escrow".to_string()),
    }
}

async fn generate_bitcoin_escrow_address(order_id: u64) -> Result<String, String> {
    let derivation_path = vec![order_id.to_be_bytes().to_vec()];

    let key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(), // Use appropriate key for mainnet
    };

    let request = EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path,
        key_id: key_id.clone(),
    };

    match ecdsa_public_key(request).await {
        Ok((response,)) => {
            let public_key = response.public_key;
            // Convert public key to Bitcoin address
            let address = public_key_to_bitcoin_address(&public_key);

            // Update order with escrow address
            ORDERS.with(|o| {
                if let Some(mut order) = o.borrow_mut().get(&order_id) {
                    order.escrow_address = Some(address.clone());
                    o.borrow_mut().insert(order_id, order);
                }
            });

            Ok(address)
        }
        Err(e) => Err(format!("Failed to generate Bitcoin address: {:?}", e)),
    }
}

async fn generate_ethereum_escrow_address(order_id: u64) -> Result<String, String> {
    let derivation_path = vec![order_id.to_be_bytes().to_vec()];

    let key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };

    let request = EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path,
        key_id: key_id.clone(),
    };

    match ecdsa_public_key(request).await {
        Ok((response,)) => {
            let public_key = response.public_key;
            // Convert public key to Ethereum address
            let address = public_key_to_ethereum_address(&public_key);

            // Update order with escrow address
            ORDERS.with(|o| {
                if let Some(mut order) = o.borrow_mut().get(&order_id) {
                    order.escrow_address = Some(address.clone());
                    o.borrow_mut().insert(order_id, order);
                }
            });

            Ok(address)
        }
        Err(e) => Err(format!("Failed to generate Ethereum address: {:?}", e)),
    }
}

#[update]
pub async fn complete_cross_chain_settlement(order_id: u64, tx_hash: String) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    let mut order = ORDERS
        .with(|o| o.borrow().get(&order_id))
        .ok_or("Order not found")?;

    if order.buyer != caller && order.seller != caller {
        return Err("Unauthorized".to_string());
    }

    // Verify transaction on respective blockchain
    let listing = LISTINGS
        .with(|l| l.borrow().get(&order.listing_id))
        .ok_or("Listing not found")?;

    if let Some(ref network) = listing.cross_chain_settlement {
        let verification_result =
            verify_cross_chain_transaction(network.clone(), &tx_hash, &order).await?;

        if verification_result {
            order.status = OrderStatus::Completed;
            order.settlement_tx_hash = Some(tx_hash);

            // Transfer asset ownership
            transfer_asset_ownership(order.listing_id, order.buyer).await?;

            // Deactivate listing
            LISTINGS.with(|l| {
                if let Some(mut listing) = l.borrow_mut().get(&order.listing_id) {
                    listing.is_active = false;
                    l.borrow_mut().insert(order.listing_id, listing);
                }
            });

            ORDERS.with(|o| o.borrow_mut().insert(order_id, order));
            Ok(())
        } else {
            Err("Transaction verification failed".to_string())
        }
    } else {
        Err("Cross-chain settlement not configured".to_string())
    }
}

async fn verify_cross_chain_transaction(
    network: CrossChainNetwork,
    tx_hash: &str,
    order: &Order,
) -> Result<bool, String> {
    match network {
        CrossChainNetwork::Bitcoin => verify_bitcoin_transaction(tx_hash, order).await,
        CrossChainNetwork::Ethereum => verify_ethereum_transaction(tx_hash, order).await,
        _ => Err("Unsupported network for verification".to_string()),
    }
}

async fn verify_bitcoin_transaction(tx_hash: &str, order: &Order) -> Result<bool, String> {
    // Use HTTPS outcalls to query Bitcoin RPC
    let url = format!("https://blockstream.info/api/tx/{}", tx_hash);

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(2048),
        transform: None,
        headers: vec![],
    };

    match http_request(request, 25_000_000_000).await {
        Ok((response,)) => {
            // Parse Bitcoin transaction and verify
            let tx_data: serde_json::Value = serde_json::from_slice(&response.body)
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            // Verify transaction details match order
            if let Some(escrow_addr) = &order.escrow_address {
                // Check if transaction sends to escrow address
                let outputs = tx_data["vout"]
                    .as_array()
                    .ok_or("Invalid transaction format")?;

                for output in outputs {
                    if let Some(addresses) = output["scriptpubkey_address"].as_str() {
                        if addresses == escrow_addr {
                            let value =
                                output["value"].as_u64().unwrap_or(0) as f64 / 100_000_000.0; // Convert satoshis to BTC
                            return Ok(value >= order.amount);
                        }
                    }
                }
            }

            Ok(false)
        }
        Err(e) => Err(format!("Failed to verify Bitcoin transaction: {:?}", e)),
    }
}

async fn verify_ethereum_transaction(tx_hash: &str, order: &Order) -> Result<bool, String> {
    // Use EVM RPC canister for Ethereum verification
    let rpc_url = "https://eth-mainnet.g.alchemy.com/v2/your-api-key";

    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionByHash",
        "params": [tx_hash],
        "id": 1
    });

    let request = CanisterHttpRequestArgument {
        url: rpc_url.to_string(),
        method: HttpMethod::POST,
        body: Some(body.to_string().into_bytes()),
        max_response_bytes: Some(2048),
        transform: None,
        headers: vec![HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
    };

    match http_request(request, 25_000_000_000).await {
        Ok((response,)) => {
            let tx_data: serde_json::Value = serde_json::from_slice(&response.body)
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            if let Some(result) = tx_data["result"].as_object() {
                if let Some(to) = result["to"].as_str() {
                    if let Some(escrow_addr) = &order.escrow_address {
                        if to.to_lowercase() == escrow_addr.to_lowercase() {
                            // Verify amount
                            if let Some(value_hex) = result["value"].as_str() {
                                let value = u64::from_str_radix(&value_hex[2..], 16).unwrap_or(0)
                                    as f64
                                    / 1_000_000_000_000_000_000.0; // Convert wei to ETH
                                return Ok(value >= order.amount);
                            }
                        }
                    }
                }
            }

            Ok(false)
        }
        Err(e) => Err(format!("Failed to verify Ethereum transaction: {:?}", e)),
    }
}

async fn transfer_asset_ownership(listing_id: u64, new_owner: Principal) -> Result<(), String> {
    let listing = LISTINGS
        .with(|l| l.borrow().get(&listing_id))
        .ok_or("Listing not found")?;

    ASSETS.with(|a| {
        if let Some(mut asset) = a.borrow_mut().get(&listing.asset_id) {
            asset.owner = new_owner;
            asset.last_updated = ic_cdk::api::time();
            a.borrow_mut().insert(listing.asset_id, asset);
            Ok(())
        } else {
            Err("Asset not found".to_string())
        }
    })
}

// Utility functions for address generation
fn public_key_to_bitcoin_address(public_key: &[u8]) -> String {
    // Simplified Bitcoin address generation (P2PKH)
    // In production, use proper Bitcoin address generation library

    let sha256_hash = Sha256::digest(public_key);
    let ripemd_hash = sha256_hash; // Simplified for demo

    // Add version byte (0x00 for mainnet P2PKH)
    let mut extended = vec![0x00];
    extended.extend_from_slice(&ripemd_hash);

    // Double SHA256 for checksum
    let checksum = Sha256::digest(Sha256::digest(&extended));
    extended.extend_from_slice(&checksum[..4]);

    // Base58 encode (simplified)
    format!("1{}", hex::encode(extended)) // This is a placeholder
}

fn public_key_to_ethereum_address(public_key: &[u8]) -> String {
    // Simplified Ethereum address generation (use proper keccak256 in production)
    let hash = Sha256::digest(public_key);
    let address = &hash[12..];

    format!("0x{}", hex::encode(address))
}

// Query functions
#[query]
pub fn get_asset(asset_id: u64) -> Option<VerifiedAsset> {
    ASSETS.with(|a| a.borrow().get(&asset_id))
}

#[query]
pub fn get_listing(listing_id: u64) -> Option<MarketplaceListing> {
    LISTINGS.with(|l| l.borrow().get(&listing_id))
}

#[query]
pub fn get_order(order_id: u64) -> Option<Order> {
    ORDERS.with(|o| o.borrow().get(&order_id))
}

#[query]
pub fn get_user_listings(user: Principal) -> Vec<MarketplaceListing> {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, listing)| listing.seller == user)
            .map(|(_, listing)| listing.clone())
            .collect()
    })
}

#[query]
pub fn get_user_orders(user: Principal) -> Vec<Order> {
    ORDERS.with(|o| {
        o.borrow()
            .iter()
            .filter(|(_, order)| order.buyer == user || order.seller == user)
            .map(|(_, order)| order.clone())
            .collect()
    })
}

// Asset registration (called by identity management system)
#[update]
pub fn register_verified_asset(asset: VerifiedAsset) -> Result<u64, String> {
    let asset_id = NEXT_ASSET_ID.with(|n| {
        let id = *n.borrow();
        *n.borrow_mut() = id + 1;
        id
    });

    let mut new_asset = asset;
    new_asset.id = asset_id;
    new_asset.created_at = ic_cdk::api::time();
    new_asset.last_updated = ic_cdk::api::time();

    ASSETS.with(|a| a.borrow_mut().insert(asset_id, new_asset));
    Ok(asset_id)
}

// Marketplace statistics
#[query]
pub fn get_marketplace_stats() -> MarketplaceStats {
    let total_assets = ASSETS.with(|a| a.borrow().len());
    let active_listings = LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, listing)| listing.is_active)
            .count()
    });
    let total_orders = ORDERS.with(|o| o.borrow().len());
    let completed_orders = ORDERS.with(|o| {
        o.borrow()
            .iter()
            .filter(|(_, order)| matches!(order.status, OrderStatus::Completed))
            .count()
    });

    MarketplaceStats {
        total_assets,
        active_listings: active_listings as u64,
        total_orders,
        completed_orders: completed_orders as u64,
        total_volume_usd: 0.0, // Calculate from completed orders
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MarketplaceStats {
    pub total_assets: u64,
    pub active_listings: u64,
    pub total_orders: u64,
    pub completed_orders: u64,
    pub total_volume_usd: f64,
}
