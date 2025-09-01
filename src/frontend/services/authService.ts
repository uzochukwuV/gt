import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { createActor as createBackendActor, canisterId as backendCanisterId } from "../../declarations/backend";

declare global {
  interface Window {
    ic?: {
      plug?: {
        agent: HttpAgent;
        getPrincipal: () => Promise<Principal>;
        createActor: (canisterId: string, interfaceFactory: any) => any;
        isConnected: () => Promise<boolean>;
        disconnect: () => Promise<void>;
        requestConnect: (options?: {
          whitelist?: string[];
          host?: string;
          timeout?: number;
        }) => Promise<boolean>;
      };
    };
  }
}

export interface WalletConnection {
  type: 'internet-identity' | 'plug';
  principal: Principal;
  agent: HttpAgent;
  identity?: Identity;
}

class AuthService {
  private authClient: AuthClient | null = null;
  private currentConnection: WalletConnection | null = null;

  async init() {
    this.authClient = await AuthClient.create({
      idleOptions: {
        disableIdle: true,
        disableDefaultIdleCallback: true
      }
    });
  }

  async connectInternetIdentity(): Promise<WalletConnection> {
    if (!this.authClient) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.authClient!.login({
        identityProvider: process.env.DFX_NETWORK === "local" 
          ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
          : "https://identity.ic0.app",
        onSuccess: async () => {
          const identity = this.authClient!.getIdentity();
          const principal = identity.getPrincipal();
          const agent = new HttpAgent({ 
            identity,
            host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app"
          });

          if (process.env.DFX_NETWORK === "local") {
            await agent.fetchRootKey();
          }

          const connection: WalletConnection = {
            type: 'internet-identity',
            principal,
            agent,
            identity
          };

          this.currentConnection = connection;
          resolve(connection);
        },
        onError: (error) => {
          reject(new Error(`Internet Identity login failed: ${error}`));
        }
      });
    });
  }

  async connectPlug(): Promise<WalletConnection> {
    if (!window.ic?.plug) {
      throw new Error('Plug wallet not installed. Please install Plug wallet extension.');
    }

    const whitelist = [
      process.env.CANISTER_ID_BACKEND,
      process.env.CANISTER_ID_MARKETPLACE,
      process.env.CANISTER_ID_LENDING,
      process.env.CANISTER_ID_AI_VERIFIER,
    ].filter(Boolean) as string[];

    console.log('Connecting to Plug with whitelist:', whitelist);
    console.log('Host:', process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app");

    const isConnected = await window.ic.plug.isConnected();
    console.log('Plug already connected:', isConnected);
    
    if (!isConnected) {
      try {
        const connected = await window.ic.plug.requestConnect({
          whitelist,
          host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app",
          timeout: 50000 // 50 seconds timeout
        });

        if (!connected) {
          throw new Error('Plug wallet connection denied by user');
        }
        console.log('Plug connection successful');
      } catch (error) {
        console.error('Plug connection error:', error);
        throw new Error(`Failed to connect to Plug wallet: ${error}`);
      }
    }

    const principal = await window.ic.plug.getPrincipal();
    const agent = window.ic.plug.agent;
    
    console.log('Plug wallet connected with principal:', principal.toString());

    const connection: WalletConnection = {
      type: 'plug',
      principal,
      agent
    };

    this.currentConnection = connection;
    return connection;
  }

  async disconnect() {
    if (this.currentConnection?.type === 'internet-identity' && this.authClient) {
      await this.authClient.logout();
    } else if (this.currentConnection?.type === 'plug' && window.ic?.plug) {
      await window.ic.plug.disconnect();
    }
    
    this.currentConnection = null;
    localStorage.removeItem('walletConnection');
    localStorage.removeItem('userIdentity');
    localStorage.removeItem('identityVerified');
    localStorage.removeItem('propertyVerified');
    localStorage.removeItem('propertyData');
  }

  getCurrentConnection(): WalletConnection | null {
    return this.currentConnection;
  }

  isAuthenticated(): boolean {
    return this.currentConnection !== null;
  }

  getPrincipal(): Principal | null {
    return this.currentConnection?.principal || null;
  }

  getAgent(): HttpAgent | null {
    return this.currentConnection?.agent || null;
  }

  // Create identity in backend after wallet connection
  async createUserIdentity(personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  }): Promise<string> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    try {
      // Create backend actor with connected wallet
      let backendActor;
      
      if (this.currentConnection.type === 'plug' && window.ic?.plug) {
        // Use Plug wallet's actor creation
        const { idlFactory } = await import("../../declarations/backend/backend.did.js");
        console.log('Creating Plug actor for backend canister:', backendCanisterId);
        
        try {
          backendActor = window.ic.plug.createActor(backendCanisterId!, idlFactory);
          console.log('Plug actor created successfully');
        } catch (error) {
          console.error('Failed to create Plug actor:', error);
          throw new Error(`Failed to create Plug actor: ${error}`);
        }
      } else {
        // Use standard agent with Internet Identity
        const agent = this.currentConnection.agent as any;
        
        // Ensure root key is fetched for local development
        if (process.env.DFX_NETWORK === "local") {
          try {
            await agent.fetchRootKey();
          } catch (err) {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
          }
        }
        
        backendActor = createBackendActor(backendCanisterId!, { agent });
      }

      // Create privacy settings
      const privacySettings = {
        default_privacy_level: { Private: null },
        public_credentials: [],
        cross_chain_visibility: []
      };

      // Debug: Log the backend actor to verify it has the method
      console.log('Backend actor methods:', Object.keys(backendActor));
      console.log('Has create_identity method:', typeof backendActor.create_identity === 'function');

      // Create initial credential with personal info
      const personalCredential = {
        id: `personal_${Date.now()}`,
        claims: {
          Public: [
            { claim_type: 'fullName', claim_value: personalInfo.fullName, verification_method: 'self_attested' },
            { claim_type: 'email', claim_value: personalInfo.email, verification_method: 'self_attested' },
            { claim_type: 'country', claim_value: personalInfo.country, verification_method: 'self_attested' }
          ]
        },
        status: { Active: null },
        subject: this.currentConnection.principal,
        issuer: {
          id: this.currentConnection.principal,
          name: 'Self',
          reputation_score: 1.0,
          did: []
        },
        expiration_date: [],
        proof: {
          created: BigInt(Date.now() * 1000000),
          signature: 'self_signed',
          public_key: this.currentConnection.principal.toString(),
          proof_type: { Ed25519Signature: null }
        },
        issuance_date: BigInt(Date.now() * 1000000),
        credential_type: { Government: null }
      };

      // Create identity with Internet Identity anchor if available
      const internetIdentityAnchor = this.currentConnection.type === 'internet-identity' 
        ? [BigInt(this.currentConnection.principal.toString().slice(-10))]
        : [];

      // Call create_identity with proper error handling
      console.log('Calling create_identity with:', {
        internetIdentityAnchor,
        credentials: [personalCredential],
        privacySettings
      });

      const result = await backendActor.create_identity(
        internetIdentityAnchor,
        [personalCredential],
        privacySettings
      );

      console.log('create_identity result:', result);

      if ('Err' in result) {
        throw new Error(`Failed to create identity: ${result.Err}`);
      }

      return result.Ok;
    } catch (error) {
      throw new Error(`Identity creation failed: ${error}`);
    }
  }

  // Get user identity from backend
  async getUserIdentity(): Promise<any> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    try {
      let backendActor;
      
      if (this.currentConnection.type === 'plug' && window.ic?.plug) {
        // Use Plug wallet's actor creation
        const { idlFactory } = await import("../../declarations/backend/backend.did.js");
        backendActor = window.ic.plug.createActor(backendCanisterId!, idlFactory);
      } else {
        // Use standard agent with Internet Identity
        const agent = this.currentConnection.agent as any;
        
        // Ensure root key is fetched for local development
        if (process.env.DFX_NETWORK === "local") {
          try {
            await agent.fetchRootKey();
          } catch (err) {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
          }
        }
        
        backendActor = createBackendActor(backendCanisterId!, { agent });
      }

      const identities = await backendActor.get_my_identities();
      
      if (identities.length === 0) {
        return null;
      }

      return identities[0]; // Return the first identity
    } catch (error) {
      console.error('Failed to get user identity:', error);
      return null;
    }
  }

  // Verify documents and update identity
  async verifyIdentityDocuments(documents: {
    governmentId: File;
    proofOfAddress: File;
    selfie: File;
  }): Promise<{ success: boolean; verificationId?: string; error?: string }> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    try {
      const { idlFactory } = await import("../../declarations/backend/backend.did.js");
      const backendActor = this.currentConnection.type === 'plug' && window.ic?.plug
        ? window.ic.plug.createActor(backendCanisterId!, idlFactory)
        : createBackendActor(backendCanisterId!, { agent: this.currentConnection.agent as any });

      // Upload documents
      const uploadPromises = Object.entries(documents).map(async ([type, file]) => {
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);
        
        const uploadRequest = {
          data: Array.from(fileData),
          mime_type: file.type,
          original_name: file.name,
          tags: ['identity_verification', type],
          identity_id: [], // Will be linked after identity exists
          asset_id: []
        };

        const result = await backendActor.upload_file(uploadRequest);
        if ('Err' in result) {
          throw new Error(`Failed to upload ${type}: ${result.Err}`);
        }
        return result.Ok;
      });

      await Promise.all(uploadPromises);
      
      // Create verification credential
      const verificationCredential = {
        id: `identity_verification_${Date.now()}`,
        claims: {
          Public: [
            { claim_type: 'documents_uploaded', claim_value: 'true', verification_method: 'file_upload' },
            { claim_type: 'verification_status', claim_value: 'pending', verification_method: 'ai_verification' }
          ]
        },
        status: { Active: null },
        subject: this.currentConnection.principal,
        issuer: {
          id: this.currentConnection.principal,
          name: 'PropertyTrust Platform',
          reputation_score: 1.0,
          did: []
        },
        expiration_date: [],
        proof: {
          created: BigInt(Date.now() * 1000000),
          signature: 'platform_signed',
          public_key: this.currentConnection.principal.toString(),
          proof_type: { Ed25519Signature: null }
        },
        issuance_date: BigInt(Date.now() * 1000000),
        credential_type: { Government: null }
      };

      // Get user identity to add credential
      const identities = await backendActor.get_my_identities();
      if (identities.length === 0) {
        throw new Error('No identity found. Please complete initial registration first.');
      }

      const identityId = identities[0].id;
      
      // Add verification credential
      const credentialResult = await backendActor.add_credential(identityId, verificationCredential);
      if ('Err' in credentialResult) {
        throw new Error(`Failed to add verification credential: ${credentialResult.Err}`);
      }

      return {
        success: true,
        verificationId: verificationCredential.id
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Store connection info in localStorage for persistence
  saveConnection() {
    if (this.currentConnection) {
      localStorage.setItem('walletConnection', JSON.stringify({
        type: this.currentConnection.type,
        principal: this.currentConnection.principal.toString()
      }));
    }
  }

  // Restore connection from localStorage
  async restoreConnection(): Promise<boolean> {
    const stored = localStorage.getItem('walletConnection');
    if (!stored) return false;

    try {
      const { type } = JSON.parse(stored);
      
      if (type === 'internet-identity') {
        if (!this.authClient) {
          await this.init();
        }
        
        if (await this.authClient!.isAuthenticated()) {
          const identity = this.authClient!.getIdentity();
          const principal = identity.getPrincipal();
          const agent = new HttpAgent({ 
            identity,
            host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app"
          });

          if (process.env.DFX_NETWORK === "local") {
            await agent.fetchRootKey();
          }

          this.currentConnection = {
            type: 'internet-identity',
            principal,
            agent,
            identity
          };
          return true;
        }
      } else if (type === 'plug' && window.ic?.plug) {
        const isConnected = await window.ic.plug.isConnected();
        if (isConnected) {
          const principal = await window.ic.plug.getPrincipal();
          const agent = window.ic.plug.agent;

          this.currentConnection = {
            type: 'plug',
            principal,
            agent
          };
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to restore connection:', error);
    }

    return false;
  }
}

export const authService = new AuthService();