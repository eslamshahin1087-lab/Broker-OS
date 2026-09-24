import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 16, color: 'var(--text-white)' }}>جاري التحميل...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}