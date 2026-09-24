import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from '../services/AuthContext'
import { canManageTeam } from '../constants/roles'
import { db } from '../services/firebase'

function formatDate(timestamp) {
  if (!timestamp?.seconds) return '—'
  return new Date(timestamp.seconds * 1000).toLocaleString('ar-EG')
}

export default function AuditLogs() {
  const { organizationId, role } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId || !canManageTeam(role)) {
      setItems([])
      setLoading(false)
      return undefined
    }

    const q = query(
      collection(db, 'auditLogs'),
      where('organizationId', '==', organizationId)
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
          .slice(0, 100)
        setItems(rows)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('تعذر تحميل سجل التدقيق')
        setLoading(false)
      }
    )
  }, [organizationId, role])

  if (!canManageTeam(role)) {
    return (
      <div className="page-shell">
        <div className="card">
          <h2>سجل التدقيق</h2>
          <p className="subtitle">هذه الصفحة متاحة للمالك والمدير فقط.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <span className="eyebrow">Security & Compliance</span>
          <h1 style={{ margin: '6px 0 0' }}>سجل التدقيق</h1>
        </div>
        <span className="mini-kpi">{items.length} سجل ظاهر</span>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل السجل...</div>
      ) : items.length === 0 ? (
        <div className="card empty-state">لم يتم تسجيل أحداث بعد.</div>
      ) : (
        <div className="card">
          {items.map((item) => (
            <div className="audit-row" key={item.id}>
              <div>
                <strong>{item.action}</strong>
                <div className="subtitle">
                  {item.entityType} · {item.entityId || '—'}
                </div>
              </div>
              <div className="audit-meta">
                <span>{item.actorId}</span>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
