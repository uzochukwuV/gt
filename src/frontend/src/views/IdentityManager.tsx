import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Card, Button } from "../components";
import type { Identity, PrivacySettings } from "../../../declarations/backend";

const IdentityManager = () => {
  const { 
    isAuthenticated, 
    connectPlug, 
    connectOisy, 
    backendActor, 
    walletType, 
    plugAvailable, 
    loading: walletLoading, 
    error: walletError 
  } = useAuth();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentities = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const userIdentities = await backendActor!.get_my_identities();
      setIdentities(userIdentities);
    } catch (err) {
      console.error("Failed to fetch identities:", err);
      setError("Could not fetch identities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchIdentities();
    }
  }, [isAuthenticated, backendActor]);

  const handleCreateIdentity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const defaultPrivacySettings: PrivacySettings = {
        default_privacy_level: { Private: null },
        public_credentials: [],
        cross_chain_visibility: [],
      };
      const newIdentityIdResult = await backendActor!.create_identity(
        [],
        [],
        defaultPrivacySettings,
      );
      if ("Ok" in newIdentityIdResult) {
        await fetchIdentities(); // Refresh the list
      } else {
        throw new Error(newIdentityIdResult.Err);
      }
    } catch (err) {
      console.error("Failed to create identity:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="rounded-lg bg-[#1b2127] p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Connect Your Wallet
          </h2>
          <p className="mb-6 text-gray-400">
            Please connect your wallet to manage your digital identities.
          </p>
          
          {/* Wallet connection errors */}
          {walletError && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {walletError}
            </div>
          )}

          <div className="space-y-4">
            {/* Plug Wallet (Primary Option) */}
            <div>
              <Button 
                onClick={connectPlug} 
                disabled={!plugAvailable || walletLoading}
                className="w-full"
              >
                {walletLoading ? "Connecting..." : "🔌 Connect with Plug Wallet"}
              </Button>
              {!plugAvailable && (
                <p className="mt-2 text-xs text-gray-500">
                  Plug wallet not detected. Please install the Plug browser extension.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="mx-4 text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Oisy Wallet (Alternative Option) */}
            <div>
              <Button 
                onClick={connectOisy} 
                disabled={walletLoading}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                Connect with Oisy Wallet
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                Alternative wallet option with Internet Identity integration.
              </p>
            </div>
          </div>

          {/* Connection status */}
          {walletLoading && (
            <div className="mt-4 text-sm text-gray-400">
              Waiting for wallet connection...
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Wallet Status Indicator */}
        <div className="rounded-lg bg-[#1b2127] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">
                Connected with {walletType === 'plug' ? '🔌 Plug' : 'Oisy'} Wallet
              </span>
            </div>
            <button
              onClick={() => { /* logout functionality will be handled by parent */ }}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Disconnect
            </button>
          </div>
        </div>

        <Card title="Your Digital Identities">
          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {identities.length}{" "}
              {identities.length === 1 ? "Identity" : "Identities"}
            </h3>
            <Button onClick={handleCreateIdentity} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Identity"}
            </Button>
          </div>

          {identities.length === 0 && !isLoading && !error ? (
            <div className="py-8 text-center text-gray-400">
              No identities found. Create your first digital identity to get
              started.
            </div>
          ) : (
            <div className="space-y-4">
              {identities.map((identity) => (
                <div key={identity.id} className="rounded-lg bg-[#283039] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Identity #{identity.id}
                      </h4>
                      <p className="text-sm text-gray-400">
                        DID: {identity.did}
                      </p>
                      <p className="text-sm text-gray-400">
                        Reputation: {identity.reputation_score}/100
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        "Verified" in identity.verification_status
                          ? "bg-green-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                    >
                      {Object.keys(identity.verification_status)[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default IdentityManager;
