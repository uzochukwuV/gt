import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { lendingService } from "../services/lendingService";
import { handleApiError, withLoading } from "../utils/api";
import { validateLoanOffer } from "../utils/validation";
import { useAuth } from "../context/AuthContext";
import { LoanOffer, Loan } from "../../../declarations/lending/lending.did";

const Lending = () => {
  const { lendingActor, principal } = useAuth();
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    maxLoanAmountUsd: "",
    minVerificationScore: "0.8",
    maxLtvRatio: "0.7",
    interestRate: "8.5",
    maxDurationDays: "365",
    paymentMethod: "USDC",
  });

  useEffect(() => {
    if (lendingActor) {
      loadData();
    }
  }, [lendingActor]);

  const loadData = async () => {
    if (!lendingActor) return;
    await withLoading(async () => {
      try {
        const [offersData, loansData, statsData] = await Promise.all([
          lendingService(lendingActor).getLoanOffers({ limit: 10 }),
          lendingService(lendingActor).getUserLoans(principal),
          lendingService(lendingActor).getLendingStats(),
        ]);
        setLoanOffers(offersData);
        setUserLoans(loansData);
        setStats(statsData);
      } catch (error) {
        const errorMessage = handleApiError(error, "loading lending data");
        alert(errorMessage);
      }
    }, setLoading);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lendingActor) return;

    // Validate form data
    const validation = validateLoanOffer(offerForm);
    if (!validation.isValid) {
      alert(`Validation errors: ${validation.errors.join(", ")}`);
      return;
    }

    try {
      await lendingService(lendingActor).createLoanOffer({
        maxLoanAmountUsd: parseFloat(offerForm.maxLoanAmountUsd),
        minVerificationScore: parseFloat(offerForm.minVerificationScore),
        maxLtvRatio: parseFloat(offerForm.maxLtvRatio),
        interestRate: parseFloat(offerForm.interestRate),
        maxDurationDays: parseInt(offerForm.maxDurationDays),
        acceptedAssetTypes: ["RealEstate", "Vehicle", "Collectible"],
        paymentMethod: offerForm.paymentMethod,
      });
      alert("Loan offer created successfully!");
      setShowCreateOffer(false);
      setOfferForm({
        maxLoanAmountUsd: "",
        minVerificationScore: "0.8",
        maxLtvRatio: "0.7",
        interestRate: "8.5",
        maxDurationDays: "365",
        paymentMethod: "USDC",
      });
      loadData();
    } catch (error) {
      const errorMessage = handleApiError(error, "creating loan offer");
      alert(errorMessage);
    }
  };

  const handleRequestLoan = async (offerId: bigint, maxAmount: number) => {
    if (!lendingActor) return;
    const assetId = prompt("Enter your asset ID:")?.trim();
    const amount = prompt(
      `Enter loan amount (max ${maxAmount.toLocaleString()}):`,
    )?.trim();
    const duration = prompt("Enter duration in days:")?.trim();

    if (!assetId || !amount || !duration) {
      alert("All fields are required");
      return;
    }

    const amountNum = parseFloat(amount);
    const durationNum = parseInt(duration);

    if (isNaN(amountNum) || amountNum <= 0 || amountNum > maxAmount) {
      alert(
        `Invalid amount. Must be between $1 and ${maxAmount.toLocaleString()}`,
      );
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 3650) {
      alert("Invalid duration. Must be between 1 and 3650 days");
      return;
    }

    try {
      await lendingService(lendingActor).requestLoan({
        offerId: Number(offerId.toString()),
        assetId: assetId,
        requestedAmountUsd: amountNum,
        durationDays: durationNum,
      });
      alert("Loan request submitted successfully!");
      loadData();
    } catch (error) {
      const errorMessage = handleApiError(error, "requesting loan");
      alert(errorMessage);
    }
  };

  return (
    <Layout>
      <>
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="tracking-light text-[32px] leading-tight font-bold text-white">
              Lending
            </p>
            <p className="text-sm leading-normal font-normal text-[#9cabba]">
              Borrow against your verified assets or lend to earn interest.
              {!loading && ` ${stats.active_loans || 0} active loans`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateOffer(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Loan Offer
            </button>
          </div>
        </div>

        {showCreateOffer && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="mx-4 w-full max-w-md rounded-lg bg-[#283039] p-6">
              <h3 className="mb-4 text-lg font-bold text-white">
                Create Loan Offer
              </h3>
              <form onSubmit={handleCreateOffer}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-white">
                      Max Loan Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={offerForm.maxLoanAmountUsd}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          maxLoanAmountUsd: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-[#1b2127] p-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={offerForm.interestRate}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          interestRate: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-[#1b2127] p-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white">
                      Max LTV Ratio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      max="0.8"
                      value={offerForm.maxLtvRatio}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          maxLtvRatio: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-[#1b2127] p-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white">
                      Max Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={offerForm.maxDurationDays}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          maxDurationDays: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-[#1b2127] p-3 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Create Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateOffer(false)}
                    className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-6 p-4 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold text-white">
              Available Loan Offers
            </h2>
            {loading ? (
              <div className="text-white">Loading offers...</div>
            ) : (
              <div className="space-y-4">
                {loanOffers.map((offer) => (
                  <div key={offer.id} className="rounded-lg bg-[#283039] p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          Up to ${offer.max_loan_amount_usd.toLocaleString()}
                        </h3>
                        <p className="text-sm text-[#9cabba]">
                          {offer.interest_rate}% APR
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleRequestLoan(offer.id, offer.max_loan_amount_usd)
                        }
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                      >
                        Request Loan
                      </button>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>
                        Max LTV: {(offer.max_ltv_ratio * 100).toFixed(0)}%
                      </div>
                      <div>
                        Min Score:{" "}
                        {(offer.min_verification_score * 100).toFixed(0)}%
                      </div>
                      <div>Max Duration: {offer.max_duration_days} days</div>
                      <div>Payment: {Object.keys(offer.payment_method)[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold text-white">Your Loans</h2>
            {loading ? (
              <div className="text-white">Loading loans...</div>
            ) : (
              <div className="space-y-4">
                {userLoans.map((loan) => (
                  <div key={loan.id} className="rounded-lg bg-[#283039] p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          ${loan.loan_amount_usd.toLocaleString()}
                        </h3>
                        <p className="text-sm text-[#9cabba]">
                          {loan.interest_rate}% APR
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          Object.keys(loan.status)[0] === "Active"
                            ? "bg-green-600 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {Object.keys(loan.status)[0]}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>
                        Collateral:{" "}
                        {Object.keys(loan.collateral_asset.asset_type)[0]}
                      </div>
                      <div>
                        LTV: {(loan.loan_to_value_ratio * 100).toFixed(1)}%
                      </div>
                      <div>Duration: {loan.duration_days} days</div>
                      <div>
                        Asset Value: $
                        {loan.collateral_asset.verified_value_usd.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {userLoans.length === 0 && !loading && (
                  <div className="py-8 text-center text-gray-400">
                    No active loans. Request a loan using the offers above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </>
    </Layout>
  );
};

export default Lending;
