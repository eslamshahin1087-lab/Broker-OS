import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function RequirePlatformAdmin() {
  const { user, loading, platformAdmin } = useAuth()

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>...جارٍ التحقق من صلاحيات المنصة</div>
  }

  if (!user || !platformAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
