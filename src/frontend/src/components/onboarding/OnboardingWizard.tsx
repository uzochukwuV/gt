import { useState } from 'react';
import { Card, Button } from '../index';
import { Link } from 'react-router-dom';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action: {
    text: string;
    link?: string;
    onClick?: () => void;
  };
  skipable?: boolean;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to GlobalTrust',
      description: 'Your gateway to verified cross-chain identity and asset management',
      content: (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">🌟</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Let's Get You Started
          </h2>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            This quick tour will help you set up your digital identity and explore 
            the powerful features of our platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-900/30 rounded-lg">
              <div className="text-2xl mb-2">🔐</div>
              <div className="text-white font-medium">Secure Identity</div>
              <div className="text-gray-400">AI-powered verification</div>
            </div>
            <div className="p-4 bg-green-900/30 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-white font-medium">Asset Lending</div>
              <div className="text-gray-400">Unlock liquidity</div>
            </div>
            <div className="p-4 bg-purple-900/30 rounded-lg">
              <div className="text-2xl mb-2">🔗</div>
              <div className="text-white font-medium">Cross-Chain</div>
              <div className="text-gray-400">Multi-blockchain support</div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: 'Start Tour',
        onClick: () => setCurrentStepIndex(1)
      }
    },
    {
      id: 'identity',
      title: 'Create Your Digital Identity',
      description: 'Build trust with a verified, cross-chain identity',
      content: (
        <div className="py-6">
          <div className="flex items-start space-x-6">
            <div className="text-4xl">👤</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-3">
                Why Create an Identity?
              </h3>
              <ul className="space-y-2 text-gray-300 mb-6">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Build reputation across all blockchain networks
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Access better loan rates with verified credentials
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Secure your assets with cryptographic proofs
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  One identity works across all supported chains
                </li>
              </ul>
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-blue-400 mr-2">💡</span>
                  <span className="font-medium text-white">Pro Tip</span>
                </div>
                <p className="text-sm text-gray-300">
                  Your identity is completely self-sovereign. Only you control your data 
                  and decide what to share with whom.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: 'Create Identity',
        link: '/identity'
      },
      skipable: true
    },
    {
      id: 'verification',
      title: 'Upload & Verify Documents',
      description: 'AI-powered document verification in seconds',
      content: (
        <div className="py-6">
          <div className="flex items-start space-x-6">
            <div className="text-4xl">📄</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-3">
                AI Document Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Supported Documents</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Government IDs</li>
                    <li>• Property deeds</li>
                    <li>• Art certificates</li>
                    <li>• Academic credentials</li>
                    <li>• Financial statements</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-white mb-2">AI Features</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Tampering detection</li>
                    <li>• OCR text extraction</li>
                    <li>• Fraud scoring</li>
                    <li>• Authenticity verification</li>
                    <li>• Risk assessment</li>
                  </ul>
                </div>
              </div>
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-green-400 mr-2">🎯</span>
                  <span className="font-medium text-white">94% Accuracy Rate</span>
                </div>
                <p className="text-sm text-gray-300">
                  Our AI system has been trained on millions of documents and achieves 
                  industry-leading accuracy in fraud detection.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: 'Upload Documents',
        link: '/verify-assets'
      },
      skipable: true
    },
    {
      id: 'features',
      title: 'Explore Key Features',
      description: 'Discover what you can do with your verified identity',
      content: (
        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/lending" className="block">
              <div className="p-6 bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-600 rounded-lg hover:from-green-800/50 transition-all">
                <div className="text-3xl mb-3">🏦</div>
                <h3 className="text-lg font-semibold text-white mb-2">Asset-Backed Lending</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Borrow against your verified assets or earn by lending to others
                </p>
                <div className="text-xs text-green-400 font-medium">
                  Up to 80% LTV • Competitive rates
                </div>
              </div>
            </Link>

            <Link to="/marketplace" className="block">
              <div className="p-6 bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-600 rounded-lg hover:from-purple-800/50 transition-all">
                <div className="text-3xl mb-3">🛒</div>
                <h3 className="text-lg font-semibold text-white mb-2">Verified Marketplace</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Trade only verified, authentic assets with confidence
                </p>
                <div className="text-xs text-purple-400 font-medium">
                  AI fraud protection • Escrow service
                </div>
              </div>
            </Link>

            <Link to="/cross-chain-bridge" className="block">
              <div className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-600 rounded-lg hover:from-blue-800/50 transition-all">
                <div className="text-3xl mb-3">🌉</div>
                <h3 className="text-lg font-semibold text-white mb-2">Cross-Chain Bridge</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Move assets seamlessly between different blockchains
                </p>
                <div className="text-xs text-blue-400 font-medium">
                  4 chains supported • Low fees
                </div>
              </div>
            </Link>

            <Link to="/governance" className="block">
              <div className="p-6 bg-gradient-to-br from-yellow-900/50 to-yellow-700/30 border border-yellow-600 rounded-lg hover:from-yellow-800/50 transition-all">
                <div className="text-3xl mb-3">🗳️</div>
                <h3 className="text-lg font-semibold text-white mb-2">Governance</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Participate in platform decisions and earn rewards
                </p>
                <div className="text-xs text-yellow-400 font-medium">
                  Vote on proposals • Earn tokens
                </div>
              </div>
            </Link>
          </div>
        </div>
      ),
      action: {
        text: 'Explore Features',
        onClick: () => setCurrentStepIndex(currentStepIndex + 1)
      }
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Welcome to the GlobalTrust community',
      content: (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to GlobalTrust!
          </h2>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            You're now ready to explore our platform. Remember, you can always 
            access help and tutorials from the dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-white font-medium">Help Center</div>
              <div className="text-gray-400 text-sm">Detailed guides</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-white font-medium">Community</div>
              <div className="text-gray-400 text-sm">Join discussions</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-white font-medium">Tutorials</div>
              <div className="text-gray-400 text-sm">Step-by-step guides</div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: 'Go to Dashboard',
        onClick: onComplete
      }
    }
  ];

  const currentStep = steps[currentStepIndex];

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setCompletedSteps([...completedSteps, currentStep.id]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const skipStep = () => {
    nextStep();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1b2127] rounded-lg border border-gray-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">🌟</div>
            <div>
              <h1 className="text-xl font-bold text-white">GlobalTrust Onboarding</h1>
              <p className="text-sm text-gray-400">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-800/50">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < currentStepIndex
                      ? 'bg-green-600 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-1 mx-1 ${
                      index < currentStepIndex ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentStep.title}
            </h2>
            <p className="text-gray-400">
              {currentStep.description}
            </p>
          </div>
          
          <div className="mb-8">
            {currentStep.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-600">
          <div className="flex items-center space-x-3">
            {currentStepIndex > 0 && (
              <Button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
              >
                Previous
              </Button>
            )}
            {currentStep.skipable && (
              <Button
                onClick={skipStep}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
              >
                Skip
              </Button>
            )}
          </div>
          
          <div>
            {currentStep.action.link ? (
              <Link to={currentStep.action.link} onClick={onClose}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                  {currentStep.action.text}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={currentStep.action.onClick || nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                {currentStep.action.text}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;