import { useEffect, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { listenToClients } from '../services/clients'
import { POLICY_TYPES, policyTypeLabel } from '../services/policies'
import {
  STAGES,
  addOpportunity,
  deleteOpportunity,
  listenToOpportunities,
  moveOpportunityStage,
  stageColor,
  stageLabel,
} from '../services/opportunities'

const emptyForm = { clientId: '', type: 'auto', estimatedPremium: '', commissionRate: '', notes: '' }

export default function Opportunities() {
  const { organizationId } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState(null)

  useEffect(() => {
    if (!organizationId) return
    const unsub1 = listenToOpportunities(
      organizationId,
      (rows) => { setOpportunities(rows); setLoading(false) },
      (err) => { console.error(err); setError('تعذر تحميل الفرص'); setLoading(false) }
    )
    const unsub2 = listenToClients(organizationId, setClients)
    return () => { unsub1(); unsub2() }
  }, [organizationId])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientId) return
    setSaving(true)
    try {
      const client = clients.find((c) => c.id === form.clientId)
      await addOpportunity(organizationId, { ...form, clientName: client?.name || '' })
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر إضافة الفرصة')
    } finally {
      setSaving(false)
    }
  }

  const handleStageChange = async (opportunity, newStage) => {
    setMovingId(opportunity.id)
    setError('')
    try {
      const policyId = await moveOpportunityStage(organizationId, opportunity, newStage)
      if (policyId) {
        // نجحت — اتعملت بوليصة أوتوماتيك، الـ listener هيحدّث القائمة لوحده
      }
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث مرحلة الفرصة')
    } finally {
      setMovingId(null)
    }
  }

  const handleDelete = async (opportunityId) => {
    if (!confirm('متأكد إنك عايز تمسح الفرصة دي؟')) return
    try {
      await deleteOpportunity(opportunityId)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف الفرصة')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>الفرص</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary" disabled={clients.length === 0}>
          {showForm ? 'إلغاء' : '+ فرصة جديدة'}
        </button>
      </div>

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

          <input
            name="estimatedPremium"
            type="number"
            placeholder="القسط المتوقع (جنيه)"
            value={form.estimatedPremium}
            onChange={handleChange}
            className="field"
          />
          <input
            name="commissionRate"
            type="number"
            placeholder="نسبة العمولة % (تقديرية)"
            value={form.commissionRate}
            onChange={handleChange}
            className="field"
          />
          <textarea name="notes" placeholder="ملاحظات" value={form.notes} onChange={handleChange} rows={2} className="field" />

          <button type="submit" disabled={saving} className="btn btn-primary btn-block">
            {saving ? '...جارٍ الحفظ' : 'حفظ الفرصة'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>...جارٍ التحميل</p>
      ) : opportunities.length === 0 ? (
        <div className="empty-state">لسه مفيش فرص. ابدأ بإضافة أول فرصة.</div>
      ) : (
        <div>
          {opportunities.map((op) => (
            <div key={op.id} className="list-item" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="title">{op.clientName || 'عميل'}</div>
                  <div className="subtitle">
                    {policyTypeLabel(op.type)}
                    {op.estimatedPremium ? ` · قسط متوقع ${Number(op.estimatedPremium).toLocaleString()} جنيه` : ''}
                  </div>
                  {op.notes && <div className="subtitle">{op.notes}</div>}
                </div>
                <span className="badge" style={{ background: stageColor(op.stage) }}>{stageLabel(op.stage)}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {STAGES.filter((s) => s.value !== op.stage).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStageChange(op, s.value)}
                    disabled={movingId === op.id || op.stage === 'won' || op.stage === 'lost'}
                    className="btn-ghost"
                    style={{
                      border: `1px solid ${s.color}`,
                      color: s.color,
                      background: 'none',
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {op.policyId && (
                <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 8 }}>
                  ✓ اتحوّلت لبوليصة
                </div>
              )}

              <button
                onClick={() => handleDelete(op.id)}
                className="btn-danger"
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0, fontSize: 13 }}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
