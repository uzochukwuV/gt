import { useState, useEffect, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import { HttpAgent } from "@dfinity/agent";

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (options?: {
          whitelist?: string[];
          host?: string;
          timeout?: number;
        }) => Promise<any>;
        isConnected: () => Promise<boolean>;
        disconnect: () => Promise<void>;
        agent: HttpAgent;
        principalId: string;
        accountId: string;
        isWalletLocked: boolean;
        onExternalDisconnect: (callback: () => void) => void;
        onLockStateChange: (callback: (isLocked: boolean) => void) => void;
      };
    };
  }
}

interface UsePlugWalletReturn {
  isConnected: boolean;
  isAvailable: boolean;
  principal: Principal | null;
  accountId: string | null;
  agent: HttpAgent | null;
  isWalletLocked: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const usePlugWallet = (): UsePlugWalletReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [agent, setAgent] = useState<HttpAgent | null>(null);
  const [isWalletLocked, setIsWalletLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Plug is available
  const isAvailable = typeof window !== "undefined" && !!window.ic?.plug;

  // Canister whitelist for this app
  const whitelist = [
    process.env.CANISTER_ID_BACKEND || "bd3sg-teaaa-aaaaa-qaaba-cai",
    process.env.CANISTER_ID_LENDING || "br5f7-7uaaa-aaaaa-qaaca-cai",
    process.env.CANISTER_ID_MARKETPLACE || "bw4dl-smaaa-aaaaa-qaacq-cai",
    process.env.CANISTER_ID_AI_VERIFIER || "bkyz2-fmaaa-aaaaa-qaaaq-cai",
  ];

  const host =
    process.env.DFX_NETWORK === "local"
      ? "http://127.0.0.1:4943"
      : "https://icp0.io";

  const updateConnectionState = useCallback(async () => {
    if (!isAvailable) return;

    const plug = window.ic!.plug!;
    const agent = plug.agent || null;

    // For local development, ensure root key is fetched
    if (agent && process.env.DFX_NETWORK === "local") {
      try {
        await agent.fetchRootKey();
      } catch (error) {
        console.warn("Failed to fetch root key for local development:", error);
      }
    }

    setAgent(agent);
    setIsWalletLocked(plug.isWalletLocked || false);

    if (plug.principalId) {
      setPrincipal(Principal.fromText(plug.principalId));
      setAccountId(plug.accountId || null);
    } else {
      setPrincipal(null);
      setAccountId(null);
    }
  }, [isAvailable]);

  const connect = useCallback(async () => {
    if (!isAvailable) {
      setError("Plug wallet is not available. Please install Plug extension.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.ic!.plug!.requestConnect({
        whitelist,
        host,
        timeout: 50000,
      });

      console.log("Connected to Plug:", result);
      setIsConnected(true);
      await updateConnectionState();
    } catch (err) {
      console.error("Failed to connect to Plug:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to Plug wallet",
      );
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [isAvailable, updateConnectionState]);

  const disconnect = useCallback(async () => {
    if (!isAvailable) return;

    setLoading(true);
    setError(null);

    try {
      await window.ic!.plug!.disconnect();
      setIsConnected(false);
      setPrincipal(null);
      setAccountId(null);
      setAgent(null);
    } catch (err) {
      console.error("Failed to disconnect from Plug:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to disconnect from Plug wallet",
      );
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  const checkConnection = useCallback(async () => {
    if (!isAvailable) return;

    try {
      const connected = await window.ic!.plug!.isConnected();
      setIsConnected(connected);

      if (connected) {
        await updateConnectionState();
      } else {
        setPrincipal(null);
        setAccountId(null);
        setAgent(null);
      }
    } catch (err) {
      console.error("Failed to check Plug connection:", err);
      setIsConnected(false);
    }
  }, [isAvailable, updateConnectionState]);

  useEffect(() => {
    if (!isAvailable) return;

    // Check initial connection state
    checkConnection();

    // Set up event listeners
    const plug = window.ic!.plug!;

    const handleExternalDisconnect = () => {
      setIsConnected(false);
      setPrincipal(null);
      setAccountId(null);
      setAgent(null);
    };

    const handleLockStateChange = (locked: boolean) => {
      setIsWalletLocked(locked);
    };

    plug.onExternalDisconnect(handleExternalDisconnect);
    plug.onLockStateChange(handleLockStateChange);

    // Clean up listeners on unmount
    return () => {
      // Note: Plug doesn't provide a way to remove listeners
    };
  }, [isAvailable, checkConnection]);

  // Persist connection on page load/refresh
  useEffect(() => {
    if (!isAvailable) return;

    const verifyConnection = async () => {
      const connected = await window.ic!.plug!.isConnected();
      if (connected) {
        await updateConnectionState();
        setIsConnected(true);
      }
    };

    verifyConnection();
  }, [isAvailable, updateConnectionState]);

  return {
    isConnected,
    isAvailable,
    principal,
    accountId,
    agent,
    isWalletLocked,
    connect,
    disconnect,
    loading,
    error,
  };
};
