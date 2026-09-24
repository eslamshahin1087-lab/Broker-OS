import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import RequireAuth from './components/RequireAuth'
import Clients from './pages/Clients.jsx'
import LeadsBoard from './pages/Leads/LeadsBoard'
import Home from './pages/Home'
import Finance from './pages/Finance'
import Opportunities from './pages/Opportunities'
import Policies from './pages/Policies'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/leads" element={<LeadsBoard />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/finance" element={<Finance />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
