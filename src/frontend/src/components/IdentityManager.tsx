import React from "react";
import { useAuth } from "../context/AuthContext";

const IdentityManager: React.FC = () => {
  const { isAuthenticated, login, logout, principal } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {principal?.toText()}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Login with Oisy</button>
      )}
    </div>
  );
};

export default IdentityManager;
