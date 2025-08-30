import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../index';

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
          marketplaceActor.get_active_listings(null, null, null)
        ]);
        
        setMarketStats(stats);
        setTrendingAssets(listings.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch trading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTradingData();
  }, [marketplaceActor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTradingLevel = (bridgeHistory: number, reputationScore: number) => {
    if (bridgeHistory >= 10 && reputationScore >= 80) return { level: 'Pro Trader', color: 'text-purple-400' };
    if (bridgeHistory >= 5 && reputationScore >= 60) return { level: 'Active Trader', color: 'text-blue-400' };
    if (bridgeHistory >= 2) return { level: 'Regular Trader', color: 'text-green-400' };
    return { level: 'New Trader', color: 'text-gray-400' };
  };

  const tradingLevel = getTradingLevel(userActivity.bridgeHistory, userActivity.reputationScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-400">Loading trading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trader Hero */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">📊</span>
              <h1 className="text-3xl font-bold text-white">Trading Center</h1>
            </div>
            <p className="text-xl text-gray-300 mb-4">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-400">
            {marketStats ? Number(marketStats.active_listings) : 0}
          </div>
          <div className="text-sm text-gray-400">Active Listings</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(marketStats ? Number(marketStats.total_volume_usd) : 0)}
          </div>
          <div className="text-sm text-gray-400">24h Volume</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-400">4</div>
          <div className="text-sm text-gray-400">Supported Chains</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-400">2.5%</div>
          <div className="text-sm text-gray-400">Trading Fee</div>
        </Card>
      </div>

      {/* Cross-Chain Bridge Status */}
      <Card title="Cross-Chain Bridge">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-orange-900/30 border border-orange-600 rounded text-center">
            <div className="text-2xl mb-2">₿</div>
            <div className="font-medium text-white">Bitcoin</div>
            <div className="text-green-400 text-sm">✓ Connected</div>
          </div>
          <div className="p-4 bg-blue-900/30 border border-blue-600 rounded text-center">
            <div className="text-2xl mb-2">Ξ</div>
            <div className="font-medium text-white">Ethereum</div>
            <div className="text-green-400 text-sm">✓ Connected</div>
          </div>
          <div className="p-4 bg-purple-900/30 border border-purple-600 rounded text-center">
            <div className="text-2xl mb-2">◎</div>
            <div className="font-medium text-white">Solana</div>
            <div className="text-green-400 text-sm">✓ Connected</div>
          </div>
          <div className="p-4 bg-green-900/30 border border-green-600 rounded text-center">
            <div className="text-2xl mb-2">∞</div>
            <div className="font-medium text-white">ICP</div>
            <div className="text-green-400 text-sm">✓ Native</div>
          </div>
        </div>
      </Card>

      {/* Trending Assets */}
      <Card title="Trending Assets">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingAssets.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Market Loading
              </h3>
              <p className="text-gray-400">
                Discovering trending assets across chains
              </p>
            </div>
          ) : (
            trendingAssets.map((asset) => (
              <div key={asset.id} className="p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-white">{asset.asset_type}</h4>
                    <div className="text-sm text-gray-400">{asset.location || 'Digital'}</div>
                  </div>
                  <div className="text-green-400 text-sm">+12%</div>
                </div>
                <div className="text-lg font-bold text-white mb-2">
                  {formatCurrency(asset.price_usd)}
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-xs">
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
                  <td className="px-4 py-3 text-sm text-green-400">
                    $2,500
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    Ethereum
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Trading Tools">
          <div className="space-y-3">
            <Link to="/cross-chain-bridge" className="block">
              <div className="p-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-600 rounded hover:from-blue-800/50 transition-all">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🌉</span>
                  <div>
                    <div className="font-medium text-white">Cross-Chain Bridge</div>
                    <div className="text-xs text-gray-400">Move assets between chains</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/marketplace" className="block">
              <div className="p-3 bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-600 rounded hover:from-green-800/50 transition-all">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💹</span>
                  <div>
                    <div className="font-medium text-white">Market Analytics</div>
                    <div className="text-xs text-gray-400">Price trends and insights</div>
                  </div>
                </div>
              </div>
            </Link>
            <div className="p-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-600 rounded">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🤖</span>
                <div>
                  <div className="font-medium text-white">AI Trading Signals</div>
                  <div className="text-xs text-gray-400">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Portfolio Summary">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Portfolio Value</span>
              <span className="text-2xl font-bold text-green-400">$125,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">24h P&L</span>
              <span className="text-lg font-bold text-green-400">+$3,250 (2.6%)</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bitcoin</span>
                <span className="text-white">45%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ethereum</span>
                <span className="text-white">30%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Other Assets</span>
                <span className="text-white">25%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TraderDashboard;