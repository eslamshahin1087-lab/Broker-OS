import React, { useEffect, useState } from 'react'
import { useAuth } from '../../services/AuthContext'
import { LEAD_STATUSES, listenToLeads, updateLeadStatus } from '../../services/leadService'

const LeadsBoard = () => {
  const { organizationId } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) {
      setLeads([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError('')
    const unsubscribe = listenToLeads(
      organizationId,
      (rows) => {
        setLeads(rows)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('تعذر تحميل العملاء المحتملين')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [organizationId])

  const handleStatusChange = async (leadId, newStatus) => {
    setError('')
    try {
      await updateLeadStatus(organizationId, leadId, newStatus)
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث حالة العميل المحتمل')
    }
  }

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      <h2 style={{ color: 'var(--accent-orange)' }}>مسار العملاء المحتملين</h2>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>جارٍ تحميل العملاء المحتملين...</p>
      ) : (
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          {LEAD_STATUSES.map(({ value, label }) => (
            <div key={value} style={{
              minWidth: '250px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <h4 style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                {label}
              </h4>
              {leads.filter((lead) => lead.status === value).map((lead) => (
                <div key={lead.id} style={{
                  background: '#1A2A4A',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  borderLeft: '3px solid var(--primary-blue)'
                }}>
                  <p style={{ fontWeight: 'bold' }}>{lead.name || 'عميل محتمل'}</p>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    style={{ width: '100%', marginTop: '5px', background: 'var(--bg-dark)', color: '#fff', border: '1px solid #333' }}
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LeadsBoard
