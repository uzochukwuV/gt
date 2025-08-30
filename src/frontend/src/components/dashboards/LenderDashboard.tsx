import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card, Button } from "../index";

interface LenderDashboardProps {
  userActivity: {
    reputationScore: number;
    hasOffers: boolean;
    hasLoans: boolean;
  };
}

const LenderDashboard: React.FC<LenderDashboardProps> = ({ userActivity }) => {
  const { lendingActor } = useAuth();
  const [lendingStats, setLendingStats] = useState<any>(null);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLendingData = async () => {
      if (!lendingActor) return;

      try {
        setLoading(true);
        const [stats, offers] = await Promise.all([
          lendingActor.get_lending_stats(),
          lendingActor.get_active_loan_offers(null, null),
        ]);

        setLendingStats(stats);
        setActiveOffers(offers.slice(0, 5)); // Show top 5
      } catch (error) {
        console.error("Failed to fetch lending data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLendingData();
  }, [lendingActor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">
          Loading lending dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lender Hero */}
      <Card className="border-green-500/30 bg-gradient-to-r from-green-600/20 to-blue-600/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-4 flex items-center">
              <span className="mr-3 text-4xl">🏦</span>
              <h1 className="text-3xl font-bold text-white">
                Lending Dashboard
              </h1>
            </div>
            <p className="mb-4 text-xl text-gray-300">
              Manage your loan portfolio and maximize returns
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {userActivity.reputationScore.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Trust Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {lendingStats ? Number(lendingStats.active_offers) : 0}
                </div>
                <div className="text-sm text-gray-400">Active Offers</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/lending">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Create Loan Offer
              </Button>
            </Link>
            <Link to="/lending">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View All Loans
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(
              lendingStats ? Number(lendingStats.total_volume_usd) : 0,
            )}
          </div>
          <div className="text-sm text-gray-400">Total Lent</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {lendingStats ? Number(lendingStats.active_loans) : 0}
          </div>
          <div className="text-sm text-gray-400">Active Loans</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {lendingStats
              ? (Number(lendingStats.default_rate) * 100).toFixed(1)
              : 0}
            %
          </div>
          <div className="text-sm text-gray-400">Default Rate</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">12.5%</div>
          <div className="text-sm text-gray-400">Avg. APY</div>
        </Card>
      </div>

      {/* Active Loan Offers */}
      <Card title="Your Active Loan Offers">
        {activeOffers.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">📋</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No Active Offers
            </h3>
            <p className="mb-4 text-gray-400">
              Create your first loan offer to start earning interest
            </p>
            <Link to="/lending">
              <Button className="bg-green-600 hover:bg-green-700">
                Create Loan Offer
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Max Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Interest Rate
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Max LTV
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Asset Types
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {activeOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-4 py-3 text-sm text-white">
                      {formatCurrency(offer.max_loan_amount_usd)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400">
                      {offer.interest_rate.toFixed(1)}% APR
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {(offer.max_ltv_ratio * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {offer.accepted_asset_types.length} types
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button className="bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Market Opportunities */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="High-Yield Opportunities">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded bg-gray-800 p-3">
              <div>
                <div className="text-sm font-medium text-white">
                  Real Estate Portfolio
                </div>
                <div className="text-xs text-gray-400">Verified Properties</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-400">
                  15.2% APY
                </div>
                <div className="text-xs text-gray-400">Low Risk</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded bg-gray-800 p-3">
              <div>
                <div className="text-sm font-medium text-white">
                  Art & Collectibles
                </div>
                <div className="text-xs text-gray-400">
                  AI-Verified Authenticity
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-400">
                  22.8% APY
                </div>
                <div className="text-xs text-gray-400">Med Risk</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded bg-gray-800 p-3">
              <div>
                <div className="text-sm font-medium text-white">
                  Luxury Assets
                </div>
                <div className="text-xs text-gray-400">High-Value Items</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-400">28.5% APY</div>
                <div className="text-xs text-gray-400">High Risk</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Risk Management">
          <div className="space-y-4">
            <div className="rounded border border-green-600 bg-green-900/30 p-3">
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-green-400">✅</span>
                <span className="text-sm font-medium text-white">
                  Diversified Portfolio
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Your loans are spread across multiple asset classes
              </p>
            </div>
            <div className="rounded border border-blue-600 bg-blue-900/30 p-3">
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-blue-400">🛡️</span>
                <span className="text-sm font-medium text-white">
                  AI Risk Assessment
                </span>
              </div>
              <p className="text-xs text-gray-400">
                All collateral verified with 94% accuracy AI system
              </p>
            </div>
            <div className="rounded border border-purple-600 bg-purple-900/30 p-3">
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-purple-400">⚡</span>
                <span className="text-sm font-medium text-white">
                  Auto Liquidation
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Automated monitoring prevents default losses
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LenderDashboard;
