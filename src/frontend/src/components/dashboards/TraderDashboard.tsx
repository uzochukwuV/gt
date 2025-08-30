import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card, Button } from "../index";

interface TraderDashboardProps {
  userActivity: {
    reputationScore: number;
    hasListings: boolean;
    bridgeHistory: number;
  };
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({ userActivity }) => {
  const { marketplaceActor } = useAuth();
  const [marketStats, setMarketStats] = useState<any>(null);
  const [trendingAssets, setTrendingAssets] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTradingData = async () => {
      if (!marketplaceActor) return;

      try {
        setLoading(true);
        const [stats, listings] = await Promise.all([
          marketplaceActor.get_marketplace_stats(),
          marketplaceActor.get_active_listings(null, null, null),
        ]);

        setMarketStats(stats);
        setTrendingAssets(listings.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch trading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTradingData();
  }, [marketplaceActor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTradingLevel = (bridgeHistory: number, reputationScore: number) => {
    if (bridgeHistory >= 10 && reputationScore >= 80)
      return { level: "Pro Trader", color: "text-purple-400" };
    if (bridgeHistory >= 5 && reputationScore >= 60)
      return { level: "Active Trader", color: "text-blue-400" };
    if (bridgeHistory >= 2)
      return { level: "Regular Trader", color: "text-green-400" };
    return { level: "New Trader", color: "text-gray-400" };
  };

  const tradingLevel = getTradingLevel(
    userActivity.bridgeHistory,
    userActivity.reputationScore,
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">
          Loading trading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trader Hero */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-4 flex items-center">
              <span className="mr-3 text-4xl">📊</span>
              <h1 className="text-3xl font-bold text-white">Trading Center</h1>
            </div>
            <p className="mb-4 text-xl text-gray-300">
              Trade verified assets across multiple blockchains
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${tradingLevel.color}`}>
                  {tradingLevel.level}
                </div>
                <div className="text-sm text-gray-400">Trading Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {userActivity.bridgeHistory}
                </div>
                <div className="text-sm text-gray-400">Cross-Chain Trades</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/marketplace">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Browse Market
              </Button>
            </Link>
            <Link to="/verify-assets">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                List Asset
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Market Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {marketStats ? Number(marketStats.active_listings) : 0}
          </div>
          <div className="text-sm text-gray-400">Active Listings</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(
              marketStats ? Number(marketStats.total_volume_usd) : 0,
            )}
          </div>
          <div className="text-sm text-gray-400">24h Volume</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">4</div>
          <div className="text-sm text-gray-400">Supported Chains</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">2.5%</div>
          <div className="text-sm text-gray-400">Trading Fee</div>
        </Card>
      </div>

      {/* Cross-Chain Bridge Status */}
      <Card title="Cross-Chain Bridge">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded border border-orange-600 bg-orange-900/30 p-4 text-center">
            <div className="mb-2 text-2xl">₿</div>
            <div className="font-medium text-white">Bitcoin</div>
            <div className="text-sm text-green-400">✓ Connected</div>
          </div>
          <div className="rounded border border-blue-600 bg-blue-900/30 p-4 text-center">
            <div className="mb-2 text-2xl">Ξ</div>
            <div className="font-medium text-white">Ethereum</div>
            <div className="text-sm text-green-400">✓ Connected</div>
          </div>
          <div className="rounded border border-purple-600 bg-purple-900/30 p-4 text-center">
            <div className="mb-2 text-2xl">◎</div>
            <div className="font-medium text-white">Solana</div>
            <div className="text-sm text-green-400">✓ Connected</div>
          </div>
          <div className="rounded border border-green-600 bg-green-900/30 p-4 text-center">
            <div className="mb-2 text-2xl">∞</div>
            <div className="font-medium text-white">ICP</div>
            <div className="text-sm text-green-400">✓ Native</div>
          </div>
        </div>
      </Card>

      {/* Trending Assets */}
      <Card title="Trending Assets">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {trendingAssets.length === 0 ? (
            <div className="col-span-3 py-8 text-center">
              <div className="mb-4 text-4xl">📈</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Market Loading
              </h3>
              <p className="text-gray-400">
                Discovering trending assets across chains
              </p>
            </div>
          ) : (
            trendingAssets.map((asset) => (
              <div key={asset.id} className="rounded-lg bg-gray-800 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white">
                      {asset.asset_type}
                    </h4>
                    <div className="text-sm text-gray-400">
                      {asset.location || "Digital"}
                    </div>
                  </div>
                  <div className="text-sm text-green-400">+12%</div>
                </div>
                <div className="mb-2 text-lg font-bold text-white">
                  {formatCurrency(asset.price_usd)}
                </div>
                <Button className="w-full bg-purple-600 text-xs hover:bg-purple-700">
                  View Details
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Your Listings */}
      {userActivity.hasListings && (
        <Card title="Your Active Listings">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Chain
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-white">
                    Digital Art #001
                  </td>
                  <td className="px-4 py-3 text-sm text-green-400">$2,500</td>
                  <td className="px-4 py-3 text-sm text-gray-300">Ethereum</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded bg-green-900/50 px-2 py-1 text-xs text-green-400">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button className="bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700">
                      Edit
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Trading Tools */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Trading Tools">
          <div className="space-y-3">
            <Link to="/cross-chain-bridge" className="block">
              <div className="rounded border border-blue-600 bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-3 transition-all hover:from-blue-800/50">
                <div className="flex items-center">
                  <span className="mr-3 text-2xl">🌉</span>
                  <div>
                    <div className="font-medium text-white">
                      Cross-Chain Bridge
                    </div>
                    <div className="text-xs text-gray-400">
                      Move assets between chains
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/marketplace" className="block">
              <div className="rounded border border-green-600 bg-gradient-to-r from-green-900/50 to-blue-900/50 p-3 transition-all hover:from-green-800/50">
                <div className="flex items-center">
                  <span className="mr-3 text-2xl">💹</span>
                  <div>
                    <div className="font-medium text-white">
                      Market Analytics
                    </div>
                    <div className="text-xs text-gray-400">
                      Price trends and insights
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            <div className="rounded border border-purple-600 bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3">
              <div className="flex items-center">
                <span className="mr-3 text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-white">
                    AI Trading Signals
                  </div>
                  <div className="text-xs text-gray-400">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Portfolio Summary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Portfolio Value</span>
              <span className="text-2xl font-bold text-green-400">
                $125,000
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">24h P&L</span>
              <span className="text-lg font-bold text-green-400">
                +$3,250 (2.6%)
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bitcoin</span>
                <span className="text-white">45%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ethereum</span>
                <span className="text-white">30%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: "30%" }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Other Assets</span>
                <span className="text-white">25%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: "25%" }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TraderDashboard;
