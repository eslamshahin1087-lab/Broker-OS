import { NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../services/AuthContext'
import { canManageTeam } from '../constants/roles'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/clients', label: 'العملاء' },
  { to: '/leads', label: 'Leads' },
  { to: '/opportunities', label: 'الفرص' },
  { to: '/quotes', label: 'عروض الأسعار' },
  { to: '/policies', label: 'البوالص' },
  { to: '/finance', label: 'المالية' },
  { to: '/insurers', label: 'شركات التأمين' },
  { to: '/products', label: 'المنتجات' },
  { to: '/team', label: 'الفريق' },
]

export default function MainLayout() {
  const { profile, role, logout } = useAuth()

  const navStyle = ({ isActive }) => ({
    color: isActive ? 'var(--primary-blue-2)' : 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: '6px 8px',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }} dir="rtl">
      <header style={{
        padding: '10px 20px',
        borderBottom: '1px solid #1A2A4A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}>
        <Logo width={100} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {profile?.email || 'Broker'}
          </span>
          <button
            type="button"
            className="btn"
            onClick={logout}
            style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            خروج
          </button>
        </div>
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
        background: 'rgba(15, 29, 49, 0.96)',
        backdropFilter: 'blur(14px)',
        padding: '9px 8px',
        borderTop: '1px solid var(--border)',
        zIndex: 20,
      }}>
        {NAV_ITEMS.filter((item) => item.to !== '/team' || canManageTeam(role)).map((item) => (
          <NavLink key={item.to} to={item.to} style={navStyle} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
