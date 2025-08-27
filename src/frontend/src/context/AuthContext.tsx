import React, { createContext, useContext, useEffect, useState } from "react";
import { Actor, ActorSubclass } from "@dfinity/agent";
import { idlFactory as backendIdlFactory } from "../../../declarations/backend";
import { idlFactory as lendingIdlFactory } from "../../../declarations/lending";
import { idlFactory as marketplaceIdlFactory } from "../../../declarations/marketplace";
import { _SERVICE as BackendService } from "../../../declarations/backend/backend.did";
import { _SERVICE as LendingService } from "../../../declarations/lending/lending.did";
import { _SERVICE as MarketplaceService } from "../../../declarations/marketplace/marketplace.did";
import { useOisyWallet } from "../hooks/useOisyWallet";
import { Principal } from "@dfinity/principal";

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  backendActor: ActorSubclass<BackendService> | null;
  lendingActor: ActorSubclass<LendingService> | null;
  marketplaceActor: ActorSubclass<MarketplaceService> | null;
  principal: Principal | null;
}>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  backendActor: null,
  lendingActor: null,
  marketplaceActor: null,
  principal: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { connect, disconnect, isConnected, principal, oisySignerAgent } =
    useOisyWallet();

  const [backendActor, setBackendActor] =
    useState<ActorSubclass<BackendService> | null>(null);
  const [lendingActor, setLendingActor] =
    useState<ActorSubclass<LendingService> | null>(null);
  const [marketplaceActor, setMarketplaceActor] =
    useState<ActorSubclass<MarketplaceService> | null>(null);

  useEffect(() => {
    if (isConnected && oisySignerAgent) {
      const backend = Actor.createActor<BackendService>(backendIdlFactory, {
        agent: oisySignerAgent,
        canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
      });
      setBackendActor(backend);

      const lending = Actor.createActor<LendingService>(lendingIdlFactory, {
        agent: oisySignerAgent,
        canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
      });
      setLendingActor(lending);

      const marketplace = Actor.createActor<MarketplaceService>(
        marketplaceIdlFactory,
        {
          agent: oisySignerAgent,
          canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
        },
      );
      setMarketplaceActor(marketplace);
    } else {
      setBackendActor(null);
      setLendingActor(null);
      setMarketplaceActor(null);
    }
  }, [isConnected, oisySignerAgent]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isConnected,
        login: connect,
        logout: disconnect,
        backendActor,
        lendingActor,
        marketplaceActor,
        principal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
