import React, { createContext, useContext, useEffect, useState } from 'react';
import { Principal } from '@dfinity/principal';
import { authService, WalletConnection } from '../services/authService';

interface AuthContextType {
  connection: WalletConnection | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: (type: 'internet-identity' | 'plug') => Promise<void>;
  disconnect: () => Promise<void>;
  principal: Principal | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to restore previous connection
        const restored = await authService.restoreConnection();
        if (restored) {
          setConnection(authService.getCurrentConnection());
        }
      } catch (error) {
        console.error('Failed to restore connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const connectWallet = async (type: 'internet-identity' | 'plug') => {
    setIsLoading(true);
    try {
      let newConnection: WalletConnection;
      
      if (type === 'internet-identity') {
        newConnection = await authService.connectInternetIdentity();
      } else {
        newConnection = await authService.connectPlug();
      }

      setConnection(newConnection);
      authService.saveConnection();
    } catch (error) {
      console.error(`Failed to connect ${type}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      await authService.disconnect();
      setConnection(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    connection,
    isAuthenticated: connection !== null,
    isLoading,
    connectWallet,
    disconnect,
    principal: connection?.principal || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};