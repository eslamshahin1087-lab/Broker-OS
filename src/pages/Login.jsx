import { useMemo, useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import AppIcon from '../components/AppIcon'
import { useAuth } from '../services/AuthContext'
import { auth } from '../services/firebase'

const STEPS = [
  { id: 1, title: 'بياناتك', caption: 'بيانات شخصية ووسائل التواصل', icon: 'user' },
  { id: 2, title: 'الوساطة', caption: 'بيانات المكتب أو الشركة', icon: 'briefcase' },
  { id: 3, title: 'ملف العمل', caption: 'التخصصات وحجم النشاط', icon: 'building' },
  { id: 4, title: 'الدخول', caption: 'بيانات الوصول للحساب', icon: 'lock' },
]

const SPECIALIZATIONS = [
  ['auto', 'سيارات'],
  ['medical', 'طبي'],
  ['life', 'حياة'],
  ['property', 'ممتلكات'],
  ['marine', 'بحري'],
  ['engineering', 'هندسي'],
  ['liability', 'مسؤوليات'],
  ['other', 'أخرى'],
]

const initialRegistration = {
  fullName: '',
  phone: '',
  whatsapp: '',
  jobTitle: '',
  city: '',
  address: '',
  brokerageName: '',
  brokerageType: 'broker',
  licenseNumber: '',
  website: '',
  yearsInBusiness: '',
  teamSize: '1-5',
  specializations: [],
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
}

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

export default function Login({ initialMode = 'login' }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registration, setRegistration] = useState(initialRegistration)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)

  const progress = useMemo(() => Math.round((step / STEPS.length) * 100), [step])

  const updateRegistration = (field, value) => {
    setRegistration((current) => ({ ...current, [field]: value }))
  }

  const toggleSpecialization = (value) => {
    setRegistration((current) => ({
      ...current,
      specializations: current.specializations.includes(value)
        ? current.specializations.filter((item) => item !== value)
        : [...current.specializations, value],
    }))
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setStep(1)
    setError('')
    setNotice('')
    navigate(nextMode === 'register' ? '/register' : '/login', { replace: true })
  }

  const validateStep = (currentStep) => {
    const required = {
      1: [
        ['fullName', 'الاسم بالكامل'],
        ['phone', 'رقم الموبايل'],
        ['jobTitle', 'المسمى الوظيفي'],
        ['city', 'المدينة'],
      ],
      2: [
        ['brokerageName', 'اسم شركة/مكتب الوساطة'],
        ['address', 'العنوان'],
      ],
      3: [],
      4: [
        ['email', 'البريد الإلكتروني'],
      ],
    }

    const missing = required[currentStep].find(([key]) => !String(registration[key] || '').trim())
    if (missing) {
      setError('من فضلك أكمل حقل ' + missing[1] + '.')
      return false
    }

    if (currentStep === 3 && registration.specializations.length === 0) {
      setError('اختر مجال تأمين واحد على الأقل.')
      return false
    }

    if (currentStep === 4) {
      if (registration.password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
        return false
      }

      if (registration.password !== registration.confirmPassword) {
        setError('تأكيد كلمة المرور غير مطابق.')
        return false
      }

      if (!registration.acceptTerms) {
        setError('يجب الموافقة على شروط استخدام Broker OS.')
        return false
      }
    }

    setError('')
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, STEPS.length))
      setError('')
    }
  }

  const previousStep = () => {
    setError('')
    setStep((current) => Math.max(current - 1, 1))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        if (!validateStep(4)) {
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
        <div className="auth-brand-mark"><AppIcon name="briefcase" size={19} /></div>
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
              : 'أكمل ملفك المهني مرة واحدة لنجهّز بيئة الوساطة الخاصة بك ونبني تجربة تناسب نشاطك.'}
          </p>

          <div className="auth-benefits">
            <div><span><AppIcon name="clients" size={15} /></span><strong>CRM موحد</strong><small>رحلة العميل من Lead حتى الوثيقة.</small></div>
            <div><span><AppIcon name="opportunities" size={15} /></span><strong>ربط ذكي</strong><small>العروض والفرص والبوالص في مسار واحد.</small></div>
            <div><span><AppIcon name="activities" size={15} /></span><strong>تشغيل يومي</strong><small>مهام وتنبيهات مبنية على البيانات.</small></div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="card auth-card">
          <div className="auth-card-head">
            <div>
              <span className="eyebrow">{mode === 'login' ? 'Sign in' : 'Onboarding'}</span>
              <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
            </div>
            <span className="auth-free-badge">Free</span>
          </div>

          {mode === 'register' && (
            <>
              <div className="auth-steps">
                {STEPS.map((item) => (
                  <div key={item.id} className={'auth-step' + (item.id === step ? ' active' : '') + (item.id < step ? ' complete' : '')}>
                    <span><AppIcon name={item.icon} size={14} /></span>
                    <div><strong>{item.title}</strong><small>{item.caption}</small></div>
                  </div>
                ))}
              </div>

              <div className="auth-progress">
                <div style={{ width: progress + '%' }} />
              </div>
            </>
          )}

          {mode === 'register' ? (
            <>
              {step === 1 && (
                <div className="auth-step-panel">
                  <AuthField icon="user" label="الاسم بالكامل" value={registration.fullName} onChange={(value) => updateRegistration('fullName', value)} required />
                  <div className="auth-form-grid">
                    <AuthField icon="phone" label="رقم الموبايل" value={registration.phone} onChange={(value) => updateRegistration('phone', value)} required inputMode="tel" />
                    <AuthField icon="phone" label="WhatsApp" value={registration.whatsapp} onChange={(value) => updateRegistration('whatsapp', value)} inputMode="tel" />
                    <AuthField icon="briefcase" label="المسمى الوظيفي" value={registration.jobTitle} onChange={(value) => updateRegistration('jobTitle', value)} required />
                    <AuthField icon="map" label="المدينة" value={registration.city} onChange={(value) => updateRegistration('city', value)} required />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="auth-step-panel">
                  <AuthField icon="building" label="اسم شركة/مكتب الوساطة" value={registration.brokerageName} onChange={(value) => updateRegistration('brokerageName', value)} required />
                  <div className="auth-form-grid">
                    <label className="auth-field">
                      <span className="auth-field-icon"><AppIcon name="building" size={15} /></span>
                      <span className="auth-field-body"><small>نوع النشاط</small>
                        <select className="auth-native-input" value={registration.brokerageType} onChange={(event) => updateRegistration('brokerageType', event.target.value)}>
                          <option value="broker">وسيط تأمين</option>
                          <option value="corporate_broker">شركة وساطة</option>
                          <option value="agency">مكتب / وكالة</option>
                          <option value="individual">نشاط فردي</option>
                        </select>
                      </span>
                    </label>
                    <AuthField icon="license" label="رقم الترخيص" value={registration.licenseNumber} onChange={(value) => updateRegistration('licenseNumber', value)} />
                    <AuthField icon="map" label="عنوان المكتب" value={registration.address} onChange={(value) => updateRegistration('address', value)} required />
                    <AuthField icon="email" label="الموقع الإلكتروني" value={registration.website} onChange={(value) => updateRegistration('website', value)} type="url" />
                    <AuthField icon="briefcase" label="سنوات النشاط" value={registration.yearsInBusiness} onChange={(value) => updateRegistration('yearsInBusiness', value)} type="number" min="0" />
                    <label className="auth-field">
                      <span className="auth-field-icon"><AppIcon name="team" size={15} /></span>
                      <span className="auth-field-body"><small>حجم الفريق</small>
                        <select className="auth-native-input" value={registration.teamSize} onChange={(event) => updateRegistration('teamSize', event.target.value)}>
                          <option value="1-5">1–5</option>
                          <option value="6-10">6–10</option>
                          <option value="11-25">11–25</option>
                          <option value="26-50">26–50</option>
                          <option value="50+">أكثر من 50</option>
                        </select>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="auth-step-panel">
                  <div className="auth-section-title">مجالات التأمين التي تعمل بها</div>
                  <p className="auth-helper">اختر المجالات التي تمثل نشاطك اليومي، ويمكنك تعديلها لاحقًا.</p>
                  <div className="specialization-grid">
                    {SPECIALIZATIONS.map(([value, label]) => {
                      const active = registration.specializations.includes(value)
                      return (
                        <button
                          type="button"
                          key={value}
                          className={'specialization-card' + (active ? ' active' : '')}
                          onClick={() => toggleSpecialization(value)}
                        >
                          <span><AppIcon name={value === 'auto' ? 'policies' : value === 'medical' ? 'claims' : value === 'property' ? 'building' : value === 'life' ? 'user' : 'products'} size={16} /></span>
                          <strong>{label}</strong>
                          {active && <AppIcon name="check" size={13} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="auth-step-panel">
                  <AuthField icon="email" label="البريد الإلكتروني" value={registration.email} onChange={(value) => updateRegistration('email', value)} type="email" required autoComplete="email" />
                  <div className="auth-form-grid">
                    <AuthField icon="lock" label="كلمة المرور" value={registration.password} onChange={(value) => updateRegistration('password', value)} type="password" required minLength={6} autoComplete="new-password" />
                    <AuthField icon="lock" label="تأكيد كلمة المرور" value={registration.confirmPassword} onChange={(value) => updateRegistration('confirmPassword', value)} type="password" required minLength={6} autoComplete="new-password" />
                  </div>

                  <label className="auth-terms">
                    <input type="checkbox" checked={registration.acceptTerms} onChange={(event) => updateRegistration('acceptTerms', event.target.checked)} />
                    <span>أوافق على <Link to="/legal" target="_blank" rel="noreferrer">شروط استخدام Broker OS وسياسة إدارة البيانات</Link>.</span>
                  </label>
                </div>
              )}
            </>
          ) : (
            <div className="auth-step-panel">
              <AuthField icon="email" label="البريد الإلكتروني" value={email} onChange={setEmail} type="email" required autoComplete="email" />
              <AuthField icon="lock" label="كلمة المرور" value={password} onChange={setPassword} type="password" required minLength={6} autoComplete="current-password" />
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
          {notice && <p className="auth-success">{notice}</p>}

          {mode === 'register' ? (
            <div className="auth-actions-row">
              {step > 1 ? (
                <button type="button" className="btn btn-secondary" onClick={previousStep}>السابق</button>
              ) : <span />}
              {step < STEPS.length ? (
                <button type="button" className="btn btn-primary" onClick={nextStep}>التالي <AppIcon name="next" size={14} /></button>
              ) : (
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? '...جارٍ إنشاء الحساب' : 'إنشاء مساحة العمل'}
                </button>
              )}
            </div>
          ) : (
            <button type="submit" disabled={submitting} className="btn btn-primary btn-block auth-submit">
              {submitting ? '...جارٍ الدخول' : 'تسجيل الدخول'}
            </button>
          )}

          {mode === 'login' && (
            <button type="button" onClick={handleReset} disabled={resetting} className="btn auth-reset">
              <AppIcon name="lock" size={14} />
              {resetting ? '...جارٍ الإرسال' : 'نسيت كلمة المرور؟'}
            </button>
          )}
        </form>
      </div>

      <p className="auth-switch">
        {mode === 'login' ? (
          <>مفيش حساب؟ <button type="button" onClick={() => switchMode('register')}>إنشاء حساب جديد <AppIcon name="next" size={13} /></button></>
        ) : (
          <>عندك حساب بالفعل؟ <button type="button" onClick={() => switchMode('login')}>تسجيل الدخول</button></>
        )}
      </p>
    </div>
  )
}

function AuthField({
  icon,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  ...rest
}) {
  return (
    <label className="auth-field">
      <span className="auth-field-icon"><AppIcon name={icon} size={15} /></span>
      <span className="auth-field-body">
        <small>{label}{required ? ' *' : ''}</small>
        <input
          className="auth-native-input"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          {...rest}
        />
      </span>
    </label>
  )
}
