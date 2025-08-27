import { useState, useEffect } from "react";
import { Button, Card, InputField, TextArea } from "../components";
import { backendService } from "../services/backendService";
import type {
  Identity,
  VerifiableCredential,
} from "../../../declarations/backend";

interface CredentialManagerProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

export function CredentialManager({
  onError,
  setLoading,
}: CredentialManagerProps) {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>("");
  const [newCredential, setNewCredential] = useState({
    credential_type: "",
    issuer: "",
    subject: "",
    claims: "",
    proof: "",
  });

  const fetchIdentities = async () => {
    try {
      setLoading(true);
      const identitiesData = await backendService.getMyIdentities();
      setIdentities(identitiesData);
      if (identitiesData.length > 0 && !selectedIdentityId) {
        setSelectedIdentityId(identitiesData[0].id);
      }
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const addCredential = async () => {
    if (
      !selectedIdentityId ||
      !newCredential.credential_type ||
      !newCredential.issuer
    ) {
      onError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const credential: VerifiableCredential = {
        id: `cred-${Date.now()}`,
        credential_type: newCredential.credential_type as any,
        issuer: newCredential.issuer as any,
        issuance_date: BigInt(Date.now() * 1000000), // Convert to nanoseconds
        subject: newCredential.subject as any,
        claims: newCredential.claims ? [newCredential.claims] : ([] as any),
        proof: newCredential.proof as any,
        status: "Pending" as any,
        expiration_date: [],
      };

      await backendService.addCredential(selectedIdentityId, credential);

      // Reset form
      setNewCredential({
        credential_type: "",
        issuer: "",
        subject: "",
        claims: "",
        proof: "",
      });

      // Refresh identities to show the new credential
      await fetchIdentities();
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

  const selectedIdentity = identities.find(
    (id) => id.id === selectedIdentityId,
  );

  return (
    <div className="space-y-4">
      <Card title="Credential Management">
        {identities.length > 0 ? (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-400">
                Select Identity
              </label>
              <select
                value={selectedIdentityId}
                onChange={(e) => setSelectedIdentityId(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
              >
                {identities.map((identity, index) => (
                  <option key={identity.id} value={identity.id}>
                    Identity #{index + 1} ({identity.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            {selectedIdentity && (
              <Card title="Existing Credentials">
                {selectedIdentity.credentials.length > 0 ? (
                  <div className="space-y-2">
                    {selectedIdentity.credentials.map((cred) => (
                      <div
                        key={cred.id}
                        className="rounded border border-gray-600 bg-gray-800 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {cred.credential_type as any}
                            </div>
                            <div className="text-sm text-gray-400">
                              Issuer: {cred.issuer as any}
                            </div>
                            <div className="text-sm text-gray-400">
                              Subject: {cred.subject as any}
                            </div>
                          </div>
                          {/* <span className={`px-2 py-1 text-xs rounded ${
                            cred.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {cred.status === 'Active' ? 'Verified' : 'Pending'}
                          </span> */}
                        </div>
                        {cred.claims && (
                          <div className="mt-2 text-sm text-gray-300">
                            {/* Claims: {cred.claims.join(', ')} */}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-400">
                    No credentials found for this identity
                  </div>
                )}
              </Card>
            )}
          </>
        ) : (
          <div className="py-4 text-center text-gray-400">
            No identities found. Create an identity first.
          </div>
        )}
      </Card>

      {identities.length > 0 && (
        <Card title="Add New Credential">
          <div className="space-y-4">
            <InputField
              value={newCredential.credential_type}
              onChange={(e) =>
                setNewCredential({
                  ...newCredential,
                  credential_type: e.target.value,
                })
              }
              placeholder="Credential Type (e.g., Educational, Professional)"
            />
            <InputField
              value={newCredential.issuer}
              onChange={(e) =>
                setNewCredential({ ...newCredential, issuer: e.target.value })
              }
              placeholder="Issuer (e.g., University, Employer)"
            />
            <InputField
              value={newCredential.subject}
              onChange={(e) =>
                setNewCredential({ ...newCredential, subject: e.target.value })
              }
              placeholder="Subject (optional)"
            />
            <TextArea
              value={newCredential.claims}
              onChange={(e) =>
                setNewCredential({ ...newCredential, claims: e.target.value })
              }
              placeholder="Claims (comma-separated, optional)"
            />
            <InputField
              value={newCredential.proof}
              onChange={(e) =>
                setNewCredential({ ...newCredential, proof: e.target.value })
              }
              placeholder="Proof/Reference (optional)"
            />
            <Button onClick={addCredential}>Add Credential</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
