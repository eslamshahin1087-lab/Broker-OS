import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { INSURANCE_TYPE_LABELS, INSURANCE_TYPES } from '../constants'
import { listenToInsurers } from '../services/insurers'
import { addProduct, deleteProduct, listenToProducts, updateProduct } from '../services/products'

const emptyForm = {
  name: '',
  type: INSURANCE_TYPES.AUTO,
  insurerId: '',
  description: '',
  defaultCommissionRate: '',
  status: 'active',
}

export default function Products() {
  const { organizationId } = useAuth()
  const [products, setProducts] = useState([])
  const [insurers, setInsurers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) return undefined

    const unsubs = [
      listenToProducts(
        organizationId,
        (rows) => { setProducts(rows); setLoading(false) },
        (err) => { console.error(err); setError('تعذر تحميل المنتجات'); setLoading(false) }
      ),
      listenToInsurers(
        organizationId,
        setInsurers,
        (err) => { console.error(err); setError('تعذر تحميل شركات التأمين') }
      ),
    ]

    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [organizationId])

  const activeInsurers = useMemo(() => insurers.filter((item) => item.active), [insurers])
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.insurerId) return

    const insurer = insurers.find((item) => item.id === form.insurerId)
    setSaving(true)
    setError('')

    try {
      await addProduct(organizationId, {
        ...form,
        insurerName: insurer?.name || '',
      })
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر حفظ المنتج')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (item) => {
    try {
      await updateProduct(item.id, { status: item.status === 'active' ? 'inactive' : 'active' })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث المنتج')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('تعطيل المنتج؟')) return
    try {
      await deleteProduct(id)
    } catch (err) {
      console.error(err)
      setError('تعذر تعطيل المنتج')
    }
  }

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <span className="eyebrow">Insurance Products</span>
          <h1 style={{ margin: '6px 0 0' }}>المنتجات</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)} disabled={!activeInsurers.length}>
          {showForm ? 'إلغاء' : '+ منتج جديد'}
        </button>
      </div>

      {!activeInsurers.length && (
        <div className="alert">أضف شركة تأمين نشطة أولًا حتى تتمكن من إنشاء منتجات.</div>
      )}

      {error && <div className="alert">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
          <div className="commercial-form-grid">
            <input className="field" name="name" placeholder="اسم المنتج *" value={form.name} onChange={change} required />

            <select className="field" name="insurerId" value={form.insurerId} onChange={change} required>
              <option value="">اختر شركة التأمين *</option>
              {activeInsurers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>

            <select className="field" name="type" value={form.type} onChange={change}>
              {Object.entries(INSURANCE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <input
              className="field"
              name="defaultCommissionRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="العمولة الافتراضية %"
              value={form.defaultCommissionRate}
              onChange={change}
            />
          </div>

          <textarea className="field" name="description" rows="3" placeholder="وصف المنتج" value={form.description} onChange={change} />

          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ المنتج'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل المنتجات...</div>
      ) : products.length === 0 ? (
        <div className="card empty-state">لم يتم إضافة منتجات بعد.</div>
      ) : (
        <div className="commercial-grid">
          {products.map((item) => (
            <div className="card commercial-card" key={item.id}>
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{INSURANCE_TYPE_LABELS[item.type] || item.type}</span>
                  <h3>{item.name}</h3>
                </div>
                <button
                  className="badge-toggle"
                  onClick={() => toggle(item)}
                  style={{ background: item.status === 'active' ? 'var(--success)' : '#64748b' }}
                >
                  {item.status === 'active' ? 'نشط' : 'متوقف'}
                </button>
              </div>

              <div className="commercial-meta">
                <span>{item.insurerName || 'بدون شركة'}</span>
                <span>عمولة افتراضية: {Number(item.defaultCommissionRate || 0)}%</span>
              </div>

              {item.description && <p className="subtitle">{item.description}</p>}

              <button className="btn btn-danger-outline" onClick={() => remove(item.id)} disabled={item.status !== "active"}>
                {item.status === "active" ? "تعطيل المنتج" : "معطل"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
