import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { listenToPlatformFeatures } from './platformAdmin'

const PlatformFeaturesContext = createContext(null)

export function PlatformFeaturesProvider({ children }) {
  const [features, setFeatures] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenToPlatformFeatures(
      (rows) => {
        const map = {}
        rows.forEach((item) => {
          map[item.key] = item.enabled !== false
        })
        setFeatures(map)
        setLoading(false)
      },
      (error) => {
        console.error('تعذر تحميل مزايا المنصة', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const value = useMemo(() => ({
    features,
    loading,
    isEnabled: (key) => features[key] !== false,
  }), [features, loading])

  return (
    <PlatformFeaturesContext.Provider value={value}>
      {children}
    </PlatformFeaturesContext.Provider>
  )
}

export function usePlatformFeatures() {
  return useContext(PlatformFeaturesContext)
}
