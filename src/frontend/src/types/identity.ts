// Frontend types for Identity and AI Verification system
// These complement the backend Candid types with additional frontend-specific types

export interface AssetVerificationData {
  assetId: string;
  assetType:
    | "real_estate"
    | "vehicle"
    | "artwork"
    | "jewelry"
    | "collectible"
    | "other";
  description: string;
  value?: number;
  location?: string;
  documents?: File[];
  metadata?: Record<string, any>;
}

export interface VerificationProgressStep {
  step: number;
  title: string;
  description: string;
  status: "completed" | "current" | "pending" | "error";
  timestamp?: Date;
}

export interface AIVerificationSummary {
  requestId: string;
  status: string;
  fraudScore?: number;
  confidenceLevel?: number;
  humanReviewRequired: boolean;
  processedAt?: Date;
  completedAt?: Date;
  recommendations: string[];
}

export interface IdentityDashboardData {
  identity: {
    id: string;
    owner: string;
    did: string;
    verificationStatus: string;
    reputationScore: number;
    createdAt: Date;
    lastActivity: Date;
  };
  linkedAssets: Array<{
    id: string;
    type: string;
    verificationStatus?: string;
    fraudScore?: number;
  }>;
  linkedWallets: Array<{
    chainType: string;
    address: string;
    verificationStatus: string;
    linkedAt: Date;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  complianceStatus: {
    kycLevel: string;
    amlStatus: string;
    sanctionsCheck: string;
  };
  riskAssessment: {
    overallRiskScore: number;
    fraudRisk: number;
    complianceRisk: number;
    operationalRisk: number;
  };
}

export interface WalletConnection {
  address: string;
  chainType: "Bitcoin" | "Ethereum" | "Solana" | "ICP";
  connected: boolean;
  balance?: string;
  provider?: any;
}

export interface AssetFormData {
  type: string;
  description: string;
  value: string;
  location: string;
  additionalInfo: Record<string, any>;
  documents: File[];
}

export interface VerificationFormData extends AssetFormData {
  identityId: string;
  assetId: string;
  requestAIVerification: boolean;
}

// Risk level indicators for UI display
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskIndicator {
  level: RiskLevel;
  score: number;
  label: string;
  color: string;
  description: string;
}

// Helper functions for frontend display
export const getRiskLevel = (score: number): RiskLevel => {
  if (score < 0.3) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "critical";
};

export const getRiskIndicator = (score: number): RiskIndicator => {
  const level = getRiskLevel(score);

  const indicators: Record<RiskLevel, RiskIndicator> = {
    low: {
      level: "low",
      score,
      label: "Low Risk",
      color: "text-green-600",
      description: "Asset appears legitimate with minimal risk factors",
    },
    medium: {
      level: "medium",
      score,
      label: "Medium Risk",
      color: "text-yellow-600",
      description: "Some risk factors detected, requires attention",
    },
    high: {
      level: "high",
      score,
      label: "High Risk",
      color: "text-orange-600",
      description: "Multiple risk factors detected, manual review recommended",
    },
    critical: {
      level: "critical",
      score,
      label: "Critical Risk",
      color: "text-red-600",
      description: "High fraud risk, immediate manual review required",
    },
  };

  return indicators[level];
};

export const getVerificationStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Pending: "text-gray-500",
    Processing: "text-blue-500",
    Completed: "text-green-500",
    Failed: "text-red-500",
    Verified: "text-green-600",
    Rejected: "text-red-600",
    Suspended: "text-orange-600",
  };

  return colors[status] || "text-gray-500";
};

export const formatReputationScore = (score: number): string => {
  return `${Math.round(score)}/100`;
};

export const formatTimestamp = (timestamp: bigint | number): string => {
  const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

// Asset type configurations
export const ASSET_TYPES = [
  { value: "real_estate", label: "Real Estate", icon: "🏠" },
  { value: "vehicle", label: "Vehicle", icon: "🚗" },
  { value: "artwork", label: "Artwork", icon: "🎨" },
  { value: "jewelry", label: "Jewelry", icon: "💎" },
  { value: "collectible", label: "Collectible", icon: "🏺" },
  { value: "other", label: "Other", icon: "📄" },
];

export const CHAIN_TYPES = [
  { value: "Bitcoin", label: "Bitcoin", icon: "₿" },
  { value: "Ethereum", label: "Ethereum", icon: "Ξ" },
  { value: "Solana", label: "Solana", icon: "◎" },
  { value: "ICP", label: "Internet Computer", icon: "∞" },
];
