import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../index';

interface NewcomerDashboardProps {
  onStartOnboarding: () => void;
}

const NewcomerDashboard: React.FC<NewcomerDashboardProps> = ({ onStartOnboarding }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Create Your Digital Identity',
      description: 'Set up your verified identity to start building trust',
      action: 'Create Identity',
      link: '/identity',
      icon: '👤',
      completed: false
    },
    {
      title: 'Upload Documents',
      description: 'Verify your credentials with AI-powered authentication',
      action: 'Upload Documents',
      link: '/verify-assets',
      icon: '📄',
      completed: false
    },
    {
      title: 'Connect Wallets',
      description: 'Link your crypto wallets to start transacting',
      action: 'Link Wallets',
      link: '/identity',
      icon: '🔗',
      completed: false
    },
    {
      title: 'Explore Features',
      description: 'Discover lending, trading, and cross-chain capabilities',
      action: 'Explore',
      link: '/marketplace',
      icon: '🚀',
      completed: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🌟</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to GlobalTrust
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            Build your cross-chain digital identity and unlock a world of verified asset trading, 
            lending, and decentralized finance opportunities.
          </p>
          <Button 
            onClick={onStartOnboarding}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Start Your Journey
          </Button>
        </div>
      </Card>

      {/* Progress Steps */}
      <Card title="Getting Started">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                index === currentStep 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="text-3xl mr-4">{step.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {step.description}
                </p>
              </div>
              <div className="ml-4">
                <Link to={step.link}>
                  <Button 
                    className={`px-6 py-2 ${
                      index === currentStep 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {step.action}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Identity & Verification" className="text-center">
          <div className="py-6">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Secure Identity
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              AI-powered document verification with 94% accuracy rate
            </p>
            <Link to="/identity">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Learn More
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Cross-Chain Trading" className="text-center">
          <div className="py-6">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Multi-Chain Assets
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Trade assets across Bitcoin, Ethereum, Solana, and ICP
            </p>
            <Link to="/marketplace">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Explore Market
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Asset-Backed Lending" className="text-center">
          <div className="py-6">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Get Liquidity
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Borrow against your verified assets with competitive rates
            </p>
            <Link to="/lending">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                View Loans
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-400">$50M+</div>
          <div className="text-sm text-gray-400">Assets Verified</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-400">10K+</div>
          <div className="text-sm text-gray-400">Users</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-400">94%</div>
          <div className="text-sm text-gray-400">AI Accuracy</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-400">4</div>
          <div className="text-sm text-gray-400">Chains</div>
        </Card>
      </div>
    </div>
  );
};

export default NewcomerDashboard;