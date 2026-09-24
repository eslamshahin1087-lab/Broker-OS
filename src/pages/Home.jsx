import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import FeatureGate from '../components/FeatureGate'
import { listenToClients } from '../services/clients'
import { listenToLeads } from '../services/leadService'
import { getUpcomingRenewals, listenToPolicies } from '../services/policies'
import { listenToOpportunities, stageColor, stageLabel } from '../services/opportunities'
import { listenToQuotes } from '../services/quotes'
import { listenToClaims } from '../services/claims'
import { listenToPayments } from '../services/payments'
import {
  calculateWorkflowHealth,
  getNextBestActions,
} from '../services/workflowEngine'

const money = (value) => Math.round(Number(value) || 0).toLocaleString('ar-EG') + ' ج.م'

const priorityLabel = {
  critical: 'عاجل',
  warning: 'مهم',
  info: 'متابعة',
}

export default function Home() {
  const { organizationId, profile } = useAuth()
  const [clients, setClients] = useState([])
  const [policies, setPolicies] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [leads, setLeads] = useState([])
  const [quotes, setQuotes] = useState([])
  const [claims, setClaims] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return undefined
    }

    let ready = 0
    const markReady = () => {
      ready += 1
      if (ready >= 7) setLoading(false)
    }

    const onError = (err) => {
      console.error(err)
      setError('تعذر تحميل جزء من بيانات لوحة التحكم')
      markReady()
    }

    const unsubs = [
      listenToClients(organizationId, (rows) => { setClients(rows); markReady() }, onError),
      listenToPolicies(organizationId, (rows) => { setPolicies(rows); markReady() }, onError),
      listenToOpportunities(organizationId, (rows) => { setOpportunities(rows); markReady() }, onError),
      listenToLeads(organizationId, (rows) => { setLeads(rows); markReady() }, onError),
      listenToQuotes(organizationId, (rows) => { setQuotes(rows); markReady() }, onError),
      listenToClaims(organizationId, (rows) => { setClaims(rows); markReady() }, onError),
      listenToPayments(organizationId, (rows) => { setPayments(rows); markReady() }, onError),
    ]

    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [organizationId])

  const metrics = useMemo(() => {
    const activePolicies = policies.filter((p) => p.status !== 'cancelled').length
    const commission = policies.reduce((sum, p) => sum + (Number(p.commissionAmount) || 0), 0)
    const premium = policies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0)
    const openOpportunities = opportunities.filter((p) => !['won', 'lost'].includes(p.stage)).length
    const wonOpportunities = opportunities.filter((p) => p.stage === 'won').length
    const pendingQuotes = quotes.filter((quote) => !['accepted', 'rejected'].includes(quote.status)).length
    const openClaims = claims.filter((claim) => !['paid', 'rejected'].includes(claim.status)).length
    const pendingPayments = payments
      .filter((payment) => payment.status !== 'paid')
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const renewals = getUpcomingRenewals(policies, 30)

    return {
      clients: clients.length,
      activePolicies,
      commission,
      premium,
      openOpportunities,
      wonOpportunities,
      pendingQuotes,
      openClaims,
      pendingPayments,
      renewals,
    }
  }, [clients, policies, opportunities, quotes, claims, payments])

  const intelligence = useMemo(() => ({
    actions: getNextBestActions({
      leads,
      opportunities,
      quotes,
      policies,
      claims,
      payments,
    }),
    health: calculateWorkflowHealth({
      opportunities,
      quotes,
      policies,
      claims,
      payments,
    }),
  }), [leads, opportunities, quotes, policies, claims, payments])

  const recentOpportunities = opportunities.slice(0, 5)
  const greeting = profile?.displayName || profile?.email?.split('@')[0] || 'وسيط التأمين'

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Broker OS · Command Center</span>
          <h1>مرحبًا {greeting}</h1>
          <p>كل ما يحتاج انتباهك اليوم في شاشة واحدة — والبيانات تتحول تلقائيًا إلى خطوات تشغيلية.</p>
        </div>
        <div className="hero-actions">
          <Link to="/clients" className="btn btn-primary">+ عميل جديد</Link>
          <Link to="/opportunities" className="btn btn-secondary">+ فرصة جديدة</Link>
        </div>
      </section>

      {error && <div className="alert alert-warning">{error}</div>}

      {loading ? (
        <div className="card loading-card">جارٍ تجهيز لوحة التحكم...</div>
      ) : (
        <>
          <section className="stat-grid">
            <MetricCard label="العملاء" value={metrics.clients} hint="إجمالي العملاء" icon="👥" />
            <MetricCard label="البوالص النشطة" value={metrics.activePolicies} hint="Portfolio" icon="🛡️" />
            <MetricCard label="إجمالي الأقساط" value={money(metrics.premium)} hint="Gross premium" icon="💰" />
            <MetricCard label="العمولات" value={money(metrics.commission)} hint="Calculated commission" icon="📈" />
          </section>

          <FeatureGate feature="workflowIntelligence">
            <section className="dashboard-grid insight-grid">
            <div className="card smart-panel">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Next Best Action</span>
                  <h2>ماذا يجب أن أفعل الآن؟</h2>
                </div>
                <span className="mini-kpi">{intelligence.actions.length} خطوة</span>
              </div>

              {intelligence.actions.length === 0 ? (
                <div className="smart-empty">
                  <strong>لا توجد مهام حرجة الآن.</strong>
                  <span>الـworkflow الحالي متوازن، ويمكنك التركيز على النمو وإضافة فرص جديدة.</span>
                </div>
              ) : (
                <div className="smart-action-list">
                  {intelligence.actions.map((item) => (
                    <Link to={item.link} className="smart-action" key={item.id}>
                      <span className={'smart-action-priority priority-' + item.priority}>{priorityLabel[item.priority]}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                      <span className="smart-action-arrow">←</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card workflow-health">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Workflow Intelligence</span>
                  <h2>سلامة الربط بين الوحدات</h2>
                </div>
                <span className="workflow-score">{intelligence.health.score}%</span>
              </div>

              <div className="workflow-meter">
                <div style={{ width: intelligence.health.score + '%' }} />
              </div>

              <p>
                {intelligence.health.total
                  ? `تم ربط ${intelligence.health.connected} من ${intelligence.health.total} علاقة تشغيلية مكتشفة بين العملاء والفرص والعروض والبوالص والمطالبات والمدفوعات.`
                  : 'أضف أول بيانات تشغيلية ليبدأ محرك الربط الذكي في اكتشاف العلاقات.'}
              </p>

              <div className="workflow-chips">
                <Link to="/clients">العملاء</Link>
                <Link to="/opportunities">الفرص</Link>
                <Link to="/quotes">العروض</Link>
                <Link to="/policies">البوالص</Link>
                <Link to="/claims">المطالبات</Link>
                <Link to="/payments">المدفوعات</Link>
              </div>
            </div>
            </section>
          </FeatureGate>

          <section className="dashboard-grid">
            <div className="card">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Needs Attention</span>
                  <h2>يحتاج انتباهك</h2>
                </div>
                <Link to="/policies" className="text-link">كل البوالص</Link>
              </div>

              <div className="attention-list">
                <AttentionRow title="تجديدات خلال 30 يوم" value={metrics.renewals.length} tone={metrics.renewals.length ? 'warning' : 'success'} link="/renewals" />
                <AttentionRow title="فرص مفتوحة" value={metrics.openOpportunities} tone="info" link="/opportunities" />
                <AttentionRow title="عملاء محتملون" value={leads.filter((lead) => !['won', 'lost'].includes(lead.status)).length} tone="neutral" link="/leads" />
                <AttentionRow title="عروض تحتاج متابعة" value={metrics.pendingQuotes} tone="info" link="/quotes" />
                <AttentionRow title="مطالبات مفتوحة" value={metrics.openClaims} tone="warning" link="/claims" />
                <AttentionRow title="مدفوعات مستحقة" value={money(metrics.pendingPayments)} tone="neutral" link="/payments" />
              </div>
            </div>

            <div className="card">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Pipeline</span>
                  <h2>آخر الفرص</h2>
                </div>
                <span className="mini-kpi">{metrics.wonOpportunities} فوز</span>
              </div>

              {recentOpportunities.length === 0 ? (
                <div className="empty-state">لا توجد فرص حتى الآن.</div>
              ) : (
                <div className="compact-list">
                  {recentOpportunities.map((item) => (
                    <div className="compact-row" key={item.id}>
                      <div>
                        <strong>{item.clientName || 'عميل'}</strong>
                        <span>{item.type || 'تأمين'}</span>
                      </div>
                      <span className="badge" style={{ background: stageColor(item.stage) }}>{stageLabel(item.stage)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <span className="eyebrow">Renewal Radar</span>
                <h2>أقرب التجديدات</h2>
              </div>
              <Link to="/renewals" className="text-link">إدارة التجديدات</Link>
            </div>

            {metrics.renewals.length === 0 ? (
              <div className="empty-state">لا توجد تجديدات مستحقة خلال 30 يومًا.</div>
            ) : (
              <div className="renewal-grid">
                {metrics.renewals.slice(0, 6).map((policy) => (
                  <div className="renewal-card" key={policy.id}>
                    <span>{policy.clientName || 'عميل'}</span>
                    <strong>{policy.daysLeft} يوم</strong>
                    <small>{money(policy.premiumAmount)}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, hint, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  )
}

function AttentionRow({ title, value, tone, link }) {
  return (
    <Link to={link} className="attention-row">
      <span className={'status-dot status-' + tone} />
      <span>{title}</span>
      <strong>{value}</strong>
      <span>→</span>
    </Link>
  )
}
