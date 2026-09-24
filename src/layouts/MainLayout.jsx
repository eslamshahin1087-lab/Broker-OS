import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import AppIcon from '../components/AppIcon'
import { useAuth } from '../services/AuthContext'
import { canManageFinance, canManageMedicalAnalysis, canManageOperations, canManageTeam } from '../constants/roles'
import { usePlatformFeatures } from '../services/PlatformFeaturesContext'
import { useTheme } from '../services/ThemeContext'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', end: true, feature: 'dashboard', icon: 'dashboard', group: 'workspace' },
  { to: '/clients', label: 'العملاء', feature: 'clients', icon: 'clients', group: 'workspace' },
  { to: '/leads', label: 'Leads', feature: 'leads', icon: 'leads', group: 'workspace' },
  { to: '/opportunities', label: 'الفرص', feature: 'opportunities', icon: 'opportunities', group: 'workspace' },
  { to: '/quotes', label: 'عروض الأسعار', feature: 'quotes', icon: 'quotes', group: 'commercial' },
  { to: '/policies', label: 'البوالص', feature: 'policies', icon: 'policies', group: 'commercial' },
  { to: '/insurers', label: 'شركات التأمين', feature: 'insurers', icon: 'insurers', group: 'commercial' },
  { to: '/products', label: 'المنتجات', feature: 'products', icon: 'products', group: 'commercial' },
  { to: '/renewals', label: 'التجديدات', feature: 'renewals', icon: 'renewals', group: 'operations' },
  { to: '/claims', label: 'المطالبات', feature: 'claims', icon: 'claims', group: 'operations' },
  { to: '/documents', label: 'المستندات', feature: 'documents', icon: 'documents', group: 'operations' },
  { to: '/activities', label: 'المهام والمتابعات', feature: 'activities', icon: 'activities', group: 'operations' },
  { to: '/medical-analysis', label: 'تحليل الاستهلاكات', feature: 'medicalAI', icon: 'medical', group: 'operations' },
  { to: '/payments', label: 'المدفوعات', feature: 'payments', icon: 'payments', group: 'finance' },
  { to: '/finance', label: 'المالية', feature: 'finance', icon: 'finance', group: 'finance' },
  { to: '/team', label: 'الفريق', feature: 'team', icon: 'team', group: 'management' },
  { to: '/audit', label: 'التدقيق', feature: 'audit', icon: 'audit', group: 'management' },
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
  if (item.to === '/medical-analysis') return canManageMedicalAnalysis(role)
  return true
}

export default function MainLayout() {
  const { profile, role, platformAdmin, logout } = useAuth()
  const { features } = usePlatformFeatures()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => canSee(item, role, features))
  const quickOrder = ['/', '/clients', '/opportunities', '/medical-analysis', '/policies']
  const quickItems = quickOrder
    .map((to) => visibleItems.find((item) => item.to === to))
    .filter(Boolean)
    .slice(0, 5)

  const activePage = [...visibleItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname === item.to || (!item.end && location.pathname.startsWith(item.to + '/'))) || NAV_ITEMS[0]

  const displayName = profile?.displayName || profile?.brokerageName || profile?.email || 'Broker'
  const initials = displayName.trim().slice(0, 1).toUpperCase()

  return (
    <div className="app-shell" dir="rtl">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <Logo width={118} />
          <span>Broker OS</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{profile?.jobTitle || role || 'owner'}</span>
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
                    <span className="sidebar-link-icon"><AppIcon name={item.icon} size={15} /></span>
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
              <span><AppIcon name="products" size={15} /></span>
              إدارة المنصة
            </NavLink>
          )}
          <NavLink to="/legal" className="sidebar-admin-link legal-link">
            <span><AppIcon name="shield" size={15} /></span>
            الشروط والسياسات
          </NavLink>
          <button type="button" className="sidebar-logout" onClick={logout}>
            <span><AppIcon name="next" size={15} /></span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-brand">
            <Logo width={86} />
            <div>
              <strong>{profile?.brokerageName || 'Broker OS'}</strong>
              <span>Insurance Operating System</span>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="topbar-page-context">{activePage.label}</span>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              <AppIcon name={isDark ? 'sun' : 'moon'} size={16} stroke={1.9} />
              <span>{isDark ? 'فاتح' : 'داكن'}</span>
            </button>
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
          <div className="mobile-app-header">
            <div className="mobile-app-brand">
              <Logo width={68} />
              <div className="mobile-app-brand-copy">
                <strong>{profile?.brokerageName || 'Broker OS'}</strong>
                <span>Broker OS</span>
              </div>
            </div>
            <div className="mobile-app-page">
              <div className="mobile-app-header-icon">
                <AppIcon name={activePage.icon} size={19} stroke={1.9} />
              </div>
              <div className="mobile-app-header-copy">
                <strong>{activePage.label}</strong>
              </div>
            </div>
            <button type="button" className="mobile-app-avatar" onClick={() => setMobileMenuOpen(true)} aria-label="فتح قائمة الحساب">
              {initials}
            </button>
          </div>

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
            <span className="mobile-nav-icon"><AppIcon name={item.icon} size={19} stroke={1.9} /></span>
            <small>{item.label}</small>
          </NavLink>
        ))}
        <button
          type="button"
          className="mobile-nav-link mobile-more-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="فتح باقي الوحدات"
        >
          <span className="mobile-nav-icon"><AppIcon name="more" size={19} stroke={1.9} /></span>
          <small>المزيد</small>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-head">
              <div>
                <span className="eyebrow">Broker OS</span>
                <h3>مركز التنقل</h3>
                <small>كل الوحدات والإعدادات في مكان واحد</small>
              </div>
              <div className="mobile-menu-head-actions">
                <button
                  type="button"
                  className="theme-toggle compact"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
                >
                  <AppIcon name={isDark ? 'sun' : 'moon'} size={15} />
                  <span>{isDark ? 'فاتح' : 'داكن'}</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>إغلاق</button>
              </div>
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
                  <span><AppIcon name={item.icon} size={16} /></span>
                  <strong>{item.label}</strong>
                </NavLink>
              ))}

              {platformAdmin && (
                <NavLink
                  to="/platform-admin"
                  className="mobile-menu-item admin"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span><AppIcon name="products" size={16} /></span>
                  <strong>إدارة المنصة</strong>
                </NavLink>
              )}
              <NavLink
                to="/legal"
                className="mobile-menu-item legal-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span><AppIcon name="shield" size={16} /></span>
                <strong>الشروط والسياسات</strong>
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
