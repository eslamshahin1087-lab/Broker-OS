import AppIcon from '../components/AppIcon'
import PageHeader from '../components/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../services/AuthContext'
import { POLICY_TYPES, listenToPolicies, policyTypeLabel } from '../services/policies'

const typeColors = { auto: '#2563eb', health: '#16a34a', life: '#7c3aed', property: '#f59e0b', other: '#6b7280' }

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export default function Finance() {
  const { organizationId } = useAuth()
  const [policies, setPolicies] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) return
    const unsub = listenToPolicies(
      organizationId,
      (rows) => setPolicies(rows),
      (err) => { console.error(err); setError('تعذر تحميل البيانات المالية') }
    )
    return unsub
  }, [organizationId])

  const totals = useMemo(() => {
    if (!policies) return null
    const totalCommission = policies.reduce((sum, p) => sum + (Number(p.commissionAmount) || 0), 0)
    const totalPremium = policies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0)
    return { count: policies.length, totalCommission, totalPremium }
  }, [policies])

  const monthlyData = useMemo(() => {
    if (!policies) return []
    const buckets = {}
    policies.forEach((p) => {
      if (!p.createdAt?.seconds) return
      const d = new Date(p.createdAt.seconds * 1000)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!buckets[key]) buckets[key] = { key, month: monthNames[d.getMonth()], year: d.getFullYear(), commission: 0, sortKey: d.getFullYear() * 12 + d.getMonth() }
      buckets[key].commission += Number(p.commissionAmount) || 0
    })
    return Object.values(buckets)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6)
      .map((b) => ({ name: `${b.month}`, commission: b.commission }))
  }, [policies])

  const typeData = useMemo(() => {
    if (!policies) return []
    const buckets = {}
    policies.forEach((p) => {
      const key = p.type || 'other'
      if (!buckets[key]) buckets[key] = { name: policyTypeLabel(key), value: 0, key }
      buckets[key].value += Number(p.premiumAmount) || 0
    })
    return Object.values(buckets).filter((b) => b.value > 0)
  }, [policies])

  if (error) return <p className="error-text">{error}</p>
  if (!policies) return <p style={{ color: 'var(--color-text-muted)' }}>...جارٍ التحميل</p>

  if (policies.length === 0) {
    return (
      <div>
        <h2>المالية</h2>
        <div className="empty-state">هتظهر هنا الرسوم البيانية والأرقام المالية أول ما تضيف بوالص.</div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="finance"
        eyebrow="Financial Intelligence"
        title="المالية"
        description="صورة مالية للمحفظة والعمولات والأقساط وتوزيع النشاط."
      />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{totals.totalCommission.toLocaleString()} ج.م</div>
          <div className="stat-label">إجمالي العمولة</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.totalPremium.toLocaleString()} ج.م</div>
          <div className="stat-label">إجمالي الأقساط</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.count}</div>
          <div className="stat-label">عدد البوالص</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {totals.count ? Math.round(totals.totalCommission / totals.count).toLocaleString() : 0} ج.م
          </div>
          <div className="stat-label">متوسط العمولة / بوليصة</div>
        </div>
      </div>

      <h3>العمولة الشهرية (آخر 6 شهور)</h3>
      <div className="card" style={{ height: 220, padding: '14px 8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Tajawal' }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ج.م`} />
            <Bar dataKey="commission" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3>توزيع الأقساط حسب نوع التأمين</h3>
      <div className="card" style={{ height: 240, padding: '14px 8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d) => d.name}>
              {typeData.map((entry) => (
                <Cell key={entry.key} fill={typeColors[entry.key] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ج.م`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
