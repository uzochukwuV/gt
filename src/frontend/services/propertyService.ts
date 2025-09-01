import { Principal } from '@dfinity/principal';
import { createActor as createMarketplaceActor, canisterId as marketplaceCanisterId } from '../../declarations/marketplace';
import { createActor as createBackendActor, canisterId as backendCanisterId } from '../../declarations/backend';
import { authService } from './authService';

export interface PropertyVerificationData {
  address: string;
  propertyType: string;
  yearBuilt: string;
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  estimatedValue: string;
}

export interface PropertyDocuments {
  deed: File | null;
  taxRecords: File | null;
  survey: File | null;
  inspection: File | null;
}

export interface VerifiedAsset {
  id: bigint;
  title: string;
  asset_type: any;
  ai_validation_report: string | null;
  verification_score: number;
  owner: Principal;
  description: string;
  last_updated: bigint;
  verification_documents: string[];
  created_at: bigint;
  verification_status: any;
  metadata_uri: string;
  value_usd: number | null;
  cross_chain_anchors: Array<[any, string]>;
}

class PropertyService {
  // Upload property documents to backend
  async uploadPropertyDocuments(documents: PropertyDocuments, identityId: string): Promise<string[]> {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    const { idlFactory: backendIdlFactory } = await import("../../declarations/backend/backend.did.js");
    const backendActor = connection.type === 'plug' && window.ic?.plug
      ? window.ic.plug.createActor(backendCanisterId!, backendIdlFactory)
      : createBackendActor(backendCanisterId!, { agent: connection.agent as any });

    const uploadedFileIds: string[] = [];

    for (const [type, file] of Object.entries(documents)) {
      if (!file) continue;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);
        
        const uploadRequest = {
          data: Array.from(fileData),
          mime_type: file.type,
          original_name: file.name,
          tags: ['property_verification', type],
          identity_id: [identityId],
          asset_id: []
        };

        const result = await backendActor.upload_file(uploadRequest);
        if ('Err' in result) {
          throw new Error(`Failed to upload ${type}: ${result.Err}`);
        }
        
        uploadedFileIds.push(result.Ok.file_id);
      } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        throw error;
      }
    }

    return uploadedFileIds;
  }

  // Create verified asset in marketplace
  async createVerifiedAsset(
    propertyData: PropertyVerificationData, 
    documentIds: string[],
    identityId: string
  ): Promise<{ success: boolean; assetId?: bigint; error?: string }> {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: marketplaceIdlFactory } = await import("../../declarations/marketplace/marketplace.did.js");
      const marketplaceActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(marketplaceCanisterId!, marketplaceIdlFactory)
        : createMarketplaceActor(marketplaceCanisterId!, { agent: connection.agent as any });

      // Determine asset type based on property type
      let assetType;
      switch (propertyData.propertyType) {
        case 'single-family':
        case 'condo':
        case 'townhouse':
        case 'multi-family':
          assetType = { RealEstate: null };
          break;
        case 'commercial':
          assetType = { Other: 'Commercial Real Estate' };
          break;
        default:
          assetType = { RealEstate: null };
      }

      const verifiedAsset = {
        id: BigInt(0), // Will be assigned by canister
        title: `Property at ${propertyData.address}`,
        asset_type: assetType,
        ai_validation_report: [],
        verification_score: 0.0, // Will be updated by AI verification
        owner: connection.principal,
        description: `${propertyData.propertyType} property built in ${propertyData.yearBuilt}, ${propertyData.squareFootage} sq ft, ${propertyData.bedrooms} bed, ${propertyData.bathrooms} bath`,
        last_updated: BigInt(Date.now() * 1000000),
        verification_documents: documentIds,
        created_at: BigInt(Date.now() * 1000000),
        verification_status: { Pending: null },
        metadata_uri: JSON.stringify({
          address: propertyData.address,
          propertyType: propertyData.propertyType,
          yearBuilt: propertyData.yearBuilt,
          squareFootage: propertyData.squareFootage,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          estimatedValue: propertyData.estimatedValue
        }),
        value_usd: [parseFloat(propertyData.estimatedValue)],
        cross_chain_anchors: []
      };

      const result = await marketplaceActor.register_verified_asset(verifiedAsset);
      
      if ('Err' in result) {
        return {
          success: false,
          error: result.Err
        };
      }

      // Link asset to identity in backend
      const { idlFactory: backendIdlFactory } = await import("../../declarations/backend/backend.did.js");
      const backendActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(backendCanisterId!, backendIdlFactory)
        : createBackendActor(backendCanisterId!, { agent: connection.agent as any });

      const assetId = result.Ok;
      await backendActor.link_asset(identityId, assetId.toString());

      return {
        success: true,
        assetId: assetId
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's verified assets
  async getUserAssets(): Promise<VerifiedAsset[]> {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: backendIdlFactory } = await import("../../declarations/backend/backend.did.js");
      const backendActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(backendCanisterId!, backendIdlFactory)
        : createBackendActor(backendCanisterId!, { agent: connection.agent as any });

      // Get user's identities and linked assets
      const identities = await backendActor.get_my_identities();
      if (identities.length === 0) {
        return [];
      }

      const allAssets: VerifiedAsset[] = [];
      
      for (const identity of identities) {
        for (const assetId of identity.linked_assets) {
          try {
            const { idlFactory: marketplaceIdlFactory } = await import("../../declarations/marketplace/marketplace.did.js");
            const marketplaceActor = connection.type === 'plug' && window.ic?.plug
              ? window.ic.plug.createActor(marketplaceCanisterId!, marketplaceIdlFactory)
              : createMarketplaceActor(marketplaceCanisterId!, { agent: connection.agent as any });

            const assetResult = await marketplaceActor.get_asset(BigInt(assetId));
            if (assetResult.length > 0) {
              allAssets.push(assetResult[0]);
            }
          } catch (error) {
            console.error(`Failed to get asset ${assetId}:`, error);
          }
        }
      }

      return allAssets;
    } catch (error) {
      console.error('Failed to get user assets:', error);
      return [];
    }
  }

  // Get marketplace statistics
  async getMarketplaceStats() {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: marketplaceIdlFactory } = await import("../../declarations/marketplace/marketplace.did.js");
      const marketplaceActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(marketplaceCanisterId!, marketplaceIdlFactory)
        : createMarketplaceActor(marketplaceCanisterId!, { agent: connection.agent as any });

      const stats = await marketplaceActor.get_marketplace_stats();
      return {
        totalAssets: Number(stats.total_assets),
        activeListings: Number(stats.active_listings),
        totalOrders: Number(stats.total_orders),
        completedOrders: Number(stats.completed_orders),
        totalVolumeUsd: stats.total_volume_usd
      };
    } catch (error) {
      console.error('Failed to get marketplace stats:', error);
      return {
        totalAssets: 0,
        activeListings: 0,
        totalOrders: 0,
        completedOrders: 0,
        totalVolumeUsd: 0
      };
    }
  }

  // Create property listing
  async createPropertyListing(
    assetId: bigint,
    price: number,
    paymentMethod: any,
    listingType: any,
    expiresAt?: bigint,
    minimumVerificationScore: number = 0.8,
    crossChainSettlement?: any
  ): Promise<{ success: boolean; listingId?: bigint; error?: string }> {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: marketplaceIdlFactory } = await import("../../declarations/marketplace/marketplace.did.js");
      const marketplaceActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(marketplaceCanisterId!, marketplaceIdlFactory)
        : createMarketplaceActor(marketplaceCanisterId!, { agent: connection.agent as any });

      const result = await marketplaceActor.create_listing(
        assetId,
        price,
        paymentMethod,
        listingType,
        expiresAt ? [expiresAt] : [],
        minimumVerificationScore,
        crossChainSettlement ? [crossChainSettlement] : []
      );

      if ('Err' in result) {
        return {
          success: false,
          error: result.Err
        };
      }

      return {
        success: true,
        listingId: result.Ok
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get property listings with filters
  async getPropertyListings(filters?: {
    skip?: number;
    limit?: number;
    assetType?: any;
    paymentMethod?: any;
    minVerificationScore?: number;
  }) {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: marketplaceIdlFactory } = await import("../../declarations/marketplace/marketplace.did.js");
      const marketplaceActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(marketplaceCanisterId!, marketplaceIdlFactory)
        : createMarketplaceActor(marketplaceCanisterId!, { agent: connection.agent as any });

      const listings = await marketplaceActor.get_listings(
        filters?.skip ? [filters.skip] : [],
        filters?.limit ? [filters.limit] : [],
        filters?.assetType ? [filters.assetType] : [],
        filters?.paymentMethod ? [filters.paymentMethod] : [],
        filters?.minVerificationScore ? [filters.minVerificationScore] : []
      );

      return listings;
    } catch (error) {
      console.error('Failed to get property listings:', error);
      return [];
    }
  }

  // Request AI verification for asset
  async requestAIVerification(assetId: string): Promise<{ success: boolean; error?: string }> {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: backendIdlFactory } = await import("../../declarations/backend/backend.did.js");
      const backendActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(backendCanisterId!, backendIdlFactory)
        : createBackendActor(backendCanisterId!, { agent: connection.agent as any });

      // Get user's identities
      const identities = await backendActor.get_my_identities();
      if (identities.length === 0) {
        throw new Error('No identity found');
      }

      const identityId = identities[0].id;
      
      // Link asset with verification request
      const result = await backendActor.link_asset_with_verification(
        identityId,
        assetId,
        'property_verification',
        'AI verification requested for property documents'
      );

      if ('Err' in result) {
        return {
          success: false,
          error: result.Err
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check verification status
  async getVerificationStatus(assetId: string) {
    const connection = authService.getCurrentConnection();
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory: backendIdlFactory } = await import("../../declarations/backend/backend.did.js");
      const backendActor = connection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(backendCanisterId!, backendIdlFactory)
        : createBackendActor(backendCanisterId!, { agent: connection.agent as any });

      const result = await backendActor.get_asset_verification_status(assetId);
      
      if ('Err' in result) {
        return null;
      }

      return result.Ok;
    } catch (error) {
      console.error('Failed to get verification status:', error);
      return null;
    }
  }
}

export const propertyService = new PropertyService();