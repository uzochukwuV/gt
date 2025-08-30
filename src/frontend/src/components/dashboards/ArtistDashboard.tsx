import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../index';

interface ArtistDashboardProps {
  userActivity: {
    fileCount: number;
    hasListings: boolean;
    reputationScore: number;
  };
}

const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ userActivity }) => {
  const { marketplaceActor, backendActor } = useAuth();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [verificationStats, setVerificationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!backendActor) return;
      
      try {
        setLoading(true);
        const userFiles = await backendActor.get_user_files();
        const artworkFiles = userFiles.filter(file => 
          file.file_type.includes('image') || file.file_type.includes('art')
        );
        
        setArtworks(artworkFiles.slice(0, 6));
        setVerificationStats({
          verified: artworkFiles.filter(f => f.verification_status === 'verified').length,
          pending: artworkFiles.filter(f => f.verification_status === 'pending').length,
          total: artworkFiles.length
        });
      } catch (error) {
        console.error('Failed to fetch artist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [backendActor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getArtistLevel = (fileCount: number, reputationScore: number) => {
    if (fileCount >= 20 && reputationScore >= 80) return { level: 'Master Artist', color: 'text-purple-400' };
    if (fileCount >= 10 && reputationScore >= 60) return { level: 'Professional', color: 'text-blue-400' };
    if (fileCount >= 5) return { level: 'Emerging Artist', color: 'text-green-400' };
    return { level: 'New Creator', color: 'text-gray-400' };
  };

  const artistLevel = getArtistLevel(userActivity.fileCount, userActivity.reputationScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-400">Loading creator studio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Artist Hero */}
      <Card className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-pink-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🎨</span>
              <h1 className="text-3xl font-bold text-white">Creator Studio</h1>
            </div>
            <p className="text-xl text-gray-300 mb-4">
              Showcase and monetize your artistic creations
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${artistLevel.color}`}>
                  {artistLevel.level}
                </div>
                <div className="text-sm text-gray-400">Artist Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">
                  {userActivity.fileCount}
                </div>
                <div className="text-sm text-gray-400">Artworks</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/verify-assets">
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                Upload Artwork
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Create Listing
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-pink-400">
            {verificationStats?.total || 0}
          </div>
          <div className="text-sm text-gray-400">Total Artworks</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-400">
            {verificationStats?.verified || 0}
          </div>
          <div className="text-sm text-gray-400">Verified</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-400">
            {formatCurrency(userActivity.hasListings ? 12500 : 0)}
          </div>
          <div className="text-sm text-gray-400">Total Earnings</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-400">94%</div>
          <div className="text-sm text-gray-400">AI Confidence</div>
        </Card>
      </div>

      {/* AI Verification Status */}
      <Card title="AI Verification Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-900/30 border border-green-600 rounded">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium text-white">Verified Authentic</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {verificationStats?.verified || 0}
            </div>
            <div className="text-xs text-gray-400">
              Ready for marketplace listing
            </div>
          </div>
          <div className="p-4 bg-yellow-900/30 border border-yellow-600 rounded">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="font-medium text-white">Under Review</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {verificationStats?.pending || 0}
            </div>
            <div className="text-xs text-gray-400">
              AI analysis in progress
            </div>
          </div>
          <div className="p-4 bg-blue-900/30 border border-blue-600 rounded">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="font-medium text-white">Confidence Score</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-1">94%</div>
            <div className="text-xs text-gray-400">
              Average authenticity rating
            </div>
          </div>
        </div>
      </Card>

      {/* Your Artworks Gallery */}
      <Card title="Your Artwork Gallery">
        {artworks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Artworks Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Upload your first piece to start building your digital portfolio
            </p>
            <Link to="/verify-assets">
              <Button className="bg-pink-600 hover:bg-pink-700 text-lg px-8 py-3">
                Upload Your First Artwork
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-4xl">🎨</div>
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-white mb-2">
                    {artwork.name || `Artwork #${artwork.id.slice(0, 6)}`}
                  </h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      artwork.verification_status === 'verified' 
                        ? 'bg-green-900/50 text-green-400' 
                        : artwork.verification_status === 'pending'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {artwork.verification_status || 'unverified'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(artwork.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Monetization Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Monetization Options">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-green-400 mr-2">💰</span>
                <span className="font-medium text-white">Direct Sales</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Sell your verified artworks directly to collectors
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Commission: 2.5%</span>
                <Button className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1">
                  List Now
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-purple-400 mr-2">🎫</span>
                <span className="font-medium text-white">NFT Minting</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Create NFTs with AI-verified authenticity certificates
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Gas: ~$5-15</span>
                <Button className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1">
                  Mint NFT
                </Button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-orange-400 mr-2">📄</span>
                <span className="font-medium text-white">Licensing</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                License your artwork for commercial use
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Revenue share</span>
                <Button className="bg-orange-600 hover:bg-orange-700 text-xs px-3 py-1">
                  Set Terms
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Creator Tools">
          <div className="space-y-4">
            <div className="p-3 bg-blue-900/30 border border-blue-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-blue-400 mr-2">🔍</span>
                <span className="text-sm font-medium text-white">Provenance Tracking</span>
              </div>
              <p className="text-xs text-gray-400">
                Immutable creation and ownership history for your artworks
              </p>
            </div>
            
            <div className="p-3 bg-green-900/30 border border-green-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-green-400 mr-2">🛡️</span>
                <span className="text-sm font-medium text-white">Copyright Protection</span>
              </div>
              <p className="text-xs text-gray-400">
                AI-powered detection of unauthorized use across the web
              </p>
            </div>
            
            <div className="p-3 bg-purple-900/30 border border-purple-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-purple-400 mr-2">📊</span>
                <span className="text-sm font-medium text-white">Market Analytics</span>
              </div>
              <p className="text-xs text-gray-400">
                Track demand and pricing trends for your artistic style
              </p>
            </div>

            <div className="p-3 bg-pink-900/30 border border-pink-600 rounded">
              <div className="flex items-center mb-2">
                <span className="text-pink-400 mr-2">👥</span>
                <span className="text-sm font-medium text-white">Community Features</span>
              </div>
              <p className="text-xs text-gray-400">
                Connect with collectors and other artists in the ecosystem
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Insights */}
      {userActivity.hasListings && (
        <Card title="Performance Insights">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-green-400 mb-2">$12.5K</div>
              <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
              <div className="text-xs text-green-400">+15% this month</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-400 mb-2">847</div>
              <div className="text-sm text-gray-400 mb-1">Profile Views</div>
              <div className="text-xs text-blue-400">+23% this week</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-purple-400 mb-2">92%</div>
              <div className="text-sm text-gray-400 mb-1">Collector Rating</div>
              <div className="text-xs text-purple-400">Excellent</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ArtistDashboard;