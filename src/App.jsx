import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import RequireAuth from './components/RequireAuth'
import RequirePlatformAdmin from './components/RequirePlatformAdmin'
import FeatureGate from './components/FeatureGate'
import Clients from './pages/Clients.jsx'
import LeadsBoard from './pages/Leads/LeadsBoard'
import Home from './pages/Home'
import Finance from './pages/Finance'
import Opportunities from './pages/Opportunities'
import Policies from './pages/Policies'
import Team from './pages/Team'
import Insurers from './pages/Insurers'
import Products from './pages/Products'
import Quotes from './pages/Quotes'
import Renewals from './pages/Renewals'
import Claims from './pages/Claims'
import Payments from './pages/Payments'
import AuditLogs from './pages/AuditLogs'
import Documents from './pages/Documents'
import Activities from './pages/Activities'
import PlatformAdmin from './pages/PlatformAdmin'
import Organizations from './pages/Organizations'
import Login from './pages/Login'
import { PlatformFeaturesProvider } from './services/PlatformFeaturesContext'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login initialMode="login" />} />
        <Route path="/register" element={<Login initialMode="register" />} />
        <Route element={<RequireAuth />}>
          <Route element={<PlatformFeaturesProvider />}>
            <Route path="/platform-admin" element={<RequirePlatformAdmin />}>
              <Route index element={<PlatformAdmin />} />
            </Route>
            <Route path="/organizations" element={<RequirePlatformAdmin />}>
              <Route index element={<Organizations />} />
            </Route>
            <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<FeatureGate feature="clients"><Clients /></FeatureGate>} />
            <Route path="/leads" element={<FeatureGate feature="leads"><LeadsBoard /></FeatureGate>} />
            <Route path="/opportunities" element={<FeatureGate feature="opportunities"><Opportunities /></FeatureGate>} />
            <Route path="/policies" element={<FeatureGate feature="policies"><Policies /></FeatureGate>} />
            <Route path="/finance" element={<FeatureGate feature="finance"><Finance /></FeatureGate>} />
            <Route path="/team" element={<FeatureGate feature="team"><Team /></FeatureGate>} />
            <Route path="/insurers" element={<FeatureGate feature="insurers"><Insurers /></FeatureGate>} />
            <Route path="/products" element={<FeatureGate feature="products"><Products /></FeatureGate>} />
            <Route path="/quotes" element={<FeatureGate feature="quotes"><Quotes /></FeatureGate>} />
            <Route path="/renewals" element={<FeatureGate feature="renewals"><Renewals /></FeatureGate>} />
            <Route path="/claims" element={<FeatureGate feature="claims"><Claims /></FeatureGate>} />
            <Route path="/payments" element={<FeatureGate feature="payments"><Payments /></FeatureGate>} />
            <Route path="/audit" element={<FeatureGate feature="audit"><AuditLogs /></FeatureGate>} />
            <Route path="/documents" element={<FeatureGate feature="documents"><Documents /></FeatureGate>} />
            <Route path="/activities" element={<FeatureGate feature="activities"><Activities /></FeatureGate>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
