/* ═══════════════════════════════════════════════════
   useClients — Hook لمتابعة قائمة العملاء
   ═══════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import { subscribeToClients } from '../services/clients';

export function useClients(orgId, options = {}) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToClients(
      orgId,
      (data) => {
        setClients(data);
        setLoading(false);
      },
      options
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, options.status]);

  return { clients, loading, error };
}