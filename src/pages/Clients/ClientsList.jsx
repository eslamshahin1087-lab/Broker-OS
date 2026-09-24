import React, { useEffect, useState } from 'react'
import { useAuth } from '../../services/AuthContext'
import { listenToClients } from '../../services/clients'

const ClientsList = () => {
  const { organizationId } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) {
      setClients([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError('')
    const unsubscribe = listenToClients(
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

    return () => unsubscribe()
  }, [organizationId])

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: 'var(--primary-blue)' }}>العملاء</h2>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>جارٍ تحميل العملاء...</p>
      ) : clients.length === 0 ? (
        <div className="empty-state">لا يوجد عملاء حتى الآن.</div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {clients.map((client) => (
            <div key={client.id} style={{
              background: 'var(--card-bg)',
              padding: '15px',
              borderRadius: '8px',
              borderRight: '4px solid var(--primary-blue)'
            }}>
              <h3>{client.name || 'عميل بدون اسم'}</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {[client.email, client.phone].filter(Boolean).join(' | ') || 'لا توجد بيانات اتصال'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientsList
