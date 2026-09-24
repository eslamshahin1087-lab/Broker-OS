import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import RequireAuth from './components/RequireAuth'
import RequirePlatformAdmin from './components/RequirePlatformAdmin'
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
import PlatformAdmin from './pages/PlatformAdmin'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/platform-admin" element={<RequirePlatformAdmin />}>
            <Route index element={<PlatformAdmin />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/leads" element={<LeadsBoard />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/team" element={<Team />} />
            <Route path="/insurers" element={<Insurers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/documents" element={<Documents />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
