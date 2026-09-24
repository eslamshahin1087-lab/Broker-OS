import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { clientFromDoc } from '../models/client'

export function useClient(orgId, clientId) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orgId || !clientId) {
      setClient(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const ref = doc(db, 'clients', clientId)

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists() || snap.data().organizationId !== orgId) setClient(null)
        else setClient(clientFromDoc(snap))
        setLoading(false)
      },
      (err) => {
        console.error('useClient error:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [orgId, clientId])

  return { client, loading, error }
}
