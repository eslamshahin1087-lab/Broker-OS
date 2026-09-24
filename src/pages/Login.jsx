import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(
        mode === 'login'
          ? 'بيانات الدخول غير صحيحة'
          : 'تعذر إنشاء الحساب — تأكد إن الإيميل صحيح وكلمة المرور 6 أحرف على الأقل'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '90px auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>📋</div>
        <h2 style={{ marginBottom: 4 }}>Broker OS</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
          {mode === 'login' ? 'سجّل دخولك لمتابعة أعمالك' : 'إنشاء حساب جديد'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? '...جارٍ التنفيذ' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
        {mode === 'login' ? (
          <>
            مفيش حساب؟{' '}
            <button
              onClick={() => { setMode('register'); setError('') }}
              className="btn-ghost"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}
            >
              إنشاء حساب جديد
            </button>
          </>
        ) : (
          <>
            عندك حساب بالفعل؟{' '}
            <button
              onClick={() => { setMode('login'); setError('') }}
              className="btn-ghost"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}
            >
              تسجيل الدخول
            </button>
          </>
        )}
      </p>
    </div>
  )
}
