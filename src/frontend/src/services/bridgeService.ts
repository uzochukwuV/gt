import { backend } from "../../../declarations/backend";
import type {
  BridgeRequest,
  BridgeStatus,
  ChainConfig,
  BridgeFee,
  ChainType,
} from "../../../declarations/backend/backend.did";

export interface CrossChainTransfer {
  id: string;
  fromChain: string;
  toChain: string;
  asset: string;
  amount: bigint;
  fromAddress: string;
  toAddress: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  transactionHashes: string[];
}

export interface SupportedChain {
  type: string;
  name: string;
  rpcUrl: string;
  bridgeContract: string;
  supportedAssets: string[];
  minAmount: bigint;
  maxAmount: bigint;
  feePercentage: number;
  confirmationBlocks: number;
}

export interface BridgeFeeEstimate {
  amount: bigint;
  percentage: number;
  fixedFee: bigint;
}

// Helper functions to convert between frontend and Candid types
function chainTypeToString(chainType: ChainType): string {
  if ("Bitcoin" in chainType) return "Bitcoin";
  if ("Ethereum" in chainType) return "Ethereum";
  if ("Solana" in chainType) return "Solana";
  if ("ICP" in chainType) return "ICP";
  if ("Polygon" in chainType) return "Polygon";
  if ("Avalanche" in chainType) return "Avalanche";
  if ("Custom" in chainType) return chainType.Custom.name;
  return "Unknown";
}

function stringToChainType(chain: string): ChainType {
  switch (chain.toLowerCase()) {
    case "bitcoin":
      return { Bitcoin: null };
    case "ethereum":
      return { Ethereum: null };
    case "solana":
      return { Solana: null };
    case "icp":
      return { ICP: null };
    case "polygon":
      return { Polygon: null };
    case "avalanche":
      return { Avalanche: null };
    default:
      return { Ethereum: null }; // Default fallback
  }
}

function bridgeStatusToString(status: BridgeStatus): string {
  if ("Initiated" in status) return "Initiated";
  if ("SourceLocked" in status) return "Source Locked";
  if ("TargetMinting" in status) return "Target Minting";
  if ("Completed" in status) return "Completed";
  if ("Failed" in status) return `Failed: ${status.Failed.reason}`;
  if ("Cancelled" in status) return "Cancelled";
  return "Unknown";
}

function toCrossChainTransfer(
  bridgeRequest: BridgeRequest,
): CrossChainTransfer {
  return {
    id: bridgeRequest.request_id,
    fromChain: chainTypeToString(bridgeRequest.from_chain),
    toChain: chainTypeToString(bridgeRequest.to_chain),
    asset: bridgeRequest.asset_type,
    amount: bridgeRequest.amount,
    fromAddress: bridgeRequest.from_address,
    toAddress: bridgeRequest.to_address,
    status: bridgeStatusToString(bridgeRequest.status),
    createdAt: new Date(Number(bridgeRequest.created_at) / 1000000), // Convert nanoseconds to milliseconds
    completedAt:
      bridgeRequest.completed_at.length > 0
        ? new Date(Number(bridgeRequest.completed_at[0]) / 1000000)
        : undefined,
    transactionHashes: bridgeRequest.transaction_hashes,
  };
}

function toSupportedChain(chainConfig: ChainConfig): SupportedChain {
  return {
    type: chainTypeToString(chainConfig.chain_type),
    name: chainTypeToString(chainConfig.chain_type),
    rpcUrl: chainConfig.rpc_url,
    bridgeContract: chainConfig.bridge_contract,
    supportedAssets: chainConfig.supported_assets,
    minAmount: chainConfig.min_amount,
    maxAmount: chainConfig.max_amount,
    feePercentage: chainConfig.fee_percentage,
    confirmationBlocks: chainConfig.confirmation_blocks,
  };
}

function toBridgeFeeEstimate(bridgeFee: BridgeFee): BridgeFeeEstimate {
  return {
    amount: bridgeFee.amount,
    percentage: bridgeFee.percentage,
    fixedFee: bridgeFee.fixed_fee,
  };
}

export const bridgeService = {
  /**
   * Initiate a cross-chain bridge transfer
   */
  async initiateBridge(
    fromChain: string,
    toChain: string,
    assetType: string,
    amount: bigint,
    fromAddress: string,
    toAddress: string,
  ): Promise<string> {
    try {
      const result = await backend.initiate_cross_chain_bridge(
        stringToChainType(fromChain),
        stringToChainType(toChain),
        assetType,
        amount,
        fromAddress,
        toAddress,
      );

      if ("Err" in result) {
        throw new Error(result.Err);
      }

      return result.Ok;
    } catch (error) {
      console.error("Bridge initiation failed:", error);
      throw error;
    }
  },

  /**
   * Get details of a specific bridge request
   */
  async getBridgeRequest(requestId: string): Promise<CrossChainTransfer> {
    try {
      const result = await backend.get_bridge_request(requestId);

      if ("Err" in result) {
        throw new Error(result.Err);
      }

      return toCrossChainTransfer(result.Ok);
    } catch (error) {
      console.error("Failed to get bridge request:", error);
      throw error;
    }
  },

  /**
   * Get user's bridge transaction history
   */
  async getUserBridgeHistory(): Promise<CrossChainTransfer[]> {
    try {
      const requests = await backend.get_user_bridge_history();
      return requests.map(toCrossChainTransfer);
    } catch (error) {
      console.error("Failed to get bridge history:", error);
      throw error;
    }
  },

  /**
   * Calculate bridge fee for a transfer
   */
  async calculateBridgeFee(
    fromChain: string,
    amount: bigint,
  ): Promise<BridgeFeeEstimate> {
    try {
      const fee = await backend.calculate_bridge_fee(
        stringToChainType(fromChain),
        amount,
      );
      return toBridgeFeeEstimate(fee);
    } catch (error) {
      console.error("Failed to calculate bridge fee:", error);
      throw error;
    }
  },

  /**
   * Get supported chains and their configurations
   */
  async getSupportedChains(): Promise<SupportedChain[]> {
    try {
      const chains = await backend.get_supported_chains();
      return chains.map(toSupportedChain);
    } catch (error) {
      console.error("Failed to get supported chains:", error);
      throw error;
    }
  },

  /**
   * Format amount for display
   */
  formatAmount(amount: bigint, decimals: number = 8): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;

    if (fractionalPart === 0n) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "");
    return `${wholePart}.${fractionalStr}`;
  },

  /**
   * Parse amount from string input
   */
  parseAmount(amountStr: string, decimals: number = 8): bigint {
    const [wholePart = "0", fractionalPart = "0"] = amountStr.split(".");
    const paddedFractional = fractionalPart
      .padEnd(decimals, "0")
      .slice(0, decimals);

    const wholeAmount = BigInt(wholePart) * BigInt(10) ** BigInt(decimals);
    const fractionalAmount = BigInt(paddedFractional);

    return wholeAmount + fractionalAmount;
  },

  /**
   * Get chain icon/emoji
   */
  getChainIcon(chain: string): string {
    const chainIcons: { [key: string]: string } = {
      Bitcoin: "₿",
      Ethereum: "Ξ",
      Solana: "◎",
      ICP: "∞",
      Polygon: "⬡",
      Avalanche: "🔺",
    };
    return chainIcons[chain] || "🔗";
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    if (status === "Completed") return "text-green-400";
    if (status.includes("Failed")) return "text-red-400";
    if (status === "Cancelled") return "text-gray-400";
    return "text-yellow-400";
  },

  /**
   * Validate bridge transfer parameters
   */
  validateTransfer(
    fromChain: string,
    toChain: string,
    assetType: string,
    amount: string,
    fromAddress: string,
    toAddress: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fromChain) errors.push("Source chain is required");
    if (!toChain) errors.push("Destination chain is required");
    if (fromChain === toChain)
      errors.push("Source and destination chains must be different");
    if (!assetType) errors.push("Asset type is required");
    if (!amount || parseFloat(amount) <= 0)
      errors.push("Amount must be greater than 0");
    if (!fromAddress) errors.push("Source address is required");
    if (!toAddress) errors.push("Destination address is required");

    // Basic address validation (could be enhanced)
    if (fromAddress && fromAddress.length < 10)
      errors.push("Invalid source address");
    if (toAddress && toAddress.length < 10)
      errors.push("Invalid destination address");

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default bridgeService;
