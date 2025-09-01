import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

interface IdentityStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const IdentityVerification = () => {
  const navigate = useNavigate();
  const { isAuthenticated, connectWallet, connection, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });
  const [documents, setDocuments] = useState({
    governmentId: null as File | null,
    proofOfAddress: null as File | null,
    selfie: null as File | null
  });
  const [, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // If user is authenticated, skip wallet connection step
    if (isAuthenticated && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [isAuthenticated, currentStep]);

  const steps: IdentityStep[] = [
    {
      id: 'wallet-connect',
      title: 'Connect Wallet',
      description: 'Connect your wallet to get started',
      completed: isAuthenticated
    },
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Provide your basic personal details',
      completed: false
    },
    {
      id: 'document-upload',
      title: 'Document Upload',
      description: 'Upload required identification documents',
      completed: false
    },
    {
      id: 'verification',
      title: 'Identity Verification',
      description: 'AI-powered identity verification',
      completed: false
    },
    {
      id: 'completion',
      title: 'Completion',
      description: 'Identity verification complete',
      completed: false
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleWalletConnect = async (walletType: 'internet-identity' | 'plug') => {
    setIsProcessing(true);
    setError('');
    try {
      await connectWallet(walletType);
      setCurrentStep(1);
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (personalInfo.fullName && personalInfo.email && personalInfo.phone && personalInfo.address) {
      setIsProcessing(true);
      setError('');
      try {
        // Create identity in backend with personal info
        const identityId = await authService.createUserIdentity(personalInfo);
        localStorage.setItem('userIdentityId', identityId);
        localStorage.setItem('userIdentity', JSON.stringify(personalInfo));
        setCurrentStep(2);
      } catch (error: any) {
        setError(error.message || 'Failed to create identity');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFileUpload = (type: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const handleDocumentSubmit = async () => {
    if (documents.governmentId && documents.proofOfAddress && documents.selfie) {
      setIsProcessing(true);
      setError('');
      setCurrentStep(3);
      
      try {
        // Upload documents and create verification credential
        const result = await authService.verifyIdentityDocuments({
          governmentId: documents.governmentId!,
          proofOfAddress: documents.proofOfAddress!,
          selfie: documents.selfie!
        });

        if (result.success) {
          // Simulate AI verification time
          setTimeout(() => {
            setVerificationStatus('verified');
            setCurrentStep(4);
            setIsProcessing(false);
          }, 3000);
        } else {
          throw new Error(result.error || 'Verification failed');
        }
      } catch (error: any) {
        setError(error.message || 'Document verification failed');
        setCurrentStep(2); // Go back to document upload
        setIsProcessing(false);
      }
    }
  };

  const handleComplete = () => {
    localStorage.setItem('identityVerified', 'true');
    localStorage.setItem('userIdentity', JSON.stringify(personalInfo));
    navigate('/verify-property');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
          <p className="mt-2 text-gray-600">Secure your account with verified identity</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Steps Overview */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="text-center">
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <p className="text-xs text-gray-600 hidden sm:block">{step.title}</p>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep]?.title}</CardTitle>
            <CardDescription>{steps[currentStep]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Choose your wallet</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your wallet to start the identity verification process
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <h4 className="font-medium mb-2">Internet Identity</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Secure authentication with Internet Computer
                      </p>
                      <Button 
                        onClick={() => handleWalletConnect('internet-identity')}
                        disabled={isProcessing || isLoading}
                        className="w-full"
                      >
                        {isProcessing ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="font-medium mb-2">Plug Wallet</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Connect with your Plug browser extension
                      </p>
                      <Button 
                        onClick={() => handleWalletConnect('plug')}
                        disabled={isProcessing || isLoading}
                        className="w-full"
                      >
                        {isProcessing ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </div>

                {connection && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-800">
                        Connected with {connection.type === 'plug' ? 'Plug Wallet' : 'Internet Identity'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      value={personalInfo.fullName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <Input
                      value={personalInfo.country}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="United States"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <Input
                      value={personalInfo.city}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <Input
                      value={personalInfo.zipCode}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="10001"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Continue to Document Upload
                </Button>
              </form>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Government-issued ID
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload('governmentId')}
                      className="hidden"
                      id="government-id"
                    />
                    <label htmlFor="government-id" className="cursor-pointer">
                      <div className="text-gray-600">
                        <p className="text-sm">Upload your driver's license, passport, or national ID</p>
                        {documents.governmentId && (
                          <Badge variant="secondary" className="mt-2">
                            {documents.governmentId.name}
                          </Badge>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof of Address
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload('proofOfAddress')}
                      className="hidden"
                      id="proof-address"
                    />
                    <label htmlFor="proof-address" className="cursor-pointer">
                      <div className="text-gray-600">
                        <p className="text-sm">Upload utility bill, bank statement, or lease agreement</p>
                        {documents.proofOfAddress && (
                          <Badge variant="secondary" className="mt-2">
                            {documents.proofOfAddress.name}
                          </Badge>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selfie with ID
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload('selfie')}
                      className="hidden"
                      id="selfie"
                    />
                    <label htmlFor="selfie" className="cursor-pointer">
                      <div className="text-gray-600">
                        <p className="text-sm">Take a photo of yourself holding your ID</p>
                        {documents.selfie && (
                          <Badge variant="secondary" className="mt-2">
                            {documents.selfie.name}
                          </Badge>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleDocumentSubmit}
                  className="w-full"
                  disabled={!documents.governmentId || !documents.proofOfAddress || !documents.selfie}
                >
                  Submit Documents for Verification
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                <h3 className="text-lg font-medium">Verifying Your Identity</h3>
                <p className="text-gray-600">
                  Our AI system is analyzing your documents and verifying your identity. This usually takes 1-3 minutes.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-left">
                  <h4 className="font-medium text-blue-900">What we're checking:</h4>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• Document authenticity and validity</li>
                    <li>• Photo matching and liveness detection</li>
                    <li>• Address verification</li>
                    <li>• Identity cross-referencing</li>
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-900">Identity Verified Successfully!</h3>
                <p className="text-gray-600">
                  Your identity has been verified. You can now proceed to property verification.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800">Verification Score:</span>
                    <Badge variant="default" className="bg-green-600">98.5%</Badge>
                  </div>
                </div>
                <Button onClick={handleComplete} className="w-full">
                  Continue to Property Verification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            disabled={currentStep === 3}
          >
            Back to Home
          </Button>
          {currentStep > 0 && currentStep < 3 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isProcessing}
            >
              Previous Step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityVerification;