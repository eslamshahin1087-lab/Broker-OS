import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  listenToPlatformFeatures,
  listenToPlatformOrganization,
} from './platformAdmin'

const PlatformFeaturesContext = createContext(null)

export function PlatformFeaturesProvider({ children }) {
  const { organizationId } = useAuth()
  const [globalFeatures, setGlobalFeatures] = useState({})
  const [organizationOverrides, setOrganizationOverrides] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenToPlatformFeatures(
      (rows) => {
        const map = {}
        rows.forEach((item) => {
          map[item.key] = item.enabled !== false
        })
        setGlobalFeatures(map)
        setLoading(false)
      },
      (error) => {
        console.error('تعذر تحميل مزايا المنصة', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!organizationId) {
      setOrganizationOverrides({})
      return undefined
    }

    const unsubscribe = listenToPlatformOrganization(
      organizationId,
      (organization) => {
        setOrganizationOverrides(organization?.featureOverrides || {})
      },
      (error) => console.error('تعذر تحميل مزايا المؤسسة', error)
    )

    return unsubscribe
  }, [organizationId])

  const features = useMemo(() => {
    const merged = { ...globalFeatures }

    Object.entries(organizationOverrides).forEach(([key, enabled]) => {
      if (globalFeatures[key] !== false) {
        merged[key] = enabled !== false
      }
    })

    return merged
  }, [globalFeatures, organizationOverrides])

  const value = useMemo(() => ({
    features,
    loading,
    isEnabled: (key) => features[key] !== false,
  }), [features, loading])

  return (
    <PlatformFeaturesContext.Provider value={value}>
      {children || <Outlet />}
    </PlatformFeaturesContext.Provider>
  )
}

export function usePlatformFeatures() {
  return useContext(PlatformFeaturesContext)
}
