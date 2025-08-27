import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE as MarketplaceService } from "../../../declarations/marketplace/marketplace.did";
import { apiCall } from "../utils/api";
import { validateMarketplaceListing } from "../utils/validation";

// Marketplace service for connecting to marketplace canister
export const marketplaceService = (
  marketplaceActor: ActorSubclass<MarketplaceService>,
) => ({
  async getListings(
    filters: {
      limit?: number;
      offset?: number;
      assetType?: string;
      paymentMethod?: string;
      minVerificationScore?: number;
    } = {},
  ) {
    return apiCall(async () => {
      const listings = await marketplaceActor.get_listings(
        [filters.limit || 10],
        [filters.offset || 0],
        filters.assetType ? [{ [filters.assetType]: null } as any] : [],
        filters.paymentMethod ? [{ [filters.paymentMethod]: null } as any] : [],
        [filters.minVerificationScore || 0],
      );
      return listings;
    }, "getListings");
  },

  async createListing(listingData: {
    assetId: number;
    price: number;
    paymentMethod: string;
    listingType: string;
  }) {
    return apiCall(async () => {
      const validation = validateMarketplaceListing({
        price: listingData.price,
        paymentMethod: listingData.paymentMethod,
      });

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      const result = await marketplaceActor.create_listing(
        BigInt(listingData.assetId),
        listingData.price,
        { [listingData.paymentMethod]: null } as any,
        { [listingData.listingType]: null } as any,
        [],
        0.0,
        [],
      );
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    }, "createListing");
  },

  async createOrder(listingId: number, amount: number) {
    return apiCall(async () => {
      if (!listingId || listingId <= 0) {
        throw new Error("Valid listing ID is required");
      }

      if (!amount || amount <= 0) {
        throw new Error("Valid amount is required");
      }

      const result = await marketplaceActor.create_order(
        BigInt(listingId),
        amount,
      );
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    }, "createOrder");
  },

  async getMarketplaceStats() {
    return await marketplaceActor.get_marketplace_stats();
  },
});
