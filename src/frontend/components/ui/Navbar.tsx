import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { Badge } from './Badge';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, connection, connectWallet, disconnect, isLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet('plug');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Fallback to Internet Identity if Plug fails
      try {
        await connectWallet('internet-identity');
      } catch (e) {
        console.error('Failed to connect with Internet Identity:', e);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      navigate('/');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', show: true },
    { name: 'Verify Identity', path: '/verify-identity', show: !isAuthenticated },
    { name: 'Verify Property', path: '/verify-property', show: isAuthenticated },
    { name: 'Dashboard', path: '/dashboard', show: isAuthenticated },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="text-xl font-bold text-gray-900 hover:text-gray-700"
              >
                PropertyTrust
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navItems
                .filter(item => item.show)
                .map((item) => (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isCurrentPath(item.path)
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Right side - Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && connection ? (
              <div className="flex items-center space-x-3">
                {/* Connection Status */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <Badge variant="secondary" className="text-xs">
                    {connection.type === 'plug' ? 'Plug' : 'Internet Identity'}
                  </Badge>
                </div>

                {/* Principal (shortened) */}
                <Badge variant="outline" className="hidden lg:inline-flex text-xs max-w-24 truncate">
                  {connection.principal.toString().slice(0, 8)}...
                </Badge>

                {/* Disconnect Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleWalletConnect}
                disabled={isConnecting || isLoading}
                size="sm"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Simple mobile menu toggle - you could expand this
                  const mobileMenu = document.getElementById('mobile-menu');
                  if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden');
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div id="mobile-menu" className="hidden md:hidden pb-4">
          <div className="space-y-2">
            {navItems
              .filter(item => item.show)
              .map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    // Hide mobile menu after navigation
                    document.getElementById('mobile-menu')?.classList.add('hidden');
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrentPath(item.path)
                      ? 'text-black bg-gray-50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;