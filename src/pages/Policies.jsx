import AppIcon from '../components/AppIcon'
import PageHeader from '../components/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { listenToClients } from '../services/clients'
import { POLICY_TYPES, addPolicy, daysUntilRenewal, deletePolicy, listenToPolicies, policyTypeLabel } from '../services/policies'
import { buildMedicalAnalysisLink } from '../services/relationshipEngine'

const emptyForm = {
  clientId: '',
  type: 'auto',
  policyNumber: '',
  premiumAmount: '',
  commissionRate: '',
  renewalDate: '',
}

const typeColors = { auto: '#2563eb', health: '#16a34a', life: '#7c3aed', property: '#f59e0b', other: '#6b7280' }

export default function Policies() {
  const { organizationId } = useAuth()
  const [policies, setPolicies] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!organizationId) return
    const unsub1 = listenToPolicies(
      organizationId,
      (rows) => { setPolicies(rows); setLoading(false) },
      (err) => { console.error(err); setError('تعذر تحميل البوالص'); setLoading(false) }
    )
    const unsub2 = listenToClients(organizationId, setClients)
    return () => { unsub1(); unsub2() }
  }, [organizationId])

  const commissionPreview = useMemo(() => {
    const premium = Number(form.premiumAmount) || 0
    const rate = Number(form.commissionRate) || 0
    return Math.round((premium * rate) / 100)
  }, [form.premiumAmount, form.commissionRate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientId || !form.premiumAmount) return
    setSaving(true)
    try {
      const client = clients.find((c) => c.id === form.clientId)
      await addPolicy(organizationId, { ...form, clientName: client?.name || '' })
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر إضافة البوليصة')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (policyId) => {
    if (!confirm('متأكد إنك عايز تمسح البوليصة دي؟')) return
    try {
      await deletePolicy(policyId)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف البوليصة')
    }
  }

  return (
    <div>
      <PageHeader
        icon="policies"
        eyebrow="Policy Portfolio"
        title="البوالص"
        description="إدارة المحفظة، الأقساط والعمولات ومواعيد التجديد."
        action={
          <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary" disabled={clients.length === 0}>
            <AppIcon name={showForm ? 'close' : 'plus'} size={14} />
            {showForm ? 'إلغاء' : 'بوليصة جديدة'}
          </button>
        }
      />

      {clients.length === 0 && !loading && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          محتاج تضيف عميل واحد على الأقل الأول من شاشة العملاء.
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
          <select name="clientId" value={form.clientId} onChange={handleChange} required className="field">
            <option value="">اختر العميل *</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select name="type" value={form.type} onChange={handleChange} className="field">
            {POLICY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <input name="policyNumber" placeholder="رقم البوليصة" value={form.policyNumber} onChange={handleChange} className="field" />

          <input
            name="premiumAmount"
            type="number"
            placeholder="قيمة القسط (جنيه) *"
            value={form.premiumAmount}
            onChange={handleChange}
            required
            className="field"
          />

          <input
            name="commissionRate"
            type="number"
            placeholder="نسبة العمولة % *"
            value={form.commissionRate}
            onChange={handleChange}
            required
            className="field"
          />

          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
            العمولة المتوقعة: <strong style={{ color: 'var(--color-text)' }}>{commissionPreview.toLocaleString()} جنيه</strong>
          </div>

          <label style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>تاريخ التجديد</label>
          <input name="renewalDate" type="date" value={form.renewalDate} onChange={handleChange} className="field" />

          <button type="submit" disabled={saving} className="btn btn-primary btn-block">
            {saving ? '...جارٍ الحفظ' : 'حفظ البوليصة'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>...جارٍ التحميل</p>
      ) : policies.length === 0 ? (
        <div className="empty-state">لسه مفيش بوالص. ابدأ بإضافة أول بوليصة.</div>
      ) : (
        <div>
          {policies.map((p) => (
            <div key={p.id} className="list-item" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="title">{p.clientName || 'عميل'}</div>
                  <div className="subtitle">
                    {p.policyNumber ? `#${p.policyNumber} · ` : ''}
                    قسط {Number(p.premiumAmount).toLocaleString()} جنيه · عمولة {Number(p.commissionAmount).toLocaleString()} جنيه
                  </div>
                  {p.renewalDate && (
                    <div className="subtitle">
                      تجديد: {p.renewalDate}
                      {daysUntilRenewal(p.renewalDate) !== null && daysUntilRenewal(p.renewalDate) >= 0 && daysUntilRenewal(p.renewalDate) <= 30 && (
                        <span
                          className="badge"
                          style={{
                            background: daysUntilRenewal(p.renewalDate) <= 7 ? '#ef4444' : '#f59e0b',
                            marginRight: 6,
                            fontSize: 11,
                            padding: '2px 8px',
                          }}
                        >
                          خلال {daysUntilRenewal(p.renewalDate)} يوم
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="badge" style={{ background: typeColors[p.type] || '#6b7280' }}>
                  {policyTypeLabel(p.type)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <Link className="text-link" to={buildMedicalAnalysisLink({ clientId: p.clientId, policyId: p.id })}>
                  <AppIcon name="spark" size={13} /> تحليل الاستهلاكات
                </Link>
                <button
                onClick={() => handleDelete(p.id)}
                className="btn-danger"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13 }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
