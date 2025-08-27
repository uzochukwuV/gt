import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Card, Button } from "../components";
import type { Identity, PrivacySettings } from "../../../declarations/backend";

const IdentityManager = () => {
  const { isAuthenticated, login, backendActor } = useAuth();
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
            Please connect your Internet Identity to manage your digital
            identities.
          </p>
          <Button onClick={login}>Connect Wallet</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
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
