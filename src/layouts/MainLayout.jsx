import { NavLink, Outlet } from 'react-router-dom';
import Logo from '../components/Logo';

export default function MainLayout() {
  const navStyle = ({ isActive }) => ({
    color: isActive ? 'var(--primary-blue)' : 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 'bold',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <header style={{ padding: '10px 20px', borderBottom: '1px solid #1A2A4A' }}>
        <Logo width={100} />
      </header>

      <main style={{ paddingBottom: '70px' }}>
        <Outlet />
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'var(--card-bg)',
        padding: '10px 0',
        borderTop: '1px solid #1A2A4A',
      }}>
        <NavLink to="/" style={navStyle} end>Home</NavLink>
        <NavLink to="/clients" style={navStyle}>Clients</NavLink>
        <NavLink to="/leads" style={navStyle}>Leads</NavLink>
      </nav>
    </div>
  );
}