import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../index';

interface BorrowerDashboardProps {
  userActivity: {
    reputationScore: number;
    hasAssets: boolean;
    hasLoans: boolean;
  };
}

const BorrowerDashboard: React.FC<BorrowerDashboardProps> = ({ userActivity }) => {
  const { lendingActor } = useAuth();
  const [lendingStats, setLendingStats] = useState<any>(null);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrowingData = async () => {
      if (!lendingActor) return;
      
      try {
        setLoading(true);
        const [stats, offers] = await Promise.all([
          lendingActor.get_lending_stats(),
          lendingActor.get_active_loan_offers(null, null)
        ]);
        
        setLendingStats(stats);
        setAvailableOffers(offers.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch borrowing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowingData();
  }, [lendingActor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMaxLoan = (reputationScore: number) => {
    if (reputationScore < 30) return 5000;
    if (reputationScore < 50) return 15000;
    if (reputationScore < 70) return 50000;
    return 100000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-400">Loading borrowing dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Borrower Hero */}
      <Card className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">💰</span>
              <h1 className="text-3xl font-bold text-white">Borrowing Hub</h1>
            </div>
            <p className="text-xl text-gray-300 mb-4">
              Access liquidity with your verified assets as collateral
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {userActivity.reputationScore.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Trust Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(calculateMaxLoan(userActivity.reputationScore))}
                </div>
                <div className="text-sm text-gray-400">Max Loan</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/verify-assets">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Upload Collateral
              </Button>
            </Link>
            <Link to="/lending">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Browse Loans
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Loan Status */}
      {userActivity.hasLoans && (
        <Card title="Your Active Loans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-900/30 border border-red-600 rounded">
              <div className="text-lg font-bold text-red-400">$45,000</div>
              <div className="text-sm text-gray-400 mb-2">Outstanding Balance</div>
              <div className="text-xs text-gray-500">Due in 180 days</div>
            </div>
            <div className="p-4 bg-blue-900/30 border border-blue-600 rounded">
              <div className="text-lg font-bold text-blue-400">8.5%</div>
              <div className="text-sm text-gray-400 mb-2">Current APR</div>
              <div className="text-xs text-gray-500">Fixed rate</div>
            </div>
            <div className="p-4 bg-green-900/30 border border-green-600 rounded">
              <div className="text-lg font-bold text-green-400">85%</div>
              <div className="text-sm text-gray-400 mb-2">Health Ratio</div>
              <div className="text-xs text-gray-500">Good standing</div>
            </div>
          </div>
        </Card>
      )}

      {/* Asset Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Collateral Requirements">
          <div className="space-y-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">Real Estate</span>
                <span className="text-green-400">Up to 80% LTV</span>
              </div>
              <div className="text-xs text-gray-400">
                Property deeds, appraisals, insurance documents required
              </div>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">Art & Collectibles</span>
                <span className="text-yellow-400">Up to 60% LTV</span>
              </div>
              <div className="text-xs text-gray-400">
                Authentication certificates, provenance, appraisal needed
              </div>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">Luxury Goods</span>
                <span className="text-orange-400">Up to 50% LTV</span>
              </div>
              <div className="text-xs text-gray-400">
                Original receipts, authenticity verification required
              </div>
            </div>
          </div>
        </Card>

        <Card title="Loan Process">
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-900/30 border border-green-600 rounded">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                1
              </div>
              <div>
                <div className="font-medium text-white">Upload Assets</div>
                <div className="text-xs text-gray-400">AI verifies authenticity</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-900/30 border border-blue-600 rounded">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                2
              </div>
              <div>
                <div className="font-medium text-white">Get Valuation</div>
                <div className="text-xs text-gray-400">Market price analysis</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-900/30 border border-purple-600 rounded">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                3
              </div>
              <div>
                <div className="font-medium text-white">Match with Lenders</div>
                <div className="text-xs text-gray-400">Best rates & terms</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Loan Offers */}
      <Card title="Best Loan Offers for You">
        {availableOffers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Matching Offers
            </h3>
            <p className="text-gray-400 mb-4">
              Upload your assets to get personalized loan offers
            </p>
            <Link to="/verify-assets">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Upload Assets
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Lender
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Max Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Interest Rate
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Term
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {availableOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-4 py-3 text-sm text-white">
                      Lender #{offer.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400">
                      {formatCurrency(offer.max_loan_amount_usd)}
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-400">
                      {offer.interest_rate.toFixed(1)}% APR
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {offer.duration_days} days
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1">
                        Apply
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BorrowerDashboard;