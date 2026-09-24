import { useEffect, useState } from 'react'
import { subscribeToClients } from '../services/clients'

export function useClients(orgId, options = {}) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orgId) {
      setClients([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToClients(
      orgId,
      (data) => {
        setClients(data)
        setLoading(false)
      },
      {
        ...options,
        onError: (err) => {
          console.error('useClients error:', err)
          setError(err)
          setLoading(false)
        },
      }
    )

    return () => unsubscribe()
  }, [orgId, options.status])

  return { clients, loading, error }
}
