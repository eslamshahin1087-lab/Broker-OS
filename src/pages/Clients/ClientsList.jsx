import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { getClients } from '../../services/clientService';

const ClientsList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (user?.organizationId) {
      getClients(user.organizationId).then(setClients);
    }
  }, [user]);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: 'var(--primary-blue)' }}>العملاء</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {clients.map(client => (
          <div key={client.id} style={{
            background: 'var(--card-bg)',
            padding: '15px',
            borderRadius: '8px',
            borderRight: '4px solid var(--primary-blue)'
          }}>
            <h3>{client.name}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{client.email} | {client.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientsList;