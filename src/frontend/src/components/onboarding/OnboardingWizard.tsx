import { useState } from "react";
import { Card, Button } from "../index";
import { Link } from "react-router-dom";

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

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to GlobalTrust",
      description:
        "Your gateway to verified cross-chain identity and asset management",
      content: (
        <div className="py-8 text-center">
          <div className="mb-6 text-6xl">🌟</div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Let's Get You Started
          </h2>
          <p className="mx-auto mb-6 max-w-md text-gray-300">
            This quick tour will help you set up your digital identity and
            explore the powerful features of our platform.
          </p>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="rounded-lg bg-blue-900/30 p-4">
              <div className="mb-2 text-2xl">🔐</div>
              <div className="font-medium text-white">Secure Identity</div>
              <div className="text-gray-400">AI-powered verification</div>
            </div>
            <div className="rounded-lg bg-green-900/30 p-4">
              <div className="mb-2 text-2xl">💰</div>
              <div className="font-medium text-white">Asset Lending</div>
              <div className="text-gray-400">Unlock liquidity</div>
            </div>
            <div className="rounded-lg bg-purple-900/30 p-4">
              <div className="mb-2 text-2xl">🔗</div>
              <div className="font-medium text-white">Cross-Chain</div>
              <div className="text-gray-400">Multi-blockchain support</div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: "Start Tour",
        onClick: () => setCurrentStepIndex(1),
      },
    },
    {
      id: "identity",
      title: "Create Your Digital Identity",
      description: "Build trust with a verified, cross-chain identity",
      content: (
        <div className="py-6">
          <div className="flex items-start space-x-6">
            <div className="text-4xl">👤</div>
            <div className="flex-1">
              <h3 className="mb-3 text-xl font-semibold text-white">
                Why Create an Identity?
              </h3>
              <ul className="mb-6 space-y-2 text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Build reputation across all blockchain networks
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Access better loan rates with verified credentials
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Secure your assets with cryptographic proofs
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  One identity works across all supported chains
                </li>
              </ul>
              <div className="rounded-lg border border-blue-600 bg-blue-900/30 p-4">
                <div className="mb-2 flex items-center">
                  <span className="mr-2 text-blue-400">💡</span>
                  <span className="font-medium text-white">Pro Tip</span>
                </div>
                <p className="text-sm text-gray-300">
                  Your identity is completely self-sovereign. Only you control
                  your data and decide what to share with whom.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: "Create Identity",
        link: "/identity",
      },
      skipable: true,
    },
    {
      id: "verification",
      title: "Upload & Verify Documents",
      description: "AI-powered document verification in seconds",
      content: (
        <div className="py-6">
          <div className="flex items-start space-x-6">
            <div className="text-4xl">📄</div>
            <div className="flex-1">
              <h3 className="mb-3 text-xl font-semibold text-white">
                AI Document Verification
              </h3>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-800 p-4">
                  <h4 className="mb-2 font-medium text-white">
                    Supported Documents
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Government IDs</li>
                    <li>• Property deeds</li>
                    <li>• Art certificates</li>
                    <li>• Academic credentials</li>
                    <li>• Financial statements</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-gray-800 p-4">
                  <h4 className="mb-2 font-medium text-white">AI Features</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Tampering detection</li>
                    <li>• OCR text extraction</li>
                    <li>• Fraud scoring</li>
                    <li>• Authenticity verification</li>
                    <li>• Risk assessment</li>
                  </ul>
                </div>
              </div>
              <div className="rounded-lg border border-green-600 bg-green-900/30 p-4">
                <div className="mb-2 flex items-center">
                  <span className="mr-2 text-green-400">🎯</span>
                  <span className="font-medium text-white">
                    94% Accuracy Rate
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Our AI system has been trained on millions of documents and
                  achieves industry-leading accuracy in fraud detection.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: "Upload Documents",
        link: "/verify-assets",
      },
      skipable: true,
    },
    {
      id: "features",
      title: "Explore Key Features",
      description: "Discover what you can do with your verified identity",
      content: (
        <div className="py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link to="/lending" className="block">
              <div className="rounded-lg border border-green-600 bg-gradient-to-br from-green-900/50 to-green-700/30 p-6 transition-all hover:from-green-800/50">
                <div className="mb-3 text-3xl">🏦</div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Asset-Backed Lending
                </h3>
                <p className="mb-3 text-sm text-gray-300">
                  Borrow against your verified assets or earn by lending to
                  others
                </p>
                <div className="text-xs font-medium text-green-400">
                  Up to 80% LTV • Competitive rates
                </div>
              </div>
            </Link>

            <Link to="/marketplace" className="block">
              <div className="rounded-lg border border-purple-600 bg-gradient-to-br from-purple-900/50 to-purple-700/30 p-6 transition-all hover:from-purple-800/50">
                <div className="mb-3 text-3xl">🛒</div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Verified Marketplace
                </h3>
                <p className="mb-3 text-sm text-gray-300">
                  Trade only verified, authentic assets with confidence
                </p>
                <div className="text-xs font-medium text-purple-400">
                  AI fraud protection • Escrow service
                </div>
              </div>
            </Link>

            <Link to="/cross-chain-bridge" className="block">
              <div className="rounded-lg border border-blue-600 bg-gradient-to-br from-blue-900/50 to-blue-700/30 p-6 transition-all hover:from-blue-800/50">
                <div className="mb-3 text-3xl">🌉</div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Cross-Chain Bridge
                </h3>
                <p className="mb-3 text-sm text-gray-300">
                  Move assets seamlessly between different blockchains
                </p>
                <div className="text-xs font-medium text-blue-400">
                  4 chains supported • Low fees
                </div>
              </div>
            </Link>

            <Link to="/governance" className="block">
              <div className="rounded-lg border border-yellow-600 bg-gradient-to-br from-yellow-900/50 to-yellow-700/30 p-6 transition-all hover:from-yellow-800/50">
                <div className="mb-3 text-3xl">🗳️</div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Governance
                </h3>
                <p className="mb-3 text-sm text-gray-300">
                  Participate in platform decisions and earn rewards
                </p>
                <div className="text-xs font-medium text-yellow-400">
                  Vote on proposals • Earn tokens
                </div>
              </div>
            </Link>
          </div>
        </div>
      ),
      action: {
        text: "Explore Features",
        onClick: () => setCurrentStepIndex(currentStepIndex + 1),
      },
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Welcome to the GlobalTrust community",
      content: (
        <div className="py-8 text-center">
          <div className="mb-6 text-6xl">🎉</div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Welcome to GlobalTrust!
          </h2>
          <p className="mx-auto mb-8 max-w-md text-gray-300">
            You're now ready to explore our platform. Remember, you can always
            access help and tutorials from the dashboard.
          </p>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-800 p-4">
              <div className="mb-2 text-2xl">📚</div>
              <div className="font-medium text-white">Help Center</div>
              <div className="text-sm text-gray-400">Detailed guides</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-4">
              <div className="mb-2 text-2xl">💬</div>
              <div className="font-medium text-white">Community</div>
              <div className="text-sm text-gray-400">Join discussions</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-4">
              <div className="mb-2 text-2xl">🎯</div>
              <div className="font-medium text-white">Tutorials</div>
              <div className="text-sm text-gray-400">Step-by-step guides</div>
            </div>
          </div>
        </div>
      ),
      action: {
        text: "Go to Dashboard",
        onClick: onComplete,
      },
    },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-gray-600 bg-[#1b2127]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-600 p-6">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">🌟</div>
            <div>
              <h1 className="text-xl font-bold text-white">
                GlobalTrust Onboarding
              </h1>
              <p className="text-sm text-gray-400">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800/50 px-6 py-3">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    index < currentStepIndex
                      ? "bg-green-600 text-white"
                      : index === currentStepIndex
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {index < currentStepIndex ? "✓" : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-1 h-1 w-8 ${
                      index < currentStepIndex ? "bg-green-600" : "bg-gray-600"
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
            <h2 className="mb-2 text-2xl font-bold text-white">
              {currentStep.title}
            </h2>
            <p className="text-gray-400">{currentStep.description}</p>
          </div>

          <div className="mb-8">{currentStep.content}</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-600 p-6">
          <div className="flex items-center space-x-3">
            {currentStepIndex > 0 && (
              <Button
                onClick={prevStep}
                className="bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Previous
              </Button>
            )}
            {currentStep.skipable && (
              <Button
                onClick={skipStep}
                className="bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Skip
              </Button>
            )}
          </div>

          <div>
            {currentStep.action.link ? (
              <Link to={currentStep.action.link} onClick={onClose}>
                <Button className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                  {currentStep.action.text}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={currentStep.action.onClick || nextStep}
                className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
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
