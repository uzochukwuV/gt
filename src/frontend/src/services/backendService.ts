import { backend } from "../../../declarations/backend";
import type {
  Identity,
  VerifiableCredential,
  PrivacySettings,
  ChainType,
  AssetVerification,
  ComplianceStatus,
  RiskAssessment,
  AuditEntry,
} from "../../../declarations/backend";

/**
 * Service for handling all backend canister API calls for Identity Management
 */

export const backendService = {
  /**
   * Creates a new identity for the current user
   */
  async createIdentity(
    internet_identity_anchor: bigint | null,
    initial_credentials: VerifiableCredential[],
    privacy_settings: PrivacySettings,
  ): Promise<string> {
    const result = await backend.create_identity(
      internet_identity_anchor ? [internet_identity_anchor] : [],
      initial_credentials,
      privacy_settings,
    );

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets an identity by ID
   */
  async getIdentity(identity_id: string): Promise<Identity> {
    const result = await backend.get_identity(identity_id);

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets all identities owned by the current user
   */
  async getMyIdentities(): Promise<Identity[]> {
    return await backend.get_my_identities();
  },

  /**
   * Adds a credential to an existing identity
   */
  async addCredential(
    identity_id: string,
    credential: VerifiableCredential,
  ): Promise<void> {
    const result = await backend.add_credential(identity_id, credential);

    if ("Err" in result) {
      throw new Error(result.Err);
    }
  },

  /**
   * Links a wallet to an identity
   */
  async linkWallet(
    identity_id: string,
    chain_type: ChainType,
    wallet_address: string,
  ): Promise<void> {
    const result = await backend.link_wallet(
      identity_id,
      chain_type,
      wallet_address,
    );

    if ("Err" in result) {
      throw new Error(result.Err);
    }
  },

  /**
   * Updates reputation score for an identity
   */
  async updateReputation(
    identity_id: string,
    score_change: number,
    reason: string,
  ): Promise<void> {
    const result = await backend.update_reputation(
      identity_id,
      score_change,
      reason,
    );

    if ("Err" in result) {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets statistics about the identity system
   */
  async getIdentityStats(): Promise<{ total: bigint; verified: bigint }> {
    const [total, verified] = await backend.get_identity_stats();
    return { total, verified };
  },

  // =====================================================
  // ENHANCED IDENTITY & ASSET VERIFICATION FUNCTIONS
  // =====================================================

  /**
   * Links a wallet with signature verification
   */
  async linkWalletVerified(
    identity_id: string,
    chain_type: ChainType,
    wallet_address: string,
    signature: string,
    message: string,
  ): Promise<void> {
    const result = await backend.link_wallet_verified(
      identity_id,
      chain_type,
      wallet_address,
      signature,
      message,
    );

    if ("Err" in result) {
      throw new Error(result.Err);
    }
  },

  /**
   * Links an asset to an identity
   */
  async linkAsset(identity_id: string, asset_id: string): Promise<void> {
    const result = await backend.link_asset(identity_id, asset_id);

    if ("Err" in result) {
      throw new Error(result.Err);
    }
  },

  /**
   * Links an asset with AI verification
   */
  async linkAssetWithVerification(
    identity_id: string,
    asset_id: string,
    asset_type: string,
    asset_data: string,
  ): Promise<string> {
    const result = await backend.link_asset_with_verification(
      identity_id,
      asset_id,
      asset_type,
      asset_data,
    );

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets asset verification status
   */
  async getAssetVerificationStatus(
    asset_id: string,
  ): Promise<AssetVerification> {
    const result = await backend.get_asset_verification_status(asset_id);

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Updates asset verification result from AI canister
   */
  async updateAssetVerificationResult(
    asset_id: string,
  ): Promise<AssetVerification> {
    const result = await backend.update_asset_verification_result(asset_id);

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets audit trail for an identity
   */
  async getAuditTrail(
    identity_id: string,
    limit?: number,
    offset?: number,
  ): Promise<AuditEntry[]> {
    const result = await backend.get_audit_trail(
      identity_id,
      limit ? [limit] : [],
      offset ? [offset] : [],
    );

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets compliance status for an identity
   */
  async getComplianceStatus(identity_id: string): Promise<ComplianceStatus> {
    const result = await backend.get_compliance_status(identity_id);

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  /**
   * Gets risk assessment for an identity
   */
  async getRiskAssessment(identity_id: string): Promise<RiskAssessment> {
    const result = await backend.get_risk_assessment(identity_id);

    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },
};
