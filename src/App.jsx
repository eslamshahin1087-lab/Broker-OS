import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import RequireAuth from './components/RequireAuth';
import ClientsList from './pages/Clients/ClientsList';
import LeadsBoard from './pages/Leads/LeadsBoard';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/leads" element={<LeadsBoard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;