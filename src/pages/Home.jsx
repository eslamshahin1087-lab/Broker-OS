import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import FeatureGate from '../components/FeatureGate'
import AppIcon from '../components/AppIcon'
import { listenToClients } from '../services/clients'
import { listenToLeads } from '../services/leadService'
import { getUpcomingRenewals, listenToPolicies } from '../services/policies'
import { listenToOpportunities, stageColor, stageLabel } from '../services/opportunities'
import { listenToQuotes } from '../services/quotes'
import { listenToClaims } from '../services/claims'
import { listenToPayments } from '../services/payments'
import {
  buildClient360,
  buildClient360Indexes,
  calculateWorkflowHealth,
  getNextBestActions,
} from '../services/workflowEngine'

const money = (value) => Math.round(Number(value) || 0).toLocaleString('ar-EG') + ' ج.م'

const priorityLabel = {
  critical: 'عاجل',
  warning: 'مهم',
  info: 'متابعة',
}

function activityLink(item) {
  const params = new URLSearchParams({
    title: item.title,
    description: item.description || '',
    priority: item.priority || 'normal',
    entityType: item.entity || '',
    entityId: item.entityId || '',
  })
  return '/activities?' + params.toString()
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

  const clientIndexes = useMemo(() => buildClient360Indexes({
    leads,
    opportunities,
    quotes,
    policies,
    claims,
    payments,
  }), [leads, opportunities, quotes, policies, claims, payments])

  const clientSpotlight = useMemo(() => (
    clients
      .map((client) => ({
        client,
        ...buildClient360(client.id, {
          indexes: clientIndexes,
        }),
      }))
      .filter((item) => item.premium > 0 || item.openClaims > 0 || item.outstandingPayments > 0)
      .sort((a, b) => (b.premium + b.outstandingPayments) - (a.premium + a.outstandingPayments))
      .slice(0, 5)
  ), [clients, clientIndexes])

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
          <Link to="/clients" className="btn btn-primary">
            <AppIcon name="plus" size={14} />
            عميل جديد
          </Link>
          <Link to="/opportunities" className="btn btn-secondary">
            <AppIcon name="opportunities" size={14} />
            فرصة جديدة
          </Link>
        </div>
      </section>

      {error && <div className="alert alert-warning">{error}</div>}

      {loading ? (
        <div className="card loading-card">جارٍ تجهيز لوحة التحكم...</div>
      ) : (
        <>
          <section className="stat-grid">
            <MetricCard label="العملاء" value={metrics.clients} hint="إجمالي العملاء" icon="clients" />
            <MetricCard label="البوالص النشطة" value={metrics.activePolicies} hint="Portfolio" icon="policies" />
            <MetricCard label="إجمالي الأقساط" value={money(metrics.premium)} hint="Gross premium" icon="finance" />
            <MetricCard label="العمولات" value={money(metrics.commission)} hint="Calculated commission" icon="payments" />
          </section>

          <section className="quick-access-card">
            <div className="quick-access-head">
              <div className="section-head-title">
                <span className="section-head-icon"><AppIcon name="spark" size={16} /></span>
                <div>
                  <span className="eyebrow">Quick Access</span>
                  <h2>الوصول السريع</h2>
                </div>
              </div>
              <span className="mini-kpi">تشغيل فوري</span>
            </div>

            <div className="quick-access-grid">
              {[
                { to: '/clients', icon: 'clients', label: 'العملاء', hint: 'إضافة ومراجعة العملاء' },
                { to: '/leads', icon: 'leads', label: 'Leads', hint: 'متابعة العملاء المحتملين' },
                { to: '/opportunities', icon: 'opportunities', label: 'الفرص', hint: 'إدارة الـPipeline' },
                { to: '/quotes', icon: 'quotes', label: 'عروض الأسعار', hint: 'إنشاء ومتابعة العروض' },
                { to: '/policies', icon: 'policies', label: 'البوالص', hint: 'إدارة المحفظة' },
                { to: '/renewals', icon: 'renewals', label: 'التجديدات', hint: 'الأولوية والاحتفاظ' },
                { to: '/claims', icon: 'claims', label: 'المطالبات', hint: 'متابعة التعويضات' },
                { to: '/activities', icon: 'activities', label: 'المهام', hint: 'تنفيذ المتابعات' },
              ].map((item) => (
                <Link to={item.to} className="quick-access-item" key={item.to}>
                  <span className="quick-access-icon"><AppIcon name={item.icon} size={18} /></span>
                  <span className="quick-access-copy">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <AppIcon name="arrowLeft" size={15} className="quick-access-arrow" />
                </Link>
              ))}
            </div>
          </section>

          <FeatureGate feature="workflowIntelligence">
            <section className="dashboard-grid insight-grid">
            <div className="card smart-panel">
              <div className="section-head">
                <div className="section-head-title">
                  <span className="section-head-icon"><AppIcon name="spark" size={16} /></span>
                  <div>
                    <span className="eyebrow">Next Best Action</span>
                    <h2>ماذا يجب أن أفعل الآن؟</h2>
                  </div>
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
                    <div className="smart-action" key={item.id}>
                      <span className={'smart-action-priority priority-' + item.priority}>{priorityLabel[item.priority]}</span>
                      <Link to={item.link} className="smart-action-content">
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </Link>
                      <div className="smart-action-tools">
                        <Link to={activityLink(item)} className="smart-task-link">+ مهمة</Link>
                        <Link to={item.link} className="smart-action-arrow">←</Link>
                      </div>
                    </div>
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

          <section className="card client-360-panel">
            <div className="section-head">
              <div>
                <span className="eyebrow">Client 360</span>
                <h2>حسابات تستحق المتابعة</h2>
              </div>
              <Link to="/clients" className="text-link">كل العملاء</Link>
            </div>

            {clientSpotlight.length === 0 ? (
              <div className="empty-state">لا توجد حسابات تشغيلية كافية لعرض Client 360 حتى الآن.</div>
            ) : (
              <div className="client-360-grid">
                {clientSpotlight.map(({ client, premium, commission, openClaims, outstandingPayments }) => (
                  <div className="client-360-card" key={client.id}>
                    <div className="client-360-head">
                      <div>
                        <strong>{client.name || 'عميل'}</strong>
                        <span>{client.phone || client.email || 'بيانات التواصل غير مكتملة'}</span>
                      </div>
                      <span className="client-360-tag">360°</span>
                    </div>
                    <div className="client-360-stats">
                      <span><small>أقساط</small><b>{money(premium)}</b></span>
                      <span><small>عمولات</small><b>{money(commission)}</b></span>
                      <span><small>مطالبات</small><b>{openClaims}</b></span>
                      <span><small>مستحقات</small><b>{money(outstandingPayments)}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <div className="empty-state empty-state-visual">
                <span className="empty-state-icon"><AppIcon name="renewals" size={19} /></span>
                <strong>المحفظة مستقرة حاليًا</strong>
                <span>لا توجد تجديدات مستحقة خلال 30 يومًا.</span>
                <Link to="/renewals" className="text-link">فتح مركز التجديدات ←</Link>
              </div>
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
      <div className="stat-icon"><AppIcon name={icon} size={19} /></div>
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
