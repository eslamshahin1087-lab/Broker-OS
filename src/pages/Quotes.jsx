import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { listenToClients } from '../services/clients'
import { INSURANCE_TYPE_LABELS } from '../constants'
import { listenToInsurers } from '../services/insurers'
import { listenToProducts } from '../services/products'
import { listenToOpportunities } from '../services/opportunities'
import {
  QUOTE_STATUSES,
  addQuote,
  deleteQuote,
  listenToQuotes,
  updateQuoteStatus,
} from '../services/quotes'

const emptyForm = {
  clientId: '',
  opportunityId: '',
  insurerId: '',
  productId: '',
  type: 'auto',
  premiumAmount: '',
  commissionRate: '',
  validUntil: '',
  notes: '',
}

export default function Quotes() {
  const { organizationId } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [clients, setClients] = useState([])
  const [insurers, setInsurers] = useState([])
  const [products, setProducts] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) return undefined

    const unsubs = [
      listenToQuotes(organizationId, (rows) => { setQuotes(rows); setLoading(false) }, (err) => { console.error(err); setError('تعذر تحميل عروض الأسعار'); setLoading(false) }),
      listenToClients(organizationId, setClients, (err) => { console.error(err) }),
      listenToInsurers(organizationId, setInsurers, (err) => { console.error(err) }),
      listenToProducts(organizationId, setProducts, (err) => { console.error(err) }),
      listenToOpportunities(organizationId, setOpportunities, (err) => { console.error(err) }),
    ]

    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [organizationId])

  const activeInsurers = useMemo(() => insurers.filter((item) => item.active), [insurers])
  const activeProducts = useMemo(() => products.filter((item) => item.status === 'active'), [products])
  const filteredProducts = useMemo(
    () => activeProducts.filter((item) => !form.insurerId || item.insurerId === form.insurerId),
    [activeProducts, form.insurerId]
  )

  const change = (event) => {
    const next = { ...form, [event.target.name]: event.target.value }

    if (event.target.name === 'insurerId') {
      next.productId = ''
    }

    if (event.target.name === 'productId') {
      const product = products.find((item) => item.id === event.target.value)
      if (product) next.commissionRate = product.defaultCommissionRate
      if (product) next.type = product.type || next.type
    }

    setForm(next)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.clientId || !form.insurerId || !form.productId || !form.premiumAmount) return

    const client = clients.find((item) => item.id === form.clientId)
    const insurer = insurers.find((item) => item.id === form.insurerId)
    const product = products.find((item) => item.id === form.productId)

    setSaving(true)
    setError('')

    try {
      await addQuote(organizationId, {
        ...form,
        clientName: client?.name || '',
        insurerName: insurer?.name || '',
        productName: product?.name || '',
      })

      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر حفظ عرض السعر')
    } finally {
      setSaving(false)
    }
  }

  const statusChange = async (id, status) => {
    try {
      const policyId = await updateQuoteStatus(organizationId, id, status)
      if (policyId) {
        setError('')
      }
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث حالة العرض')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('حذف عرض السعر؟')) return
    try {
      await deleteQuote(id)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف العرض')
    }
  }

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <span className="eyebrow">Sales Desk</span>
          <h1 style={{ margin: '6px 0 0' }}>عروض الأسعار</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)} disabled={!activeInsurers.length || !activeProducts.length}>
          {showForm ? 'إلغاء' : '+ عرض سعر جديد'}
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      {(!activeInsurers.length || !activeProducts.length) && (
        <div className="alert">تحتاج إلى شركة تأمين ومنتج نشط قبل إنشاء عرض سعر.</div>
      )}

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
          <div className="commercial-form-grid">
            <select className="field" name="clientId" value={form.clientId} onChange={change} required>
              <option value="">العميل *</option>
              {clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>

            <select className="field" name="opportunityId" value={form.opportunityId} onChange={change}>
              <option value="">الفرصة المرتبطة (اختياري)</option>
              {opportunities.filter((item) => !['won', 'lost'].includes(item.stage)).map((item) => (
                <option key={item.id} value={item.id}>{item.clientName || 'فرصة'} · {item.type || ''}</option>
              ))}
            </select>

            <select className="field" name="insurerId" value={form.insurerId} onChange={change} required>
              <option value="">شركة التأمين *</option>
              {activeInsurers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>

            <select className="field" name="productId" value={form.productId} onChange={change} required>
              <option value="">المنتج *</option>
              {filteredProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>

            <select className="field" name="type" value={form.type} onChange={change}>
              {Object.entries(INSURANCE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <input className="field" type="number" name="premiumAmount" min="0" step="0.01" placeholder="القسط *" value={form.premiumAmount} onChange={change} required />
            <input className="field" type="number" name="commissionRate" min="0" step="0.01" placeholder="العمولة %" value={form.commissionRate} onChange={change} />
            <input className="field" type="date" name="validUntil" value={form.validUntil} onChange={change} />
          </div>

          <textarea className="field" name="notes" rows="3" placeholder="ملاحظات العرض" value={form.notes} onChange={change} />

          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ العرض'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل عروض الأسعار...</div>
      ) : quotes.length === 0 ? (
        <div className="card empty-state">لا توجد عروض أسعار حتى الآن.</div>
      ) : (
        <div className="commercial-grid">
          {quotes.map((quote) => (
            <div className="card commercial-card" key={quote.id}>
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{INSURANCE_TYPE_LABELS[quote.type] || quote.type}</span>
                  <h3>{quote.clientName || 'عميل'}</h3>
                </div>

                <select
                  className="status-select"
                  value={quote.status || 'draft'}
                  onChange={(event) => statusChange(quote.id, event.target.value)}
                >
                  {QUOTE_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="commercial-meta">
                <span>{quote.insurerName || 'شركة تأمين'}</span>
                <span>{quote.productName || 'منتج'}</span>
                <span>القسط: {Number(quote.premiumAmount || 0).toLocaleString()} ج.م</span>
                <span>العمولة: {Number(quote.commissionAmount || 0).toLocaleString()} ج.م</span>
                {quote.validUntil && <span>صالح حتى: {quote.validUntil}</span>}
              </div>

              {quote.notes && <p className="subtitle">{quote.notes}</p>}

              {quote.policyId && (
                <div style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                  ✓ تم تحويل العرض إلى بوليصة
                </div>
              )}

              <button className="btn btn-danger-outline" onClick={() => remove(quote.id)}>
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
