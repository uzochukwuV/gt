import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card, Button } from "../index";

interface InvestorDashboardProps {
  userActivity: {
    reputationScore: number;
    bridgeHistory: number;
    hasOffers: boolean;
    hasListings: boolean;
  };
}

const InvestorDashboard: React.FC<InvestorDashboardProps> = ({
  userActivity,
}) => {
  const { lendingActor, marketplaceActor } = useAuth();
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [marketOpportunities, setMarketOpportunities] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestorData = async () => {
      try {
        setLoading(true);

        // Mock data for demonstration - would fetch real data in production
        setPortfolioData({
          totalValue: 350000,
          monthlyGrowth: 8.5,
          diversificationScore: 87,
          riskScore: 45,
        });

        setPerformanceMetrics({
          ytdReturn: 23.4,
          sharpeRatio: 1.8,
          maxDrawdown: -8.2,
          volatility: 18.7,
        });

        setMarketOpportunities([
          {
            type: "Real Estate Pool",
            apy: 12.5,
            risk: "Low",
            minInvestment: 10000,
            category: "lending",
          },
          {
            type: "Art Investment Fund",
            apy: 28.3,
            risk: "High",
            minInvestment: 25000,
            category: "alternative",
          },
          {
            type: "Cross-Chain Arbitrage",
            apy: 15.7,
            risk: "Medium",
            minInvestment: 5000,
            category: "trading",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch investor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestorData();
  }, [lendingActor, marketplaceActor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const getInvestorTier = (reputationScore: number, bridgeHistory: number) => {
    if (reputationScore >= 90 && bridgeHistory >= 20)
      return { tier: "Elite Investor", color: "text-purple-400" };
    if (reputationScore >= 80 && bridgeHistory >= 10)
      return { tier: "Pro Investor", color: "text-blue-400" };
    if (reputationScore >= 70 && bridgeHistory >= 5)
      return { tier: "Active Investor", color: "text-green-400" };
    return { tier: "Growing Investor", color: "text-gray-400" };
  };

  const investorTier = getInvestorTier(
    userActivity.reputationScore,
    userActivity.bridgeHistory,
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-400">
          Loading investment dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Investor Hero */}
      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-4 flex items-center">
              <span className="mr-3 text-4xl">💎</span>
              <h1 className="text-3xl font-bold text-white">
                Investment Portfolio
              </h1>
            </div>
            <p className="mb-4 text-xl text-gray-300">
              Diversify across chains and asset classes with verified
              opportunities
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${investorTier.color}`}>
                  {investorTier.tier}
                </div>
                <div className="text-sm text-gray-400">Investment Tier</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(portfolioData?.totalValue || 0)}
                </div>
                <div className="text-sm text-gray-400">Portfolio Value</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/lending">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Explore Opportunities
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Alternative Assets
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">
            {formatCurrency(portfolioData?.totalValue || 0)}
          </div>
          <div className="text-sm text-gray-400">Total Value</div>
          <div
            className={`mt-1 text-xs ${
              portfolioData?.monthlyGrowth > 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {formatPercentage(portfolioData?.monthlyGrowth || 0)} MTD
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatPercentage(performanceMetrics?.ytdReturn || 0)}
          </div>
          <div className="text-sm text-gray-400">YTD Return</div>
          <div className="mt-1 text-xs text-gray-500">vs 12% S&P</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {portfolioData?.diversificationScore || 0}
          </div>
          <div className="text-sm text-gray-400">Diversification</div>
          <div className="mt-1 text-xs text-gray-500">Score / 100</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {performanceMetrics?.sharpeRatio?.toFixed(1) || "0.0"}
          </div>
          <div className="text-sm text-gray-400">Sharpe Ratio</div>
          <div className="mt-1 text-xs text-gray-500">Risk-adjusted</div>
        </Card>
      </div>

      {/* Portfolio Allocation */}
      <Card title="Portfolio Allocation">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="font-medium text-white">By Asset Class</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Real Estate Lending</span>
                <span className="text-white">35%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: "35%" }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Art & Collectibles</span>
                <span className="text-white">25%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: "25%" }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cross-Chain DeFi</span>
                <span className="text-white">20%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: "20%" }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Liquid Staking</span>
                <span className="text-white">20%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: "20%" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white">By Blockchain</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">∞</span>
                  <span className="text-gray-400">Internet Computer</span>
                </div>
                <span className="text-white">40%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: "40%" }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">Ξ</span>
                  <span className="text-gray-400">Ethereum</span>
                </div>
                <span className="text-white">30%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: "30%" }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">₿</span>
                  <span className="text-gray-400">Bitcoin</span>
                </div>
                <span className="text-white">20%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: "20%" }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">◎</span>
                  <span className="text-gray-400">Solana</span>
                </div>
                <span className="text-white">10%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: "10%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Investment Opportunities */}
      <Card title="Curated Investment Opportunities">
        <div className="space-y-4">
          {marketOpportunities.map((opportunity, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-600 bg-gray-800 p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="mb-1 font-medium text-white">
                    {opportunity.type}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        opportunity.risk === "Low"
                          ? "bg-green-900/50 text-green-400"
                          : opportunity.risk === "Medium"
                            ? "bg-yellow-900/50 text-yellow-400"
                            : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {opportunity.risk} Risk
                    </span>
                    <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
                      {opportunity.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {opportunity.apy}% APY
                  </div>
                  <div className="text-xs text-gray-400">
                    Min: {formatCurrency(opportunity.minInvestment)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  AI-verified assets • Instant liquidity • Cross-chain
                  compatible
                </div>
                <Button className="bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-700">
                  Invest Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Analytics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Risk Analytics">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Portfolio Risk Score</span>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-20 rounded-full bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{ width: `${portfolioData?.riskScore || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-white">
                  {portfolioData?.riskScore || 0}/100
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Drawdown (12M)</span>
              <span className="text-red-400">
                {formatPercentage(performanceMetrics?.maxDrawdown || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Volatility (Annualized)</span>
              <span className="text-yellow-400">
                {performanceMetrics?.volatility?.toFixed(1) || 0}%
              </span>
            </div>

            <div className="mt-4 rounded border border-blue-600 bg-blue-900/30 p-3">
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-blue-400">💡</span>
                <span className="text-sm font-medium text-white">
                  AI Recommendation
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Consider increasing diversification in emerging markets. Current
                allocation shows concentration risk in traditional assets.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Performance Metrics">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded bg-gray-800 p-3 text-center">
                <div className="text-lg font-bold text-green-400">
                  {formatPercentage(performanceMetrics?.ytdReturn || 0)}
                </div>
                <div className="text-xs text-gray-400">YTD Return</div>
              </div>
              <div className="rounded bg-gray-800 p-3 text-center">
                <div className="text-lg font-bold text-blue-400">
                  {performanceMetrics?.sharpeRatio?.toFixed(2) || "0.00"}
                </div>
                <div className="text-xs text-gray-400">Sharpe Ratio</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">Monthly Performance</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Jan</span>
                <span className="text-green-400">+2.1%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Feb</span>
                <span className="text-green-400">+3.5%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Mar</span>
                <span className="text-red-400">-1.2%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Apr</span>
                <span className="text-green-400">+4.8%</span>
              </div>
            </div>

            <div className="mt-4 rounded border border-green-600 bg-green-900/30 p-3">
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-green-400">📈</span>
                <span className="text-sm font-medium text-white">
                  Outperforming
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Your portfolio is beating 78% of similar risk-adjusted
                investments in the GlobalTrust ecosystem.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InvestorDashboard;
