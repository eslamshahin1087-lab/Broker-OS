import PageHeader from '../components/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { canManageOperations } from '../constants/roles'
import { listenToRenewals, RENEWAL_STATUSES, updateRenewal } from '../services/renewals'

export default function Renewals() {
  const { organizationId, role, user } = useAuth()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canManage = canManageOperations(role)

  useEffect(() => {
    if (!organizationId) return undefined
    const unsubscribe = listenToRenewals(
      organizationId,
      (rows) => { setItems(rows); setLoading(false) },
      (err) => { console.error(err); setError('تعذر تحميل التجديدات'); setLoading(false) }
    )
    return () => unsubscribe()
  }, [organizationId])

  const visible = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'overdue') return items.filter((item) => item.daysLeft < 0)
    return items.filter((item) => item.daysLeft >= 0 && item.daysLeft <= Number(filter))
  }, [items, filter])

  const saveStatus = async (policy, status) => {
    if (!canManage || !user?.uid) return
    setError('')
    try {
      await updateRenewal(organizationId, user.uid, policy.id, {
        renewalStatus: status,
        renewalNotes: policy.renewalNotes || '',
      })
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث حالة التجديد')
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="renewals"
        eyebrow="Retention Desk"
        title="التجديدات"
        description="الأولوية حسب قرب موعد التجديد، مع سجل آخر متابعة وحالة التجديد."
        action={
          <select className="status-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">كل التجديدات</option>
            <option value="overdue">متأخرة</option>
            <option value="7">خلال 7 أيام</option>
            <option value="30">خلال 30 يوم</option>
            <option value="90">خلال 90 يوم</option>
          </select>
        }
      />

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل التجديدات...</div>
      ) : visible.length === 0 ? (
        <div className="card empty-state">لا توجد تجديدات ضمن الفلتر الحالي.</div>
      ) : (
        <div className="commercial-grid">
          {visible.map((item) => {
            const urgent = item.daysLeft < 0 || item.daysLeft <= 7
            return (
              <div className="card commercial-card" key={item.id}>
                <div className="commercial-card-head">
                  <div>
                    <span className="eyebrow">{item.renewalStatus || 'pending'}</span>
                    <h3>{item.clientName || 'عميل'}</h3>
                  </div>
                  <span className="badge" style={{ background: urgent ? 'var(--danger)' : 'var(--primary-blue)' }}>
                    {item.daysLeft < 0 ? 'متأخر ' + Math.abs(item.daysLeft) + ' يوم' : item.daysLeft + ' يوم'}
                  </span>
                </div>

                <div className="commercial-meta">
                  <span>تاريخ التجديد: {item.renewalDate}</span>
                  <span>القسط: {Number(item.premiumAmount || 0).toLocaleString()} ج.م</span>
                  {item.policyNumber && <span>#{item.policyNumber}</span>}
                </div>

                {canManage ? (
                  <select
                    className="field"
                    value={item.renewalStatus || 'pending'}
                    onChange={(event) => saveStatus(item, event.target.value)}
                  >
                    {RENEWAL_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="subtitle">
                    الحالة: {RENEWAL_STATUSES.find((status) => status.value === (item.renewalStatus || 'pending'))?.label || 'لم يبدأ'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
