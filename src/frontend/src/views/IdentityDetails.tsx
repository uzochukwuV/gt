import { useState, useEffect } from "react";
import { Button, Card } from "../components";
import { backendService } from "../services/backendService";
import type { Identity } from "../../../declarations/backend";

interface IdentityDetailsProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

export function IdentityDetails({ onError, setLoading }: IdentityDetailsProps) {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(
    null,
  );
  const [stats, setStats] = useState<{
    total: bigint;
    verified: bigint;
  } | null>(null);

  const fetchIdentities = async () => {
    try {
      setLoading(true);
      const [identitiesData, statsData] = await Promise.all([
        backendService.getMyIdentities(),
        backendService.getIdentityStats(),
      ]);
      setIdentities(identitiesData);
      setStats(statsData);
      if (identitiesData.length > 0 && !selectedIdentity) {
        setSelectedIdentity(identitiesData[0]);
      }
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  return (
    <div className="space-y-4">
      <Card title="Identity Overview">
        {stats && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.total.toString()}
              </div>
              <div className="text-sm text-gray-400">Total Identities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.verified.toString()}
              </div>
              <div className="text-sm text-gray-400">Verified</div>
            </div>
          </div>
        )}
        <Button onClick={fetchIdentities}>Refresh Data</Button>
      </Card>

      {identities.length > 0 && (
        <Card title="My Identities">
          <div className="space-y-2">
            {identities.map((identity, index) => (
              <div
                key={identity.id}
                className={`cursor-pointer rounded border p-3 transition-colors ${
                  selectedIdentity?.id === identity.id
                    ? "border-blue-400 bg-blue-900/20"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onClick={() => setSelectedIdentity(identity)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Identity #{index + 1}</div>
                    <div className="text-sm text-gray-400">{identity.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      Reputation: {identity.reputation_score.toString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {identity.linked_wallets.length} wallets linked
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedIdentity && (
        <Card title="Identity Details">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">DID</label>
              <div className="font-mono text-sm break-all">
                {selectedIdentity.did}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Reputation Score</label>
              <div className="text-lg font-bold text-green-400">
                {selectedIdentity.reputation_score.toString()}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Credentials</label>
              <div>{selectedIdentity.credentials.length} credentials</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Linked Wallets</label>
              <div>{selectedIdentity.linked_wallets.length} wallets</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Privacy Level</label>
              <div className="capitalize">
                {
                  Object.keys(
                    selectedIdentity.privacy_settings.default_privacy_level,
                  )[0]
                }
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
