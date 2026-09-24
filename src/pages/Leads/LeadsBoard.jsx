import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { getLeads, updateLeadStatus } from '../../services/leadService';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const LeadsBoard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (user?.organizationId) {
      getLeads(user.organizationId).then(setLeads);
    }
  }, [user]);

  const handleStatusChange = async (leadId, newStatus) => {
    await updateLeadStatus(leadId, newStatus);
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      <h2 style={{ color: 'var(--accent-orange)' }}>مسار العملاء المحتملين</h2>
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        {STATUSES.map(status => (
          <div key={status} style={{
            minWidth: '250px',
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '10px'
          }}>
            <h4 style={{ textTransform: 'capitalize', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
              {status}
            </h4>
            {leads.filter(l => l.status === status).map(lead => (
              <div key={lead.id} style={{
                background: '#1A2A4A',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px',
                borderLeft: '3px solid var(--primary-blue)'
              }}>
                <p style={{ fontWeight: 'bold' }}>{lead.name}</p>
                <select 
                  value={lead.status} 
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                  style={{ width: '100%', marginTop: '5px', background: 'var(--bg-dark)', color: '#fff', border: '1px solid #333' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadsBoard;