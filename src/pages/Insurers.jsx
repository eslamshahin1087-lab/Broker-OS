import AppIcon from '../components/AppIcon'
import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { addInsurer, deleteInsurer, listenToInsurers, updateInsurer } from '../services/insurers'

const emptyForm = {
  name: '',
  licenseNumber: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  notes: '',
}

export default function Insurers() {
  const { organizationId } = useAuth()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) return undefined
    const unsubscribe = listenToInsurers(
      organizationId,
      (rows) => { setItems(rows); setLoading(false) },
      (err) => { console.error(err); setError('تعذر تحميل شركات التأمين'); setLoading(false) }
    )
    return () => unsubscribe()
  }, [organizationId])

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    setError('')
    try {
      await addInsurer(organizationId, form)
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر حفظ شركة التأمين')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (item) => {
    try {
      await updateInsurer(item.id, { active: !item.active })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث حالة الشركة')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('تعطيل شركة التأمين؟')) return
    try {
      await deleteInsurer(id)
    } catch (err) {
      console.error(err)
      setError('تعذر تعطيل الشركة')
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="insurers"
        eyebrow="Market Directory"
        title="شركات التأمين"
        description="دليل شركات التأمين، بيانات التواصل وحالة النشاط."
        action={
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            <AppIcon name={showForm ? 'close' : 'plus'} size={14} />
            {showForm ? 'إلغاء' : 'شركة'}
          </button>
        }
      />

      {error && <div className="alert">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
          <div className="commercial-form-grid">
            <input className="field" name="name" placeholder="اسم الشركة *" value={form.name} onChange={change} required />
            <input className="field" name="licenseNumber" placeholder="رقم الترخيص" value={form.licenseNumber} onChange={change} />
            <input className="field" name="contactName" placeholder="مسؤول التواصل" value={form.contactName} onChange={change} />
            <input className="field" name="phone" placeholder="الهاتف" value={form.phone} onChange={change} />
            <input className="field" type="email" name="email" placeholder="البريد" value={form.email} onChange={change} />
            <input className="field" name="website" placeholder="الموقع الإلكتروني" value={form.website} onChange={change} />
          </div>
          <textarea className="field" name="notes" rows="3" placeholder="ملاحظات" value={form.notes} onChange={change} />
          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ الشركة'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل شركات التأمين...</div>
      ) : items.length === 0 ? (
        <div className="card empty-state">لم يتم إضافة شركات تأمين بعد.</div>
      ) : (
        <div className="commercial-grid">
          {items.map((item) => (
            <div className="card commercial-card" key={item.id}>
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{item.active ? 'Active' : 'Inactive'}</span>
                  <h3>{item.name}</h3>
                </div>
                <button
                  className="badge-toggle"
                  onClick={() => toggle(item)}
                  style={{ background: item.active ? 'var(--success)' : '#64748b' }}
                >
                  {item.active ? 'نشط' : 'متوقف'}
                </button>
              </div>

              <div className="commercial-meta">
                {item.licenseNumber && <span>ترخيص: {item.licenseNumber}</span>}
                {item.contactName && <span>مسؤول: {item.contactName}</span>}
                {item.phone && <span>{item.phone}</span>}
                {item.email && <span>{item.email}</span>}
              </div>

              {item.notes && <p className="subtitle">{item.notes}</p>}

              <button className="btn btn-danger-outline" onClick={() => remove(item.id)} disabled={!item.active}>
                {item.active ? "تعطيل الشركة" : "معطلة"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
