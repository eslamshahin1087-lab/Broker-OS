import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function RequireAuth() {
  const { user, profile, loading, logout } = useAuth()

  if (loading) {
    return <p style={{ padding: 24, color: 'var(--text-white)' }}>جارٍ تحميل الحساب...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.status === 'suspended') {
    return (
      <div style={{ padding: 24, maxWidth: 520, margin: '60px auto' }} dir="rtl">
        <div className="card">
          <h2>الحساب موقوف</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
            تم تعليق هذا الحساب من إدارة المنصة. تواصل مع مسؤول المنصة لإعادة التفعيل.
          </p>
          <button className="btn btn-primary" onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>
    )
  }

  if (!profile?.organizationId) {
    return (
      <div style={{ padding: 24, maxWidth: 520, margin: '60px auto' }} dir="rtl">
        <div className="card">
          <h2>تعذر تحميل ملف الحساب</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            تم تسجيل الدخول، لكن لم يتم تحميل بيانات المنظمة. سجّل الخروج ثم أعد الدخول.
          </p>
          <button className="btn btn-primary" onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
