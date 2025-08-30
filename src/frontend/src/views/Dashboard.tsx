import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserRole } from "../hooks/useUserRole";
import Layout from "../components/Layout";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import NewcomerDashboard from "../components/dashboards/NewcomerDashboard";
import LenderDashboard from "../components/dashboards/LenderDashboard";
import BorrowerDashboard from "../components/dashboards/BorrowerDashboard";
import TraderDashboard from "../components/dashboards/TraderDashboard";
import ArtistDashboard from "../components/dashboards/ArtistDashboard";
import InvestorDashboard from "../components/dashboards/InvestorDashboard";

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const { primaryRole, userActivity, loading, getRoleConfig } = useUserRole();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    localStorage.getItem("globalTrustOnboardingCompleted") === "true",
  );

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem("globalTrustOnboardingCompleted", "true");
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  const renderRoleDashboard = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="text-xl text-gray-400">Loading dashboard...</div>
        </div>
      );
    }

    switch (primaryRole) {
      case "newcomer":
        return <NewcomerDashboard onStartOnboarding={handleStartOnboarding} />;
      case "lender":
        return <LenderDashboard userActivity={userActivity} />;
      case "borrower":
        return <BorrowerDashboard userActivity={userActivity} />;
      case "trader":
        return <TraderDashboard userActivity={userActivity} />;
      case "artist":
        return <ArtistDashboard userActivity={userActivity} />;
      case "investor":
        return <InvestorDashboard userActivity={userActivity} />;
      default:
        return <NewcomerDashboard onStartOnboarding={handleStartOnboarding} />;
    }
  };

  // Show onboarding to new users who haven't seen it
  useEffect(() => {
    if (
      isAuthenticated &&
      !loading &&
      primaryRole === "newcomer" &&
      !hasSeenOnboarding
    ) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, loading, primaryRole, hasSeenOnboarding]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-6 text-6xl">🔐</div>
            <h1 className="mb-4 text-3xl font-bold text-white">
              Welcome to GlobalTrust
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              Please connect your wallet to access your personalized dashboard
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {renderRoleDashboard()}

        {/* Onboarding Wizard */}
        <OnboardingWizard
          isOpen={showOnboarding}
          onClose={handleCloseOnboarding}
          onComplete={handleCompleteOnboarding}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
