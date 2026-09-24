import { useEffect, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { addClient, deleteClient, listenToClients } from '../services/clients'
import { listenToPoliciesByClient, policyTypeLabel } from '../services/policies'

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function Clients() {
  const { organizationId } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!organizationId) return
    const unsub = listenToClients(
      organizationId,
      (rows) => {
        setClients(rows)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('تعذر تحميل العملاء')
        setLoading(false)
      }
    )
    return unsub
  }, [organizationId])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await addClient(organizationId, form)
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر إضافة العميل')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (clientId) => {
    if (!confirm('متأكد إنك عايز تمسح العميل ده؟')) return
    try {
      await deleteClient(clientId)
      setSelected(null)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف العميل')
    }
  }

  if (selected) {
    return <ClientDetail client={selected} organizationId={organizationId} onBack={() => setSelected(null)} onDelete={handleDelete} />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>العملاء</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary">
          {showForm ? 'إلغاء' : '+ عميل جديد'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
          <input name="name" placeholder="الاسم *" value={form.name} onChange={handleChange} required className="field" />
          <input name="phone" placeholder="رقم الموبايل" value={form.phone} onChange={handleChange} className="field" />
          <input name="email" type="email" placeholder="الإيميل" value={form.email} onChange={handleChange} className="field" />
          <textarea name="notes" placeholder="ملاحظات" value={form.notes} onChange={handleChange} rows={2} className="field" />
          <button type="submit" disabled={saving} className="btn btn-primary btn-block">
            {saving ? '...جارٍ الحفظ' : 'حفظ العميل'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>...جارٍ التحميل</p>
      ) : clients.length === 0 ? (
        <div className="empty-state">لسه مفيش عملاء. ابدأ بإضافة أول عميل.</div>
      ) : (
        <div>
          {clients.map((c) => (
            <button key={c.id} onClick={() => setSelected(c)} className="list-item">
              <div className="title">{c.name}</div>
              <div className="subtitle">{c.phone || c.email || '—'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientDetail({ client, organizationId, onBack, onDelete }) {
  const [policies, setPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(true)

  useEffect(() => {
    if (!organizationId || !client?.id) return
    const unsub = listenToPoliciesByClient(
      organizationId,
      client.id,
      (rows) => {
        setPolicies(rows)
        setLoadingPolicies(false)
      },
      (err) => {
        console.error(err)
        setLoadingPolicies(false)
      }
    )
    return unsub
  }, [organizationId, client.id])

  return (
    <div>
      <button onClick={onBack} className="btn-ghost" style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontWeight: 600 }}>
        ← رجوع للعملاء
      </button>
      <h2>{client.name}</h2>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-row"><span className="label">الموبايل</span><span>{client.phone || '—'}</span></div>
        <div className="card-row"><span className="label">الإيميل</span><span>{client.email || '—'}</span></div>
        <div className="card-row"><span className="label">ملاحظات</span><span>{client.notes || '—'}</span></div>
      </div>

      <h3>البوالص</h3>
      {loadingPolicies ? (
        <p style={{ color: 'var(--color-text-muted)' }}>...جارٍ التحميل</p>
      ) : policies.length === 0 ? (
        <div className="empty-state">لسه مفيش بوالص مربوطة بالعميل ده. ضيفها من شاشة البوالص.</div>
      ) : (
        <div>
          {policies.map((p) => (
            <div key={p.id} className="list-item" style={{ cursor: 'default' }}>
              <div className="title">{policyTypeLabel(p.type)}{p.policyNumber ? ` · #${p.policyNumber}` : ''}</div>
              <div className="subtitle">
                قسط {Number(p.premiumAmount).toLocaleString()} جنيه · عمولة {Number(p.commissionAmount).toLocaleString()} جنيه
              </div>
              {p.renewalDate && <div className="subtitle">تجديد: {p.renewalDate}</div>}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => onDelete(client.id)} className="btn-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 16, fontWeight: 600 }}>
        حذف العميل
      </button>
    </div>
  )
}
