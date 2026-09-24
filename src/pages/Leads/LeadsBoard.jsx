import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import AppIcon from '../../components/AppIcon'
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
    <div className="page-shell">
      <PageHeader
        icon="leads"
        eyebrow="Lead Pipeline"
        title="العملاء المحتملون"
        description="تابع مراحل العميل المحتمل وحوّله إلى فرصة وعميل بدون فقدان السياق."
      />
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>جارٍ تحميل العملاء المحتملين...</p>
      ) : (
        <div className="lead-board">
          {LEAD_STATUSES.map(({ value, label }) => (
            <div key={value} className="lead-column">
              <div className="lead-column-head">
                <span className="lead-column-icon"><AppIcon name="leads" size={14} /></span>
                <div>
                  <strong>{label}</strong>
                  <small>{leads.filter((lead) => lead.status === value).length} سجل</small>
                </div>
              </div>
              {leads.filter((lead) => lead.status === value).map((lead) => (
                <div key={lead.id} className="lead-card">
                  <div className="lead-card-title">
                    <AppIcon name="user" size={14} />
                    <strong>{lead.name || 'عميل محتمل'}</strong>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className="status-select lead-status-select"
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
