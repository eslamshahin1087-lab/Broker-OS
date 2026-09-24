import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../services/AuthContext'
import { canManageFinance, canManageOperations, canManageTeam } from '../constants/roles'
import { usePlatformFeatures } from '../services/PlatformFeaturesContext'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', end: true, feature: 'dashboard', icon: '⌂', group: 'workspace' },
  { to: '/clients', label: 'العملاء', feature: 'clients', icon: '◉', group: 'workspace' },
  { to: '/leads', label: 'Leads', feature: 'leads', icon: '◎', group: 'workspace' },
  { to: '/opportunities', label: 'الفرص', feature: 'opportunities', icon: '◇', group: 'workspace' },
  { to: '/quotes', label: 'عروض الأسعار', feature: 'quotes', icon: '▣', group: 'commercial' },
  { to: '/policies', label: 'البوالص', feature: 'policies', icon: '▤', group: 'commercial' },
  { to: '/insurers', label: 'شركات التأمين', feature: 'insurers', icon: '◈', group: 'commercial' },
  { to: '/products', label: 'المنتجات', feature: 'products', icon: '◆', group: 'commercial' },
  { to: '/renewals', label: 'التجديدات', feature: 'renewals', icon: '↻', group: 'operations' },
  { to: '/claims', label: 'المطالبات', feature: 'claims', icon: '△', group: 'operations' },
  { to: '/documents', label: 'المستندات', feature: 'documents', icon: '□', group: 'operations' },
  { to: '/payments', label: 'المدفوعات', feature: 'payments', icon: '₤', group: 'finance' },
  { to: '/finance', label: 'المالية', feature: 'finance', icon: '◫', group: 'finance' },
  { to: '/team', label: 'الفريق', feature: 'team', icon: '♙', group: 'management' },
  { to: '/audit', label: 'التدقيق', feature: 'audit', icon: '⌁', group: 'management' },
]

const GROUPS = [
  { key: 'workspace', label: 'مساحة العمل' },
  { key: 'commercial', label: 'التجاري' },
  { key: 'operations', label: 'التشغيل' },
  { key: 'finance', label: 'المالية' },
  { key: 'management', label: 'الإدارة' },
]

function canSee(item, role, features) {
  if (item.feature && features[item.feature] === false) return false
  if (item.to === '/team' || item.to === '/audit') return canManageTeam(role)
  if (item.to === '/payments') return canManageFinance(role)
  if (item.to === '/renewals' || item.to === '/claims') return canManageOperations(role)
  return true
}

export default function MainLayout() {
  const { profile, role, platformAdmin, logout } = useAuth()
  const { features } = usePlatformFeatures()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => canSee(item, role, features))
  const quickItems = visibleItems.filter((item) =>
    ['/', '/clients', '/opportunities', '/policies'].includes(item.to)
  ).slice(0, 4)

  return (
    <div className="app-shell" dir="rtl">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <Logo width={118} />
          <span>Broker OS</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(profile?.email || 'B').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{profile?.email || 'Broker'}</strong>
            <span>{role || 'owner'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {GROUPS.map((group) => {
            const items = visibleItems.filter((item) => item.group === group.key)
            if (!items.length) return null

            return (
              <div className="nav-group" key={group.key}>
                <span className="nav-group-title">{group.label}</span>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          {platformAdmin && (
            <NavLink to="/platform-admin" className="sidebar-admin-link">
              <span>◆</span>
              إدارة المنصة
            </NavLink>
          )}
          <button type="button" className="sidebar-logout" onClick={logout}>
            <span>↪</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-brand">
            <Logo width={86} />
            <div>
              <strong>Broker OS</strong>
              <span>Insurance Operating System</span>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="topbar-role">{role || 'owner'}</span>
            {platformAdmin && (
              <NavLink to="/platform-admin" className="topbar-admin">
                إدارة المنصة
              </NavLink>
            )}
            <button type="button" className="topbar-logout" onClick={logout}>
              خروج
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav">
        {quickItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' active' : '')}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}

        <button
          type="button"
          className={'mobile-nav-link' + (mobileMenuOpen ? ' active' : '')}
          onClick={() => setMobileMenuOpen((value) => !value)}
        >
          <span>☰</span>
          <small>المزيد</small>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-head">
              <div>
                <span className="eyebrow">Broker OS</span>
                <h3>كل الوحدات</h3>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>إغلاق</button>
            </div>

            <div className="mobile-menu-grid">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => 'mobile-menu-item' + (isActive ? ' active' : '')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  <strong>{item.label}</strong>
                </NavLink>
              ))}

              {platformAdmin && (
                <NavLink
                  to="/platform-admin"
                  className="mobile-menu-item admin"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>◆</span>
                  <strong>إدارة المنصة</strong>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
