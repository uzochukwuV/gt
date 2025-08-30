import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const IdentityManager: React.FC = () => {
  const { 
    isAuthenticated, 
    connectPlug, 
    connectOisy, 
    logout, 
    principal, 
    walletType,
    plugAvailable,
    loading,
    error 
  } = useAuth();
  
  const [showDropdown, setShowDropdown] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 rounded-lg bg-[#283039] px-4 py-2 text-sm text-white hover:bg-[#3a4148]"
        >
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span>{walletType === 'plug' ? '🔌' : '🔐'}</span>
          <span className="hidden sm:inline">
            {principal?.toText().slice(0, 8)}...{principal?.toText().slice(-4)}
          </span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 rounded-md bg-[#1b2127] shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-600">
                Connected with {walletType === 'plug' ? 'Plug' : 'Oisy'} Wallet
              </div>
              <div className="px-4 py-2 text-xs text-gray-300 font-mono">
                {principal?.toText()}
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#283039] hover:text-red-300"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Connecting..." : "Connect Wallet"}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#1b2127] shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {error && (
              <div className="px-4 py-2 text-xs text-red-400 border-b border-gray-600">
                {error}
              </div>
            )}
            
            <button
              onClick={() => {
                connectPlug();
                setShowDropdown(false);
              }}
              disabled={!plugAvailable || loading}
              className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-[#283039] disabled:text-gray-500"
            >
              🔌 Connect with Plug
            </button>
            
            {!plugAvailable && (
              <div className="px-4 py-1 text-xs text-gray-500">
                Install Plug extension
              </div>
            )}
            
            <hr className="border-gray-600 my-1" />
            
            <button
              onClick={() => {
                connectOisy();
                setShowDropdown(false);
              }}
              disabled={loading}
              className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-[#283039]"
            >
              🔐 Connect with Oisy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityManager;
