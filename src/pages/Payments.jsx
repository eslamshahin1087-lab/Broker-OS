import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { canManageFinance } from '../constants/roles'
import { listenToPolicies } from '../services/policies'
import { addPayment, listenToPayments, PAYMENT_STATUSES, updatePayment } from '../services/payments'

const emptyForm = {
  policyId: '',
  amount: '',
  dueDate: '',
  paymentDate: '',
  status: 'pending',
  method: '',
  reference: '',
  notes: '',
}

export default function Payments() {
  const { organizationId, role, user } = useAuth()
  const [payments, setPayments] = useState([])
  const [policies, setPolicies] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canManage = canManageFinance(role)

  useEffect(() => {
    if (!organizationId) return undefined

    const unsubs = [
      listenToPayments(
        organizationId,
        (rows) => { setPayments(rows); setLoading(false) },
        (err) => { console.error(err); setError('تعذر تحميل المدفوعات'); setLoading(false) }
      ),
      listenToPolicies(organizationId, setPolicies, (err) => console.error(err)),
    ]

    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [organizationId])

  const totals = useMemo(() => ({
    total: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    paid: payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0),
    pending: payments.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0),
  }), [payments])

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (!canManage || !user?.uid || !form.policyId || !form.amount) return

    const policy = policies.find((item) => item.id === form.policyId)
    setSaving(true)
    setError('')

    try {
      await addPayment(organizationId, user.uid, {
        ...form,
        clientId: policy?.clientId || '',
        clientName: policy?.clientName || '',
      })
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر تسجيل الدفعة')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (payment, status) => {
    if (!canManage || !user?.uid) return
    try {
      await updatePayment(organizationId, user.uid, payment.id, { status })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث حالة المدفوع')
    }
  }

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <span className="eyebrow">Collections Desk</span>
          <h1 style={{ margin: '6px 0 0' }}>المدفوعات</h1>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'إلغاء' : '+ تسجيل دفعة'}
          </button>
        )}
      </div>

      {error && <div className="alert">{error}</div>}

      <section className="stat-grid">
        <div className="stat-card"><div className="stat-label">إجمالي المسجل</div><div className="stat-value">{totals.total.toLocaleString()} ج.م</div></div>
        <div className="stat-card"><div className="stat-label">مدفوع</div><div className="stat-value">{totals.paid.toLocaleString()} ج.م</div></div>
        <div className="stat-card"><div className="stat-label">متبقي / مستحق</div><div className="stat-value">{totals.pending.toLocaleString()} ج.م</div></div>
      </section>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
          <div className="commercial-form-grid">
            <select className="field" name="policyId" value={form.policyId} onChange={change} required>
              <option value="">البوليصة *</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {(policy.clientName || 'عميل') + (policy.policyNumber ? ' · #' + policy.policyNumber : '')}
                </option>
              ))}
            </select>
            <input className="field" type="number" min="0" step="0.01" name="amount" placeholder="قيمة الدفعة *" value={form.amount} onChange={change} required />
            <select className="field" name="status" value={form.status} onChange={change}>
              {PAYMENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input className="field" type="date" name="dueDate" value={form.dueDate} onChange={change} />
            <input className="field" type="date" name="paymentDate" value={form.paymentDate} onChange={change} />
            <input className="field" name="method" placeholder="طريقة الدفع" value={form.method} onChange={change} />
            <input className="field" name="reference" placeholder="مرجع العملية" value={form.reference} onChange={change} />
          </div>
          <textarea className="field" name="notes" rows="3" placeholder="ملاحظات" value={form.notes} onChange={change} />
          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'جارٍ التسجيل...' : 'حفظ الدفعة'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل المدفوعات...</div>
      ) : payments.length === 0 ? (
        <div className="card empty-state">لا توجد مدفوعات مسجلة.</div>
      ) : (
        <div className="commercial-grid">
          {payments.map((payment) => (
            <div className="card commercial-card" key={payment.id}>
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{payment.reference || 'Payment'}</span>
                  <h3>{payment.clientName || 'عميل'}</h3>
                </div>
                {canManage ? (
                  <select className="status-select" value={payment.status} onChange={(event) => changeStatus(payment, event.target.value)}>
                    {PAYMENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                ) : (
                  <span className="badge" style={{ background: payment.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                    {PAYMENT_STATUSES.find((item) => item.value === payment.status)?.label || payment.status}
                  </span>
                )}
              </div>
              <div className="commercial-meta">
                <span>{Number(payment.amount || 0).toLocaleString()} {payment.currency || 'EGP'}</span>
                {payment.dueDate && <span>استحقاق: {payment.dueDate}</span>}
                {payment.paymentDate && <span>دفع: {payment.paymentDate}</span>}
                {payment.method && <span>{payment.method}</span>}
              </div>
              {payment.notes && <p className="subtitle">{payment.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
