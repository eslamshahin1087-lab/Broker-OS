import { NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/clients', label: 'العملاء' },
  { to: '/leads', label: 'Leads' },
  { to: '/opportunities', label: 'الفرص' },
  { to: '/policies', label: 'البوالص' },
  { to: '/finance', label: 'المالية' },
]

export default function MainLayout() {
  const navStyle = ({ isActive }) => ({
    color: isActive ? 'var(--primary-blue)' : 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }} dir="rtl">
      <header style={{ padding: '10px 20px', borderBottom: '1px solid #1A2A4A' }}>
        <Logo width={100} />
      </header>

      <main style={{ paddingBottom: '78px' }}>
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
        gap: '8px',
        overflowX: 'auto',
        background: 'var(--card-bg)',
        padding: '10px 8px',
        borderTop: '1px solid #1A2A4A',
        zIndex: 20,
      }}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} style={navStyle} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
