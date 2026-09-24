import AppIcon from '../components/AppIcon'
import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { canManageOperations } from '../constants/roles'
import { listenToPolicies } from '../services/policies'
import { CLAIM_STATUSES, addClaim, deleteClaim, listenToClaims, updateClaim } from '../services/claims'
import { buildMedicalAnalysisLink } from '../services/relationshipEngine'

const emptyForm = {
  policyId: '',
  claimNumber: '',
  incidentDate: '',
  amountClaimed: '',
  description: '',
}

export default function Claims() {
  const { organizationId, role, user } = useAuth()
  const [claims, setClaims] = useState([])
  const [policies, setPolicies] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canManage = canManageOperations(role)

  useEffect(() => {
    if (!organizationId) return undefined

    const unsubs = [
      listenToClaims(
        organizationId,
        (rows) => { setClaims(rows); setLoading(false) },
        (err) => { console.error(err); setError('تعذر تحميل المطالبات'); setLoading(false) }
      ),
      listenToPolicies(organizationId, setPolicies, (err) => console.error(err)),
    ]

    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [organizationId])

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (!canManage || !user?.uid || !form.policyId || !form.amountClaimed) return

    const policy = policies.find((item) => item.id === form.policyId)
    setSaving(true)
    setError('')

    try {
      await addClaim(organizationId, user.uid, {
        ...form,
        clientId: policy?.clientId || '',
        clientName: policy?.clientName || '',
        type: policy?.type || 'other',
        insurerId: policy?.insurerId || '',
        insurerName: policy?.insurerName || '',
      })
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError('تعذر تسجيل المطالبة')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (claim, status) => {
    if (!canManage || !user?.uid) return
    setError('')
    try {
      await updateClaim(organizationId, user.uid, claim.id, { status })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث حالة المطالبة')
    }
  }

  const remove = async (id) => {
    if (!canManage || !window.confirm('حذف المطالبة؟')) return
    try {
      await deleteClaim(organizationId, user.uid, id)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف المطالبة')
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="claims"
        eyebrow="Claims Desk"
        title="المطالبات"
        description="متابعة المطالبات من البلاغ حتى التعويض، مع ربط مباشر بالبوليصة والعميل."
        action={canManage ? (
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            <AppIcon name={showForm ? 'close' : 'plus'} size={14} />
            {showForm ? 'إلغاء' : 'مطالبة'}
          </button>
        ) : null}
      />

      {error && <div className="alert">{error}</div>}

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

            <input className="field" name="claimNumber" placeholder="رقم المطالبة" value={form.claimNumber} onChange={change} />
            <input className="field" type="date" name="incidentDate" value={form.incidentDate} onChange={change} />
            <input className="field" type="number" min="0" step="0.01" name="amountClaimed" placeholder="المبلغ المطالب به *" value={form.amountClaimed} onChange={change} required />
          </div>

          <textarea className="field" name="description" rows="3" placeholder="وصف الواقعة" value={form.description} onChange={change} />

          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'جارٍ التسجيل...' : 'تسجيل المطالبة'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل المطالبات...</div>
      ) : claims.length === 0 ? (
        <div className="card empty-state">لا توجد مطالبات مسجلة.</div>
      ) : (
        <div className="commercial-grid">
          {claims.map((claim) => (
            <div className="card commercial-card" key={claim.id}>
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{claim.claimNumber || 'Claim'}</span>
                  <h3>{claim.clientName || 'عميل'}</h3>
                </div>
                {canManage ? (
                  <select className="status-select" value={claim.status} onChange={(event) => changeStatus(claim, event.target.value)}>
                    {CLAIM_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                ) : (
                  <span className="badge" style={{ background: 'var(--primary-blue)' }}>
                    {CLAIM_STATUSES.find((status) => status.value === claim.status)?.label || claim.status}
                  </span>
                )}
              </div>

              <div className="commercial-meta">
                <span>المطالب به: {Number(claim.amountClaimed || 0).toLocaleString()} ج.م</span>
                <span>المعتمد: {Number(claim.amountApproved || 0).toLocaleString()} ج.م</span>
                {claim.incidentDate && <span>الواقعة: {claim.incidentDate}</span>}
                {claim.insurerName && <span>{claim.insurerName}</span>}
              </div>

              {claim.description && <p className="subtitle">{claim.description}</p>}

              <Link className="text-link claim-smart-link" to={buildMedicalAnalysisLink({ clientId: claim.clientId, policyId: claim.policyId })}>
                <AppIcon name="spark" size={13} /> تحليل استهلاكات العميل
              </Link>

              {canManage && (
                <button className="btn btn-danger-outline" onClick={() => remove(claim.id)}>
                  حذف المطالبة
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
