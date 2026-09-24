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

const initialRegistration = {
  fullName: '',
  phone: '',
  jobTitle: '',
  brokerageName: '',
  brokerageType: 'broker',
  city: '',
  licenseNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registration, setRegistration] = useState(initialRegistration)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)

  const updateRegistration = (field, value) => {
    setRegistration((current) => ({ ...current, [field]: value }))
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        const requiredFields = [
          ['fullName', 'الاسم بالكامل'],
          ['phone', 'رقم الموبايل'],
          ['jobTitle', 'المسمى الوظيفي'],
          ['brokerageName', 'اسم شركة/مكتب الوساطة'],
          ['city', 'المدينة'],
          ['email', 'البريد الإلكتروني'],
        ]

        const missing = requiredFields.find(([key]) => !registration[key].trim())
        if (missing) {
          setError(`من فضلك أكمل حقل ${missing[1]}.`)
          setSubmitting(false)
          return
        }

        if (registration.password.length < 6) {
          setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
          setSubmitting(false)
          return
        }

        if (registration.password !== registration.confirmPassword) {
          setError('تأكيد كلمة المرور غير مطابق.')
          setSubmitting(false)
          return
        }

        await register(registration)
      }

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
    <div className="auth-page" dir="rtl">
      <div className="auth-brand">
        <div className="auth-brand-mark">◆</div>
        <div>
          <strong>Broker OS</strong>
          <span>Insurance Operating System</span>
        </div>
      </div>

      <div className={'auth-layout' + (mode === 'register' ? ' register-mode' : '')}>
        <section className="auth-intro">
          <span className="eyebrow">Broker OS</span>
          <h1>{mode === 'login' ? 'إدارة أعمال الوساطة من مكان واحد.' : 'أنشئ مساحة العمل الخاصة بك.'}</h1>
          <p>
            {mode === 'login'
              ? 'تسجيل العملاء، إدارة الفرص، عروض الأسعار، البوالص، المطالبات والمدفوعات في تدفق واحد.'
              : 'سجّل بياناتك المهنية مرة واحدة لنجهّز حسابك ومساحة العمل الأساسية تلقائيًا.'}
          </p>

          <div className="auth-benefits">
            <div><span>01</span><strong>CRM موحد</strong><small>رحلة العميل من Lead حتى الوثيقة.</small></div>
            <div><span>02</span><strong>ربط ذكي</strong><small>كل فرصة وعرض وبوليصة مرتبطة بسجلها.</small></div>
            <div><span>03</span><strong>رؤية تشغيلية</strong><small>مهام وتنبيهات مبنية على البيانات الفعلية.</small></div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="card auth-card">
          <div className="auth-card-head">
            <div>
              <span className="eyebrow">{mode === 'login' ? 'Sign in' : 'Get started'}</span>
              <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
            </div>
            <span className="auth-free-badge">Free</span>
          </div>

          {mode === 'register' ? (
            <>
              <div className="auth-section-title">البيانات الشخصية</div>
              <div className="auth-form-grid">
                <input
                  className="field"
                  placeholder="الاسم بالكامل *"
                  value={registration.fullName}
                  onChange={(e) => updateRegistration('fullName', e.target.value)}
                  autoComplete="name"
                  required
                />
                <input
                  className="field"
                  placeholder="رقم الموبايل *"
                  value={registration.phone}
                  onChange={(e) => updateRegistration('phone', e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
                <input
                  className="field"
                  placeholder="المسمى الوظيفي *"
                  value={registration.jobTitle}
                  onChange={(e) => updateRegistration('jobTitle', e.target.value)}
                  required
                />
                <input
                  className="field"
                  placeholder="المدينة *"
                  value={registration.city}
                  onChange={(e) => updateRegistration('city', e.target.value)}
                  required
                />
              </div>

              <div className="auth-section-title">بيانات الوساطة</div>
              <div className="auth-form-grid">
                <input
                  className="field"
                  placeholder="اسم شركة/مكتب الوساطة *"
                  value={registration.brokerageName}
                  onChange={(e) => updateRegistration('brokerageName', e.target.value)}
                  required
                />
                <select
                  className="field"
                  value={registration.brokerageType}
                  onChange={(e) => updateRegistration('brokerageType', e.target.value)}
                >
                  <option value="broker">وسيط تأمين</option>
                  <option value="corporate_broker">شركة وساطة</option>
                  <option value="agency">مكتب/وكالة</option>
                  <option value="individual">نشاط فردي</option>
                </select>
                <input
                  className="field auth-span-2"
                  placeholder="رقم الترخيص (اختياري)"
                  value={registration.licenseNumber}
                  onChange={(e) => updateRegistration('licenseNumber', e.target.value)}
                />
              </div>

              <div className="auth-section-title">بيانات الدخول</div>
              <div className="auth-form-grid">
                <input
                  type="email"
                  className="field auth-span-2"
                  placeholder="البريد الإلكتروني *"
                  value={registration.email}
                  onChange={(e) => updateRegistration('email', e.target.value)}
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  className="field"
                  placeholder="كلمة المرور *"
                  value={registration.password}
                  onChange={(e) => updateRegistration('password', e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <input
                  type="password"
                  className="field"
                  placeholder="تأكيد كلمة المرور *"
                  value={registration.confirmPassword}
                  onChange={(e) => updateRegistration('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </>
          ) : (
            <>
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
                autoComplete="current-password"
                minLength={6}
                required
              />
            </>
          )}

          {error && <p className="error-text">{error}</p>}
          {notice && <p className="auth-success">{notice}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary btn-block auth-submit">
            {submitting ? '...جارٍ التنفيذ' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء مساحة العمل'}
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
      </div>

      <p className="auth-switch">
        {mode === 'login' ? (
          <>
            مفيش حساب؟{' '}
            <button type="button" onClick={() => switchMode('register')}>إنشاء حساب جديد</button>
          </>
        ) : (
          <>
            عندك حساب بالفعل؟{' '}
            <button type="button" onClick={() => switchMode('login')}>تسجيل الدخول</button>
          </>
        )}
      </p>
    </div>
  )
}
