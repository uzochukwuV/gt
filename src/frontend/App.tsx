import { Routes, Route } from 'react-router-dom';
import Navbar from './components/ui/Navbar';
import PropertyLandingModern from './views/PropertyLandingModern';
import PropertyVerification from './views/PropertyVerification';
import IdentityVerification from './views/IdentityVerification';
import PropertyDashboard from './views/PropertyDashboard';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<PropertyLandingModern />} />
        <Route path="/verify-identity" element={<IdentityVerification />} />
        <Route path="/verify-property" element={<PropertyVerification />} />
        <Route path="/dashboard" element={<PropertyDashboard />} />
      </Routes>
    </div>
  );
}

export default App;