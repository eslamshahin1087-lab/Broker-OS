import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { auth } from '../services/firebase'

function authErrorMessage(code, mode) {
  const messages = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'auth/too-many-requests': 'تم إيقاف المحاولات مؤقتًا. حاول مرة أخرى لاحقًا.',
    'auth/email-already-in-use': 'هذا البريد مستخدم بالفعل.',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
    'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    'auth/network-request-failed': 'تعذر الاتصال بالخدمة. تحقق من اتصال الإنترنت.',
  }

  return messages[code] || (mode === 'login'
    ? 'تعذر تسجيل الدخول. حاول مرة أخرى.'
    : 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.')
}

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      setError(authErrorMessage(err.code, mode))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!email.trim()) {
      setError('اكتب البريد الإلكتروني أولًا لإرسال رابط إعادة تعيين كلمة المرور.')
      return
    }

    setError('')
    setNotice('')
    setResetting(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setNotice('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.')
    } catch (err) {
      console.error(err)
      setError(authErrorMessage(err.code, 'login'))
    } finally {
      setResetting(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '70px auto', padding: '0 16px' }} dir="rtl">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 34, marginBottom: 4 }}>◈</div>
        <h2 style={{ marginBottom: 4 }}>Broker OS</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
          {mode === 'login' ? 'مركز تشغيل أعمال وسيط التأمين' : 'إنشاء حساب Broker OS'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />

        {error && <p className="error-text">{error}</p>}
        {notice && <p style={{ color: 'var(--success)', fontSize: 13 }}>{notice}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? '...جارٍ التنفيذ' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="btn"
            style={{ width: '100%', marginTop: 8, background: 'transparent', color: 'var(--primary-blue-2)' }}
          >
            {resetting ? '...جارٍ الإرسال' : 'نسيت كلمة المرور؟'}
          </button>
        )}
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
        {mode === 'login' ? (
          <>
            مفيش حساب؟{' '}
            <button
              onClick={() => { setMode('register'); setError(''); setNotice('') }}
              className="btn-ghost"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, color: 'var(--primary-blue-2)' }}
            >
              إنشاء حساب جديد
            </button>
          </>
        ) : (
          <>
            عندك حساب بالفعل؟{' '}
            <button
              onClick={() => { setMode('login'); setError(''); setNotice('') }}
              className="btn-ghost"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, color: 'var(--primary-blue-2)' }}
            >
              تسجيل الدخول
            </button>
          </>
        )}
      </p>
    </div>
  )
}
