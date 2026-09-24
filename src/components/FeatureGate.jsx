import { Navigate, Outlet } from 'react-router-dom'
import { usePlatformFeatures } from '../services/PlatformFeaturesContext'

export default function FeatureGate({ feature, children }) {
  const { loading, isEnabled } = usePlatformFeatures()

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>...جارٍ تحميل المزايا</div>
  }

  if (!isEnabled(feature)) {
    return <Navigate to="/" replace />
  }

  if (children) return children
  return <Outlet />
}
