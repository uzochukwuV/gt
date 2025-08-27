use candid::{CandidType, Principal};
use ic_cdk::api::time;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::ChainType;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BridgeRequest {
    pub request_id: String,
    pub from_chain: ChainType,
    pub to_chain: ChainType,
    pub asset_type: String,
    pub amount: u64,
    pub from_address: String,
    pub to_address: String,
    pub user_principal: Principal,
    pub status: BridgeStatus,
    pub created_at: u64,
    pub completed_at: Option<u64>,
    pub transaction_hashes: Vec<String>,
}


#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum BridgeStatus {
    Initiated,
    SourceLocked,
    TargetMinting,
    Completed,
    Failed { reason: String },
    Cancelled,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ChainConfig {
    pub chain_type: ChainType,
    pub rpc_url: String,
    pub bridge_contract: String,
    pub supported_assets: Vec<String>,
    pub min_amount: u64,
    pub max_amount: u64,
    pub fee_percentage: f64,
    pub confirmation_blocks: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BridgeTransactionHistory {
    pub user_principal: Principal,
    pub transactions: Vec<BridgeRequest>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BridgeFee {
    pub amount: u64,
    pub percentage: f64,
    pub fixed_fee: u64,
}

pub struct BridgeService {
    pub requests: HashMap<String, BridgeRequest>,
    pub chain_configs: HashMap<String, ChainConfig>,
    pub user_history: HashMap<Principal, Vec<String>>, // Principal -> Vec<request_id>
}

impl BridgeService {
    pub fn new() -> Self {
        let mut service = Self {
            requests: HashMap::new(),
            chain_configs: HashMap::new(),
            user_history: HashMap::new(),
        };
        
        service.init_default_chains();
        service
    }

    pub fn init_default_chains(&mut self) {
        // Bitcoin configuration
        self.chain_configs.insert(
            "bitcoin".to_string(),
            ChainConfig {
                chain_type: ChainType::Bitcoin,
                rpc_url: "https://blockstream.info/api/".to_string(),
                bridge_contract: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
                supported_assets: vec!["BTC".to_string()],
                min_amount: 10000, // 0.0001 BTC in satoshis
                max_amount: 100000000, // 1 BTC in satoshis
                fee_percentage: 0.5,
                confirmation_blocks: 6,
            },
        );

        // Ethereum configuration
        self.chain_configs.insert(
            "ethereum".to_string(),
            ChainConfig {
                chain_type: ChainType::Ethereum,
                rpc_url: "https://mainnet.infura.io/v3/".to_string(),
                bridge_contract: "0x742d35Cc6635C0532925a3b8D6C8D2f8C4bDD4A1".to_string(),
                supported_assets: vec!["ETH".to_string(), "USDC".to_string(), "USDT".to_string()],
                min_amount: 1000000000000000, // 0.001 ETH in wei
                max_amount: 10000000000000000000, // 10 ETH in wei
                fee_percentage: 0.3,
                confirmation_blocks: 12,
            },
        );

        // Solana configuration
        self.chain_configs.insert(
            "solana".to_string(),
            ChainConfig {
                chain_type: ChainType::Solana,
                rpc_url: "https://api.mainnet-beta.solana.com".to_string(),
                bridge_contract: "HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz".to_string(),
                supported_assets: vec!["SOL".to_string(), "USDC".to_string()],
                min_amount: 10000000, // 0.01 SOL in lamports
                max_amount: 1000000000000, // 1000 SOL in lamports
                fee_percentage: 0.2,
                confirmation_blocks: 32,
            },
        );
    }

    pub fn initiate_bridge_request(
        &mut self,
        from_chain: ChainType,
        to_chain: ChainType,
        asset_type: String,
        amount: u64,
        from_address: String,
        to_address: String,
        user_principal: Principal,
    ) -> Result<String, String> {
        // Generate unique request ID
        let request_id = format!(
            "bridge_{}_{}_{}",
            time(),
            user_principal.to_string()[..8].to_string(),
            amount
        );

        // Validate bridge request
        self.validate_bridge_request(&from_chain, &to_chain, &asset_type, amount)?;

        // Create bridge request
        let bridge_request = BridgeRequest {
            request_id: request_id.clone(),
            from_chain,
            to_chain,
            asset_type,
            amount,
            from_address,
            to_address,
            user_principal,
            status: BridgeStatus::Initiated,
            created_at: time(),
            completed_at: None,
            transaction_hashes: Vec::new(),
        };

        // Store request
        self.requests.insert(request_id.clone(), bridge_request);

        // Add to user history
        self.user_history
            .entry(user_principal)
            .or_default()
            .push(request_id.clone());

        Ok(request_id)
    }

    pub fn get_bridge_request(&self, request_id: &str) -> Option<&BridgeRequest> {
        self.requests.get(request_id)
    }

    pub fn get_user_bridge_history(&self, user_principal: Principal) -> Vec<BridgeRequest> {
        match self.user_history.get(&user_principal) {
            Some(request_ids) => request_ids
                .iter()
                .filter_map(|id| self.requests.get(id).cloned())
                .collect(),
            None => Vec::new(),
        }
    }

    pub fn update_bridge_status(
        &mut self,
        request_id: &str,
        status: BridgeStatus,
        transaction_hash: Option<String>,
    ) -> Result<(), String> {
        match self.requests.get_mut(request_id) {
            Some(request) => {
                request.status = status;
                if let Some(hash) = transaction_hash {
                    request.transaction_hashes.push(hash);
                }
                if matches!(
                    request.status,
                    BridgeStatus::Completed | BridgeStatus::Failed { .. } | BridgeStatus::Cancelled
                ) {
                    request.completed_at = Some(time());
                }
                Ok(())
            }
            None => Err("Bridge request not found".to_string()),
        }
    }

    pub fn calculate_bridge_fee(&self, from_chain: &ChainType, amount: u64) -> BridgeFee {
        let chain_name = match from_chain {
            ChainType::Bitcoin => "bitcoin",
            ChainType::Ethereum => "ethereum",
            ChainType::Solana => "solana",
            _ => "ethereum", // default
        };

        if let Some(config) = self.chain_configs.get(chain_name) {
            let percentage_fee = (amount as f64 * config.fee_percentage / 100.0) as u64;
            let fixed_fee = 1000; // Base fixed fee
            
            BridgeFee {
                amount: percentage_fee + fixed_fee,
                percentage: config.fee_percentage,
                fixed_fee,
            }
        } else {
            // Default fee structure
            BridgeFee {
                amount: (amount as f64 * 0.5 / 100.0) as u64 + 1000,
                percentage: 0.5,
                fixed_fee: 1000,
            }
        }
    }

    pub fn get_supported_chains(&self) -> Vec<ChainConfig> {
        self.chain_configs.values().cloned().collect()
    }

    fn validate_bridge_request(
        &self,
        from_chain: &ChainType,
        to_chain: &ChainType,
        asset_type: &str,
        amount: u64,
    ) -> Result<(), String> {
        if from_chain == to_chain {
            return Err("Source and destination chains cannot be the same".to_string());
        }

        let from_chain_name = match from_chain {
            ChainType::Bitcoin => "bitcoin",
            ChainType::Ethereum => "ethereum",
            ChainType::Solana => "solana",
            _ => return Err("Unsupported source chain".to_string()),
        };

        if let Some(config) = self.chain_configs.get(from_chain_name) {
            if !config.supported_assets.contains(&asset_type.to_string()) {
                return Err(format!("Asset {} not supported on source chain", asset_type));
            }

            if amount < config.min_amount {
                return Err(format!("Amount below minimum: {}", config.min_amount));
            }

            if amount > config.max_amount {
                return Err(format!("Amount exceeds maximum: {}", config.max_amount));
            }
        } else {
            return Err("Source chain configuration not found".to_string());
        }

        Ok(())
    }
}