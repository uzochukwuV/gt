import { Route, Routes } from "react-router-dom";
import Dashboard from "./views/Dashboard";
import AssetVerification from "./views/AssetVerification";
import CrossChainBridge from "./views/CrossChainBridge";
import Governance from "./views/Governance";
import Lending from "./views/Lending";
import Marketplace from "./views/Marketplace";
import Landing from "./views/Landing";
import { AuthProvider } from "./context/AuthContext";
import IdentityManager from "./views/IdentityManager";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/identity" element={<IdentityManager />} />
          <Route path="/verify-assets" element={<AssetVerification />} />
          <Route path="/cross-chain-bridge" element={<CrossChainBridge />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/lending" element={<Lending />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
