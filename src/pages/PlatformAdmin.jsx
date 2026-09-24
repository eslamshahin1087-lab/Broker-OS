import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_PLATFORM_FEATURES,
  listenToPlatformAuditLogs,
  listenToPlatformFeatures,
  listenToPlatformSettings,
  listenToPlatformUsers,
  savePlatformFeature,
  savePlatformSettings,
  seedDefaultPlatformFeatures,
  updatePlatformUser,
  writePlatformAudit,
} from '../services/platformAdmin'
import { useAuth } from '../services/AuthContext'

const USER_STATUSES = ['active', 'suspended']
const USER_ROLES = ['owner', 'admin', 'sales', 'operations', 'finance']

const emptyFeature = { key: '', label: '', description: '', enabled: true }

export default function PlatformAdmin() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [features, setFeatures] = useState([])
  const [settings, setSettings] = useState({})
  const [auditLogs, setAuditLogs] = useState([])
  const [featureForm, setFeatureForm] = useState(emptyFeature)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [error, setError] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    const cleanups = [
      listenToPlatformUsers(setUsers, (err) => {
        console.error(err)
        setError('تعذر تحميل المستخدمين')
      }),
      listenToPlatformFeatures(setFeatures, (err) => {
        console.error(err)
        setError('تعذر تحميل المزايا')
      }),
      listenToPlatformSettings(setSettings, (err) => {
        console.error(err)
        setError('تعذر تحميل إعدادات المنصة')
      }),
      listenToPlatformAuditLogs(setAuditLogs, (err) => {
        console.error(err)
        setError('تعذر تحميل سجل الإدارة')
      }),
    ]

    return () => cleanups.forEach((unsubscribe) => unsubscribe?.())
  }, [])

  const organizations = useMemo(() => {
    const map = new Map()

    users.forEach((item) => {
      const key = item.organizationId || item.id
      if (!map.has(key)) {
        map.set(key, { id: key, users: 0, active: 0, owners: 0 })
      }
      const row = map.get(key)
      row.users += 1
      if (item.status !== 'suspended') row.active += 1
      if (item.role === 'owner') row.owners += 1
    })

    return Array.from(map.values()).sort((a, b) => b.users - a.users)
  }, [users])

  const stats = {
    users: users.length,
    activeUsers: users.filter((item) => item.status !== 'suspended').length,
    organizations: organizations.length,
    enabledFeatures: features.filter((item) => item.enabled !== false).length,
  }

  const audit = (action, entityType, entityId, details) =>
    writePlatformAudit(user.uid, action, entityType, entityId, details).catch(console.error)

  const changeUser = async (target, patch) => {
    setError('')
    try {
      await updatePlatformUser(target.id, patch)
      await audit('platform.user.updated', 'user', target.id, patch)
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث المستخدم')
    }
  }

  const toggleFeature = async (feature) => {
    try {
      const enabled = feature.enabled === false
      await savePlatformFeature({ ...feature, enabled })
      await audit('platform.feature.toggled', 'feature', feature.key, { enabled })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث الميزة')
    }
  }

  const seedFeatures = async () => {
    setBootstrapping(true)
    setError('')
    try {
      await seedDefaultPlatformFeatures()
      await audit('platform.features.seeded', 'feature', 'defaults', {
        count: DEFAULT_PLATFORM_FEATURES.length,
      })
    } catch (err) {
      console.error(err)
      setError('تعذر تهيئة المزايا الأساسية')
    } finally {
      setBootstrapping(false)
    }
  }

  const createFeature = async (event) => {
    event.preventDefault()
    if (!featureForm.key.trim() || !featureForm.label.trim()) return

    try {
      const key = featureForm.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      await savePlatformFeature({ ...featureForm, key })
      await audit('platform.feature.created', 'feature', key, featureForm)
      setFeatureForm(emptyFeature)
    } catch (err) {
      console.error(err)
      setError('تعذر إنشاء الميزة')
    }
  }

  const saveSettings = async (event) => {
    event.preventDefault()
    setSavingSettings(true)
    try {
      await savePlatformSettings(settings)
      await audit('platform.settings.updated', 'settings', 'general', settings)
    } catch (err) {
      console.error(err)
      setError('تعذر حفظ إعدادات المنصة')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="page-shell platform-shell" dir="rtl">
      <header className="platform-header card">
        <div>
          <span className="eyebrow">Platform Control Center</span>
          <h1>إدارة Broker OS</h1>
          <p>صلاحيات على مستوى المنصة بالكامل، منفصلة عن مديري المؤسسات.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={logout}>خروج</button>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">إجمالي المستخدمين</div><div className="stat-value">{stats.users}</div></div>
        <div className="stat-card"><div className="stat-label">المستخدمون النشطون</div><div className="stat-value">{stats.activeUsers}</div></div>
        <div className="stat-card"><div className="stat-label">المؤسسات</div><div className="stat-value">{stats.organizations}</div></div>
        <div className="stat-card"><div className="stat-label">المزايا المفعلة</div><div className="stat-value">{stats.enabledFeatures}</div></div>
      </div>

      <section className="card platform-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Users</span>
            <h2>المستخدمون</h2>
          </div>
          <span className="mini-kpi">{users.length} مستخدم</span>
        </div>

        <div className="platform-table">
          {users.map((item) => (
            <div className="platform-user-row" key={item.id}>
              <div>
                <strong>{item.email || item.id}</strong>
                <span>{item.organizationId || 'بدون مؤسسة'}</span>
              </div>

              <div className="platform-actions">
                <select
                  className="status-select"
                  value={item.role || 'owner'}
                  onChange={(event) => changeUser(item, { role: event.target.value })}
                  disabled={item.id === user.uid}
                >
                  {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>

                <select
                  className="status-select"
                  value={item.status || 'active'}
                  onChange={(event) => changeUser(item, { status: event.target.value })}
                  disabled={item.id === user.uid}
                >
                  {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card platform-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Features</span>
              <h2>التحكم في المزايا</h2>
            </div>
            <button type="button" className="btn btn-secondary" onClick={seedFeatures} disabled={bootstrapping}>
              {bootstrapping ? '...جارٍ التهيئة' : 'تهيئة المزايا الأساسية'}
            </button>
          </div>

          <div className="platform-feature-list">
            {features.map((feature) => (
              <div className="platform-feature-row" key={feature.id}>
                <div>
                  <strong>{feature.label || feature.key}</strong>
                  <span>{feature.description || feature.key}</span>
                </div>
                <button
                  type="button"
                  className="badge-toggle"
                  style={{ background: feature.enabled === false ? 'var(--danger)' : 'var(--success)' }}
                  onClick={() => toggleFeature(feature)}
                >
                  {feature.enabled === false ? 'متوقفة' : 'مفعلة'}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={createFeature} style={{ marginTop: 16 }}>
            <div className="section-head">
              <div>
                <span className="eyebrow">New capability flag</span>
                <h2>إضافة ميزة</h2>
              </div>
            </div>
            <input
              className="field"
              placeholder="key مثل: hr_dashboard"
              value={featureForm.key}
              onChange={(event) => setFeatureForm({ ...featureForm, key: event.target.value })}
            />
            <input
              className="field"
              placeholder="اسم الميزة"
              value={featureForm.label}
              onChange={(event) => setFeatureForm({ ...featureForm, label: event.target.value })}
            />
            <textarea
              className="field"
              rows={2}
              placeholder="وصف مختصر للميزة"
              value={featureForm.description}
              onChange={(event) => setFeatureForm({ ...featureForm, description: event.target.value })}
            />
            <button type="submit" className="btn btn-primary btn-block">حفظ الميزة</button>
          </form>
        </section>

        <section className="card platform-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">System Settings</span>
              <h2>إعدادات المنصة</h2>
            </div>
          </div>

          <form onSubmit={saveSettings}>
            <input
              className="field"
              placeholder="اسم المنصة"
              value={settings.appName || ''}
              onChange={(event) => setSettings({ ...settings, appName: event.target.value })}
            />
            <input
              className="field"
              placeholder="بريد الدعم"
              type="email"
              value={settings.supportEmail || ''}
              onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })}
            />
            <textarea
              className="field"
              rows={3}
              placeholder="رسالة الصيانة / التنبيه العام"
              value={settings.announcement || ''}
              onChange={(event) => setSettings({ ...settings, announcement: event.target.value })}
            />
            <label className="platform-switch">
              <input
                type="checkbox"
                checked={settings.maintenanceMode === true}
                onChange={(event) => setSettings({ ...settings, maintenanceMode: event.target.checked })}
              />
              وضع الصيانة
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={savingSettings}>
              {savingSettings ? '...جارٍ الحفظ' : 'حفظ إعدادات المنصة'}
            </button>
          </form>
        </section>
      </div>

      <section className="card platform-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Organizations</span>
            <h2>المؤسسات</h2>
          </div>
        </div>

        <div className="commercial-grid">
          {organizations.map((org) => (
            <div className="card commercial-card" key={org.id}>
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">Organization</span>
                  <h3>{org.id}</h3>
                </div>
                <span className="badge" style={{ background: 'var(--primary-blue)' }}>{org.users}</span>
              </div>
              <div className="commercial-meta">
                <span>نشط: {org.active}</span>
                <span>Owners: {org.owners}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card platform-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Audit</span>
            <h2>سجل إدارة المنصة</h2>
          </div>
        </div>
        {auditLogs.length === 0 ? (
          <div className="empty-state">لم تُسجل إجراءات إدارية بعد.</div>
        ) : (
          auditLogs.map((log) => (
            <div key={log.id} className="audit-row">
              <div>
                <strong>{log.action}</strong>
                <div className="subtitle">{log.entityType} · {log.entityId}</div>
              </div>
              <div className="audit-meta">
                <span>{log.actorId}</span>
                <small>{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('ar-EG') : '—'}</small>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
