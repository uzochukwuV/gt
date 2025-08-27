import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE as LendingService } from "../../../declarations/lending/lending.did";
import { apiCall } from "../utils/api";
import { validateLoanOffer } from "../utils/validation";

// Lending service for connecting to lending canister
export const lendingService = (
  lendingActor: ActorSubclass<LendingService>,
) => ({
  async getLoanOffers(
    filters: {
      limit?: number;
      assetType?: string;
    } = {},
  ) {
    return apiCall(async () => {
      const offers = await lendingActor.get_active_loan_offers(
        [filters.limit || 10],
        filters.assetType ? [{ [filters.assetType]: null } as any] : [],
      );
      return offers;
    }, "getLoanOffers");
  },

  async createLoanOffer(offerData: {
    maxLoanAmountUsd: number;
    minVerificationScore: number;
    maxLtvRatio: number;
    interestRate: number;
    maxDurationDays: number;
    acceptedAssetTypes: string[];
    paymentMethod: string;
  }) {
    return apiCall(async () => {
      const validation = validateLoanOffer({
        maxLoanAmountUsd: offerData.maxLoanAmountUsd.toString(),
        interestRate: offerData.interestRate.toString(),
        maxLtvRatio: offerData.maxLtvRatio.toString(),
        maxDurationDays: offerData.maxDurationDays.toString(),
      });

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      const result = await lendingActor.create_loan_offer(
        offerData.maxLoanAmountUsd,
        offerData.minVerificationScore,
        offerData.maxLtvRatio,
        offerData.interestRate,
        offerData.maxDurationDays,
        offerData.acceptedAssetTypes.map((type) => ({ [type]: null }) as any),
        { [offerData.paymentMethod]: null } as any,
      );
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    }, "createLoanOffer");
  },

  async requestLoan(requestData: {
    offerId: number;
    assetId: string;
    requestedAmountUsd: number;
    durationDays: number;
  }) {
    const result = await lendingActor.request_loan(
      BigInt(requestData.offerId),
      requestData.assetId,
      requestData.requestedAmountUsd,
      requestData.durationDays,
    );
    if ("Ok" in result) {
      return result.Ok;
    } else {
      throw new Error(result.Err);
    }
  },

  async getUserLoans(userPrincipal: any) {
    const result = await lendingActor.get_user_loans(userPrincipal);
    return result;
  },

  async getLendingStats() {
    return await lendingActor.get_lending_stats();
  },
});
