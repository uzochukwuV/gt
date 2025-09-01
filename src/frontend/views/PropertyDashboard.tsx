import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { propertyService, VerifiedAsset } from '../services/propertyService';
import { authService } from '../services/authService';


const PropertyDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, connection, disconnect } = useAuth();
  const [userAssets, setUserAssets] = useState<VerifiedAsset[]>([]);
  const [userIdentity, setUserIdentity] = useState<any>(null);
  const [marketplaceStats, setMarketplaceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated) {
        navigate('/verify-identity');
        return;
      }

      try {
        setIsLoading(true);

        // Load user identity
        const identity = await authService.getUserIdentity();
        if (!identity) {
          navigate('/verify-identity');
          return;
        }
        setUserIdentity(identity);

        // Load user assets
        const assets = await propertyService.getUserAssets();
        setUserAssets(assets);

        // Load marketplace stats
        const stats = await propertyService.getMarketplaceStats();
        setMarketplaceStats(stats);

        // If no assets, redirect to property verification
        if (assets.length === 0) {
          navigate('/verify-property');
          return;
        }

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, navigate]);

  const getUserName = () => {
    if (!userIdentity) return 'User';
    
    // Try to find fullName from credentials
    const personalCredential = userIdentity.credentials?.find((cred: any) => 
      cred.claims.Public && cred.claims.Public.some((claim: any) => claim.claim_type === 'fullName')
    );
    
    if (personalCredential) {
      const fullNameClaim = personalCredential.claims.Public.find((claim: any) => claim.claim_type === 'fullName');
      return fullNameClaim?.claim_value || 'User';
    }
    
    return 'User';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Dashboard</h1>
              <p className="text-gray-600">Welcome back, {getUserName()}</p>
              {connection && (
                <p className="text-xs text-gray-500">
                  Connected: {connection.type === 'plug' ? 'Plug Wallet' : 'Internet Identity'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => disconnect()}>
                Disconnect
              </Button>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Overview */}
          <div className="lg:col-span-2 space-y-6">
            {userAssets.map((asset) => {
              let metadata;
              try {
                metadata = JSON.parse(asset.metadata_uri);
              } catch {
                metadata = {};
              }

              return (
                <Card key={asset.id.toString()}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {asset.title}
                      <Badge variant="default" className={
                        asset.verification_status.Verified ? "bg-green-600" :
                        asset.verification_status.Pending ? "bg-yellow-600" : "bg-gray-600"
                      }>
                        {Object.keys(asset.verification_status)[0]}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Asset ID: {asset.id.toString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Property Address</p>
                          <p className="font-medium">{metadata.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Property Type</p>
                          <p className="font-medium capitalize">{metadata.propertyType?.replace('-', ' ') || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Estimated Value</p>
                          <p className="font-medium text-lg">
                            {Array.isArray(asset.value_usd) && asset.value_usd.length > 0 
                              ? `$${asset.value_usd[0].toLocaleString()}` 
                              : asset.value_usd ? `$${asset.value_usd.toLocaleString()}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Verification Score</p>
                          <p className="font-medium text-lg">{(asset.verification_score * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Created Date</p>
                          <p className="font-medium">
                            {new Date(Number(asset.created_at) / 1000000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Documents</p>
                          <p className="font-medium">{asset.verification_documents.length} files</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Available Services */}
            <Card>
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
                <CardDescription>
                  Services you can access with your verified property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <h3 className="font-medium mb-2">Property Lending</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Use your property as collateral for loans
                    </p>
                    <Button size="sm" className="w-full">
                      Explore Lending
                    </Button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <h3 className="font-medium mb-2">Property Marketplace</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      List your property for sale or rental
                    </p>
                    <Button size="sm" className="w-full">
                      List Property
                    </Button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <h3 className="font-medium mb-2">Property Analytics</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      View market trends and property insights
                    </p>
                    <Button size="sm" className="w-full" variant="outline">
                      View Analytics
                    </Button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <h3 className="font-medium mb-2">Insurance & Protection</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Protect your property with blockchain insurance
                    </p>
                    <Button size="sm" className="w-full" variant="outline">
                      Get Quote
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  Update Property Info
                </Button>
                <Button className="w-full" variant="outline">
                  Re-verify Property
                </Button>
                <Button className="w-full" variant="outline">
                  Download Documents
                </Button>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Identity Verified</span>
                  <Badge variant="default" className="bg-green-600">✓</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Properties</span>
                  <Badge variant="secondary">{userAssets.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Wallet Connected</span>
                  <Badge variant="default" className="bg-green-600">✓</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Principal</span>
                  <Badge variant="secondary" className="text-xs max-w-24 truncate">
                    {connection?.principal.toString().slice(0, 8)}...
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Stats */}
            {marketplaceStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Marketplace Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Assets</span>
                    <Badge variant="secondary">{marketplaceStats.totalAssets}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Listings</span>
                    <Badge variant="secondary">{marketplaceStats.activeListings}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Volume</span>
                    <Badge variant="secondary">${marketplaceStats.totalVolumeUsd.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Orders</span>
                    <Badge variant="secondary">{marketplaceStats.completedOrders}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Our support team is here to help you with any questions.
                </p>
                <Button className="w-full" variant="outline">
                  Contact Support
                </Button>
                <Button className="w-full" variant="outline">
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDashboard;