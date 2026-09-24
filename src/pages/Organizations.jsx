import { useEffect, useMemo, useState } from 'react'
import {
  listenToPlatformFeatures,
  listenToPlatformOrganizations,
  listenToPlatformUsers,
  saveOrganization,
  syncOrganizationsFromUsers,
  updateOrganization,
  updateOrganizationFeature,
  writePlatformAudit,
} from '../services/platformAdmin'
import { useAuth } from '../services/AuthContext'

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

const STATUSES = [
  { value: 'active', label: 'نشطة' },
  { value: 'suspended', label: 'موقوفة' },
]

const emptyForm = {
  name: '',
  plan: 'free',
  status: 'active',
}

export default function Organizations() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [storedOrganizations, setStoredOrganizations] = useState([])
  const [features, setFeatures] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const cleanups = [
      listenToPlatformUsers(setUsers, (err) => {
        console.error(err)
        setError('تعذر تحميل المستخدمين')
      }),
      listenToPlatformOrganizations(setStoredOrganizations, (err) => {
        console.error(err)
        setError('تعذر تحميل المؤسسات')
      }),
      listenToPlatformFeatures(setFeatures, (err) => {
        console.error(err)
        setError('تعذر تحميل المزايا')
      }),
    ]

    return () => cleanups.forEach((unsubscribe) => unsubscribe?.())
  }, [])

  const organizations = useMemo(() => {
    const map = new Map(
      storedOrganizations.map((organization) => [organization.id, { ...organization, persisted: true }])
    )

    users.forEach((item) => {
      const id = item.organizationId
      if (!id) return

      const current = map.get(id) || {
        id,
        organizationId: id,
        name: id,
        plan: 'free',
        status: 'active',
        ownerUserId: '',
        featureOverrides: {},
        persisted: false,
      }

      current.userCount = (current.userCount || 0) + 1
      current.activeUsers = (current.activeUsers || 0) + (item.status === 'suspended' ? 0 : 1)
      if (!current.ownerUserId && item.role === 'owner') current.ownerUserId = item.id

      map.set(id, current)
    })

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        userCount: item.userCount || users.filter((user) => user.organizationId === item.id).length,
        activeUsers: item.activeUsers || users.filter((user) => user.organizationId === item.id && user.status !== 'suspended').length,
      }))
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
  }, [storedOrganizations, users])

  const selected = organizations.find((item) => item.id === selectedId) || null
  const selectedUsers = selected
    ? users.filter((item) => item.organizationId === selected.id)
    : []

  useEffect(() => {
    if (!selectedId && organizations[0]) setSelectedId(organizations[0].id)
    if (selectedId && !organizations.some((item) => item.id === selectedId)) {
      setSelectedId(organizations[0]?.id || '')
    }
  }, [organizations, selectedId])

  const audit = (action, entityId, details) =>
    writePlatformAudit(user.uid, action, 'organization', entityId, details).catch(console.error)

  const createOrganization = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('اكتب اسم المؤسسة')
      return
    }

    setError('')

    try {
      const organizationId = 'org-' + crypto.randomUUID().slice(0, 8)
      await saveOrganization(organizationId, {
        name: form.name,
        plan: form.plan,
        status: form.status,
      })
      await audit('platform.organization.created', organizationId, {
        name: form.name.trim(),
        plan: form.plan,
        status: form.status,
      })
      setForm(emptyForm)
      setShowCreate(false)
      setSelectedId(organizationId)
    } catch (err) {
      console.error(err)
      setError('تعذر إنشاء المؤسسة')
    }
  }

  const persistCurrent = async (patch) => {
    if (!selected?.id) return

    try {
      if (!selected.persisted) {
        await saveOrganization(selected.id, {
          name: selected.name,
          plan: selected.plan,
          status: selected.status,
          ownerUserId: selected.ownerUserId || '',
          featureOverrides: selected.featureOverrides || {},
          ...patch,
        })
      } else {
        await updateOrganization(selected.id, patch)
      }

      await audit('platform.organization.updated', selected.id, patch)
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث المؤسسة')
    }
  }

  const assignUser = async (targetUserId, organizationId) => {
    try {
      const previous = users.find((item) => item.id === targetUserId)?.organizationId || ''
      const org = organizations.find((item) => item.id === organizationId)
      const nextData = {
        organizationId,
        ...(org?.ownerUserId === targetUserId ? { role: 'owner' } : {}),
      }

      const { updatePlatformUser } = await import('../services/platformAdmin')
      await updatePlatformUser(targetUserId, nextData)
      await audit('platform.user.organization_changed', targetUserId, {
        from: previous,
        to: organizationId,
      })
    } catch (err) {
      console.error(err)
      setError('تعذر نقل المستخدم إلى المؤسسة')
    }
  }

  const toggleFeature = async (featureKey) => {
    if (!selected?.persisted) {
      await persistCurrent({ featureOverrides: { [featureKey]: true } })
      return
    }

    const currentOverrides = selected.featureOverrides || {}
    const currentlyEnabled = currentOverrides[featureKey] !== false
    const enabled = !currentlyEnabled

    try {
      await updateOrganizationFeature(selected.id, featureKey, enabled)
      await audit('platform.organization.feature_toggled', selected.id, {
        featureKey,
        enabled,
      })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث ميزة المؤسسة')
    }
  }

  const syncExisting = async () => {
    setSyncing(true)
    setError('')

    try {
      const count = await syncOrganizationsFromUsers(users)
      await audit('platform.organizations.synced', 'all', { count })
    } catch (err) {
      console.error(err)
      setError('تعذر تهيئة المؤسسات الحالية')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="page-shell platform-shell" dir="rtl">
      <div className="hero">
        <div>
          <span className="eyebrow">Organization Management</span>
          <h1>المؤسسات</h1>
          <p>إدارة مؤسسات Broker OS، حالتها، خطتها، أعضائها، والمزايا الخاصة بكل مؤسسة.</p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={syncExisting}
            disabled={syncing}
          >
            {syncing ? '...جارٍ التهيئة' : 'تهيئة المؤسسات الحالية'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate((value) => !value)}
          >
            {showCreate ? 'إلغاء' : '+ مؤسسة جديدة'}
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {showCreate && (
        <form className="card platform-section" onSubmit={createOrganization}>
          <div className="section-head">
            <div>
              <span className="eyebrow">New Organization</span>
              <h2>إنشاء مؤسسة</h2>
            </div>
          </div>

          <input
            className="field"
            placeholder="اسم المؤسسة *"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />

          <div className="commercial-form-grid">
            <select
              className="field"
              value={form.plan}
              onChange={(event) => setForm({ ...form, plan: event.target.value })}
            >
              {PLANS.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
            </select>

            <select
              className="field"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            إنشاء المؤسسة
          </button>
        </form>
      )}

      <div className="dashboard-grid">
        <section className="card platform-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Organizations</span>
              <h2>قائمة المؤسسات</h2>
            </div>
            <span className="mini-kpi">{organizations.length} مؤسسة</span>
          </div>

          <div className="platform-feature-list">
            {organizations.map((organization) => (
              <button
                type="button"
                key={organization.id}
                className="platform-organization-row"
                onClick={() => setSelectedId(organization.id)}
              >
                <div>
                  <strong>{organization.name || organization.id}</strong>
                  <span>{organization.id}</span>
                </div>
                <div className="platform-actions">
                  <span className="badge" style={{ background: organization.status === 'suspended' ? 'var(--danger)' : 'var(--success)' }}>
                    {organization.status === 'suspended' ? 'موقوفة' : 'نشطة'}
                  </span>
                  <span className="badge" style={{ background: 'var(--primary-blue)' }}>
                    {organization.userCount || 0} مستخدم
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card platform-section">
          {!selected ? (
            <div className="empty-state">اختر مؤسسة لعرض تفاصيلها.</div>
          ) : (
            <>
              <div className="section-head">
                <div>
                  <span className="eyebrow">Organization Profile</span>
                  <h2>{selected.name || selected.id}</h2>
                  <div className="subtitle">{selected.id}</div>
                </div>
              </div>

              <input
                key={selected.id}
                className="field"
                defaultValue={selected.name || ''}
                onBlur={(event) => {
                  const value = event.target.value.trim()
                  if (value && value !== selected.name) {
                    persistCurrent({ name: value })
                  }
                }}
                placeholder="اسم المؤسسة"
              />

              <div className="commercial-form-grid">
                <select
                  className="field"
                  value={selected.plan || 'free'}
                  onChange={(event) => persistCurrent({ plan: event.target.value })}
                >
                  {PLANS.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
                </select>

                <select
                  className="field"
                  value={selected.status || 'active'}
                  onChange={(event) => persistCurrent({ status: event.target.value })}
                >
                  {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </div>

              <div className="commercial-meta">
                <span>إجمالي: {selected.userCount || 0}</span>
                <span>نشط: {selected.activeUsers || 0}</span>
                <span>Owner: {selected.ownerUserId || '—'}</span>
              </div>

              <h3>أعضاء المؤسسة</h3>
              {selectedUsers.length === 0 ? (
                <div className="empty-state">لا يوجد مستخدمون مرتبطون حاليًا.</div>
              ) : (
                selectedUsers.map((item) => (
                  <div className="platform-user-row" key={item.id}>
                    <div>
                      <strong>{item.email || item.id}</strong>
                      <span>{item.role || '—'} · {item.status || 'active'}</span>
                    </div>
                    <span className="badge" style={{ background: item.status === 'suspended' ? 'var(--danger)' : 'var(--success)' }}>
                      {item.role === 'owner' ? 'Owner' : 'Member'}
                    </span>
                  </div>
                ))
              )}

              <h3 style={{ marginTop: 20 }}>مزايا المؤسسة</h3>
              <div className="platform-feature-list">
                {features.map((feature) => {
                  const globalEnabled = feature.enabled !== false
                  const overrides = selected.featureOverrides || {}
                  const override = overrides[feature.key]
                  const effectiveEnabled = globalEnabled && override !== false

                  return (
                    <div className="platform-feature-row" key={feature.id}>
                      <div>
                        <strong>{feature.label || feature.key}</strong>
                        <span>{globalEnabled ? 'متاحة على مستوى المنصة' : 'متوقفة عالميًا'}</span>
                      </div>
                      <button
                        type="button"
                        className="badge-toggle"
                        style={{ background: effectiveEnabled ? 'var(--success)' : 'var(--danger)' }}
                        onClick={() => toggleFeature(feature.key)}
                        disabled={!globalEnabled}
                      >
                        {effectiveEnabled ? 'مفعلة للمؤسسة' : 'متوقفة'}
                      </button>
                    </div>
                  )
                })}
              </div>

              <h3 style={{ marginTop: 20 }}>إسناد مستخدم</h3>
              <select
                className="field"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) assignUser(event.target.value, selected.id)
                  event.target.value = ''
                }}
              >
                <option value="">اختر مستخدمًا لنقله إلى المؤسسة</option>
                {users
                  .filter((item) => item.organizationId !== selected.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.email || item.id} · {item.organizationId || 'بدون مؤسسة'}
                    </option>
                  ))}
              </select>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
