import { NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../services/AuthContext'
import { canManageFinance, canManageOperations, canManageTeam } from '../constants/roles'
import { usePlatformFeatures } from '../services/PlatformFeaturesContext'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', end: true, feature: 'dashboard' },
  { to: '/clients', label: 'العملاء', feature: 'clients' },
  { to: '/leads', label: 'Leads', feature: 'leads' },
  { to: '/opportunities', label: 'الفرص', feature: 'opportunities' },
  { to: '/quotes', label: 'عروض الأسعار', feature: 'quotes' },
  { to: '/policies', label: 'البوالص', feature: 'policies' },
  { to: '/finance', label: 'المالية', feature: 'finance' },
  { to: '/insurers', label: 'شركات التأمين', feature: 'insurers' },
  { to: '/products', label: 'المنتجات', feature: 'products' },
  { to: '/renewals', label: 'التجديدات', feature: 'renewals' },
  { to: '/claims', label: 'المطالبات', feature: 'claims' },
  { to: '/payments', label: 'المدفوعات', feature: 'payments' },
  { to: '/team', label: 'الفريق', feature: 'team' },
  { to: '/audit', label: 'التدقيق', feature: 'audit' },
  { to: '/documents', label: 'المستندات', feature: 'documents' },
]

export default function MainLayout() {
  const { profile, role, platformAdmin, logout } = useAuth()
  const { features } = usePlatformFeatures()

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
          {platformAdmin && (
            <NavLink to="/platform-admin" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              إدارة المنصة
            </NavLink>
          )}
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
        {NAV_ITEMS.filter((item) => {
          if (item.feature && features[item.feature] === false) return false
          if (item.to === '/team' || item.to === '/audit') return canManageTeam(role)
          if (item.to === '/payments') return canManageFinance(role)
          if (item.to === '/renewals' || item.to === '/claims') return canManageOperations(role)
          return true
        }).map((item) => (
          <NavLink key={item.to} to={item.to} style={navStyle} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
