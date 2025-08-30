import React, { createContext, useContext, useEffect, useState } from "react";
import { Actor, ActorSubclass, Agent } from "@dfinity/agent";
import { idlFactory as backendIdlFactory } from "../../../declarations/backend";
import { idlFactory as lendingIdlFactory } from "../../../declarations/lending";
import { idlFactory as marketplaceIdlFactory } from "../../../declarations/marketplace";
import { _SERVICE as BackendService } from "../../../declarations/backend/backend.did";
import { _SERVICE as LendingService } from "../../../declarations/lending/lending.did";
import { _SERVICE as MarketplaceService } from "../../../declarations/marketplace/marketplace.did";
import { useOisyWallet } from "../hooks/useOisyWallet";
import { usePlugWallet } from "../hooks/usePlugWallet";
import { Principal } from "@dfinity/principal";

export type WalletType = "plug" | "oisy";

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  connectPlug: () => Promise<void>;
  connectOisy: () => void;
  logout: () => void;
  backendActor: ActorSubclass<BackendService> | null;
  lendingActor: ActorSubclass<LendingService> | null;
  marketplaceActor: ActorSubclass<MarketplaceService> | null;
  principal: Principal | null;
  walletType: WalletType | null;
  plugAvailable: boolean;
  loading: boolean;
  error: string | null;
}>({
  isAuthenticated: false,
  connectPlug: async () => {},
  connectOisy: () => {},
  logout: () => {},
  backendActor: null,
  lendingActor: null,
  marketplaceActor: null,
  principal: null,
  walletType: null,
  plugAvailable: false,
  loading: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Oisy wallet hook
  const {
    connect: oisyConnect,
    disconnect: oisyDisconnect,
    isConnected: oisyConnected,
    principal: oisyPrincipal,
    oisySignerAgent,
  } = useOisyWallet();

  // Plug wallet hook
  const {
    connect: plugConnect,
    disconnect: plugDisconnect,
    isConnected: plugConnected,
    isAvailable: plugAvailable,
    principal: plugPrincipal,
    agent: plugAgent,
    loading: plugLoading,
    error: plugError,
  } = usePlugWallet();

  const [backendActor, setBackendActor] =
    useState<ActorSubclass<BackendService> | null>(null);
  const [lendingActor, setLendingActor] =
    useState<ActorSubclass<LendingService> | null>(null);
  const [marketplaceActor, setMarketplaceActor] =
    useState<ActorSubclass<MarketplaceService> | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);

  // Determine which wallet is connected
  const isAuthenticated = plugConnected || oisyConnected;
  const principal = plugConnected ? plugPrincipal : oisyPrincipal;
  const agent: Agent | null = plugConnected ? plugAgent : oisySignerAgent;

  // Update wallet type when connection changes
  useEffect(() => {
    if (plugConnected) {
      setWalletType("plug");
    } else if (oisyConnected) {
      setWalletType("oisy");
    } else {
      setWalletType(null);
    }
  }, [plugConnected, oisyConnected]);

  // Create actors when agent is available
  useEffect(() => {
    if (isAuthenticated && agent) {
      const backend = Actor.createActor<BackendService>(backendIdlFactory, {
        agent,
        canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
      });
      setBackendActor(backend);

      const lending = Actor.createActor<LendingService>(lendingIdlFactory, {
        agent,
        canisterId: "br5f7-7uaaa-aaaaa-qaaca-cai",
      });
      setLendingActor(lending);

      const marketplace = Actor.createActor<MarketplaceService>(
        marketplaceIdlFactory,
        {
          agent,
          canisterId: "bw4dl-smaaa-aaaaa-qaacq-cai",
        },
      );
      setMarketplaceActor(marketplace);
    } else {
      setBackendActor(null);
      setLendingActor(null);
      setMarketplaceActor(null);
    }
  }, [isAuthenticated, agent]);

  const logout = async () => {
    if (plugConnected) {
      await plugDisconnect();
    }
    if (oisyConnected) {
      oisyDisconnect();
    }
    setWalletType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        connectPlug: plugConnect,
        connectOisy: oisyConnect,
        logout,
        backendActor,
        lendingActor,
        marketplaceActor,
        principal,
        walletType,
        plugAvailable,
        loading: plugLoading,
        error: plugError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
