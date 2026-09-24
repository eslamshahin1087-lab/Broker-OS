import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import AppIcon from '../components/AppIcon'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../services/AuthContext'
import { canManageFinance, canManageMedicalAnalysis, canManageOperations, canManageTeam } from '../constants/roles'
import { usePlatformFeatures } from '../services/PlatformFeaturesContext'

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', end: true, feature: 'dashboard', icon: 'dashboard', group: 'workspace', priority: 1 },
  { to: '/clients', label: 'العملاء', feature: 'clients', icon: 'clients', group: 'workspace', priority: 2 },
  { to: '/leads', label: 'العملاء المحتملون', feature: 'leads', icon: 'leads', group: 'workspace' },
  { to: '/opportunities', label: 'الفرص', feature: 'opportunities', icon: 'opportunities', group: 'workspace', priority: 3 },
  { to: '/quotes', label: 'عروض الأسعار', feature: 'quotes', icon: 'quotes', group: 'commercial', priority: 4 },
  { to: '/policies', label: 'البوالص', feature: 'policies', icon: 'policies', group: 'commercial', priority: 5 },
  { to: '/insurers', label: 'شركات التأمين', feature: 'insurers', icon: 'insurers', group: 'commercial' },
  { to: '/products', label: 'المنتجات', feature: 'products', icon: 'products', group: 'commercial' },
  { to: '/renewals', label: 'التجديدات', feature: 'renewals', icon: 'renewals', group: 'operations' },
  { to: '/claims', label: 'المطالبات', feature: 'claims', icon: 'claims', group: 'operations' },
  { to: '/medical-analysis', label: 'تحليل الاستهلاكات', feature: 'medicalAI', icon: 'medical', group: 'operations', highlight: true },
  { to: '/documents', label: 'المستندات', feature: 'documents', icon: 'documents', group: 'operations' },
  { to: '/activities', label: 'المهام والمتابعات', feature: 'activities', icon: 'activities', group: 'operations' },
  { to: '/payments', label: 'المدفوعات', feature: 'payments', icon: 'payments', group: 'finance' },
  { to: '/finance', label: 'المالية', feature: 'finance', icon: 'finance', group: 'finance' },
  { to: '/team', label: 'الفريق', feature: 'team', icon: 'team', group: 'management' },
  { to: '/audit', label: 'التدقيق', feature: 'audit', icon: 'audit', group: 'management' },
]

const GROUPS = [
  { key: 'workspace', label: 'مساحة العمل' },
  { key: 'commercial', label: 'الأعمال التجارية' },
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

function NavItem({ item, onNavigate, mobile = false }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        (mobile ? 'shell-nav-item shell-nav-item-mobile' : 'shell-nav-item') +
        (isActive ? ' active' : '') +
        (item.highlight ? ' highlight' : '')
      }
    >
      <span className="shell-nav-icon">
        <AppIcon name={item.icon} size={mobile ? 18 : 17} stroke={1.85} />
      </span>
      <span className="shell-nav-label">{item.label}</span>
      {item.highlight && <span className="shell-nav-pill">AI</span>}
    </NavLink>
  )
}

export default function MainLayout() {
  const { profile, role, platformAdmin, logout } = useAuth()
  const { features } = usePlatformFeatures()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => canSee(item, role, features))

  const primaryItems = useMemo(
    () =>
      visibleItems
        .filter((item) => item.priority)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 5),
    [visibleItems],
  )

  const activePage = useMemo(
    () =>
      [...visibleItems]
        .sort((a, b) => b.to.length - a.to.length)
        .find(
          (item) =>
            location.pathname === item.to ||
            (!item.end && location.pathname.startsWith(item.to + '/')),
        ) || NAV_ITEMS[0],
    [location.pathname, visibleItems],
  )

  const displayName =
    profile?.displayName ||
    profile?.brokerageName ||
    profile?.email ||
    'Broker'
  const initials = displayName.trim().slice(0, 1).toUpperCase()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="broker-shell" dir="rtl">
      <aside className="broker-sidebar">
        <div className="broker-sidebar-top">
          <div className="broker-brand">
            <Logo width={42} />
            <div>
              <strong>Broker OS</strong>
              <span>Insurance Operating System</span>
            </div>
          </div>

          <div className="broker-account">
            <div className="broker-account-avatar">{initials}</div>
            <div className="broker-account-copy">
              <strong>{displayName}</strong>
              <span>{profile?.jobTitle || role || 'owner'}</span>
            </div>
            <span className="broker-account-status" title="الحساب نشط" />
          </div>

          <div className="broker-theme-card">
            <ThemeToggle />
          </div>
        </div>

        <nav className="broker-sidebar-nav" aria-label="التنقل الرئيسي">
          {GROUPS.map((group) => {
            const items = visibleItems.filter((item) => item.group === group.key)
            if (!items.length) return null

            return (
              <section className="broker-nav-group" key={group.key}>
                <div className="broker-nav-heading">
                  <span>{group.label}</span>
                </div>
                <div className="broker-nav-list">
                  {items.map((item) => (
                    <NavItem item={item} key={item.to} />
                  ))}
                </div>
              </section>
            )
          })}
        </nav>

        <div className="broker-sidebar-footer">
          {platformAdmin && (
            <NavLink to="/platform-admin" className="broker-footer-link">
              <AppIcon name="shield" size={16} />
              <span>إدارة المنصة</span>
            </NavLink>
          )}
          <NavLink to="/legal" className="broker-footer-link">
            <AppIcon name="shield" size={16} />
            <span>الشروط والسياسات</span>
          </NavLink>
          <button type="button" className="broker-footer-logout" onClick={logout}>
            <AppIcon name="arrowRight" size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <div className="broker-main">
        <header className="broker-topbar">
          <div className="broker-topbar-context">
            <div className="broker-topbar-page-icon">
              <AppIcon name={activePage.icon} size={19} stroke={1.8} />
            </div>
            <div>
              <span>Broker OS</span>
              <strong>{activePage.label}</strong>
            </div>
          </div>

          <div className="broker-topbar-actions">
            <ThemeToggle compact />
            <span className="broker-role-badge">{role || 'owner'}</span>
            {platformAdmin && (
              <NavLink to="/platform-admin" className="broker-topbar-link">
                إدارة المنصة
              </NavLink>
            )}
            <button type="button" className="broker-topbar-logout" onClick={logout}>
              <AppIcon name="arrowRight" size={15} />
              <span>خروج</span>
            </button>
          </div>
        </header>

        <main className="broker-content">
          <div className="broker-mobile-context">
            <div className="broker-mobile-brand">
              <Logo width={38} />
              <div>
                <strong>{profile?.brokerageName || 'Broker OS'}</strong>
                <span>{activePage.label}</span>
              </div>
            </div>
            <div className="broker-mobile-context-actions">
              <ThemeToggle compact />
              <button
                type="button"
                className="broker-mobile-menu-trigger"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="فتح القائمة"
              >
                <AppIcon name="more" size={19} />
              </button>
            </div>
          </div>

          <Outlet />
        </main>
      </div>

      <nav className="broker-mobile-nav" aria-label="التنقل السريع">
        {primaryItems.map((item) => (
          <NavItem item={item} key={item.to} mobile />
        ))}
        <button
          type="button"
          className="shell-nav-item shell-nav-item-mobile mobile-more-trigger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="فتح جميع الوحدات"
        >
          <span className="shell-nav-icon">
            <AppIcon name="more" size={18} stroke={1.85} />
          </span>
          <span className="shell-nav-label">المزيد</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="broker-mobile-overlay" onClick={closeMobileMenu}>
          <div className="broker-mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="broker-mobile-drawer-head">
              <div>
                <span className="broker-drawer-eyebrow">Broker OS</span>
                <strong>مركز التنقل</strong>
                <small>الوحدات، الإعدادات والمظهر</small>
              </div>
              <button
                type="button"
                className="broker-drawer-close"
                onClick={closeMobileMenu}
                aria-label="إغلاق القائمة"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            <div className="broker-mobile-drawer-theme">
              <ThemeToggle />
            </div>

            <div className="broker-mobile-drawer-grid">
              {visibleItems.map((item) => (
                <NavItem item={item} key={item.to} mobile onNavigate={closeMobileMenu} />
              ))}

              {platformAdmin && (
                <NavLink
                  to="/platform-admin"
                  onClick={closeMobileMenu}
                  className="shell-nav-item shell-nav-item-mobile"
                >
                  <span className="shell-nav-icon"><AppIcon name="shield" size={18} /></span>
                  <span className="shell-nav-label">إدارة المنصة</span>
                </NavLink>
              )}

              <NavLink
                to="/legal"
                onClick={closeMobileMenu}
                className="shell-nav-item shell-nav-item-mobile"
              >
                <span className="shell-nav-icon"><AppIcon name="shield" size={18} /></span>
                <span className="shell-nav-label">الشروط والسياسات</span>
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
