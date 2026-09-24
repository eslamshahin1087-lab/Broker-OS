const PRIORITY_WEIGHT = {
  critical: 1,
  warning: 2,
  info: 3,
}

const DAY_MS = 1000 * 60 * 60 * 24

function parseDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function timestampValue(value) {
  if (!value) return 0
  if (typeof value?.seconds === 'number') return value.seconds
  const parsed = parseDate(value)
  return parsed ? Math.floor(parsed.getTime() / 1000) : 0
}

function daysSince(value, today = new Date()) {
  const date = parseDate(value)
  if (!date) return null

  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  return Math.max(0, Math.round((start.getTime() - date.getTime()) / DAY_MS))
}

export function daysUntil(value, today = new Date()) {
  const target = parseDate(value)
  if (!target) return null

  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  return Math.round((target.getTime() - start.getTime()) / DAY_MS)
}

function action(id, priority, title, description, link, entity = '', entityId = '', dueDate = null) {
  return {
    id,
    priority,
    title,
    description,
    link,
    entity,
    entityId,
    dueDate,
  }
}

function priorityScore(item) {
  const base = (PRIORITY_WEIGHT[item.priority] || 9) * 1000
  const urgency = item.dueDate ? Math.max(0, (daysUntil(item.dueDate) ?? 999) + 50) : 100
  return base + urgency
}

function addAction(actions, seen, item) {
  if (seen.has(item.id)) return
  seen.add(item.id)
  actions.push(item)
}

export function getNextBestActions({
  leads = [],
  opportunities = [],
  quotes = [],
  policies = [],
  claims = [],
  payments = [],
} = {}) {
  const actions = []
  const seen = new Set()

  leads.forEach((lead) => {
    if (!lead.clientId && ['qualified', 'proposal'].includes(lead.status)) {
      addAction(actions, seen, action(
        `lead-link-${lead.id}`,
        'warning',
        'أكمل ربط الـLead بعميل',
        lead.name || 'Lead مؤهل بدون عميل مرتبط.',
        '/leads',
        'lead',
        lead.id,
      ))
    }

    if (lead.clientId && ['qualified', 'proposal'].includes(lead.status)) {
      addAction(actions, seen, action(
        `lead-followup-${lead.id}`,
        'info',
        'تابع العميل المحتمل',
        lead.name || 'Lead يحتاج متابعة قبل تحويله إلى فرصة.',
        '/leads',
        'lead',
        lead.id,
      ))
    }
  })

  opportunities.forEach((opportunity) => {
    if (!opportunity.clientId) {
      addAction(actions, seen, action(
        `opportunity-client-${opportunity.id}`,
        'warning',
        'أكمل بيانات الفرصة',
        opportunity.name || opportunity.clientName || 'الفرصة تحتاج ربطًا بعميل.',
        '/opportunities',
        'opportunity',
        opportunity.id,
      ))
      return
    }

    if (['new', 'contacted'].includes(opportunity.stage)) {
      addAction(actions, seen, action(
        `opportunity-followup-${opportunity.id}`,
        'info',
        'متابعة فرصة',
        `${opportunity.clientName || 'عميل'} · الفرصة لم تصل بعد إلى عرض سعر.`,
        '/opportunities',
        'opportunity',
        opportunity.id,
      ))
    }
  })

  quotes.forEach((quote) => {
    const daysToExpiry = daysUntil(quote.validUntil)

    if (!quote.clientId) {
      addAction(actions, seen, action(
        `quote-client-${quote.id}`,
        'warning',
        'أكمل ربط عرض السعر',
        'عرض السعر غير مرتبط بعميل.',
        '/quotes',
        'quote',
        quote.id,
        quote.validUntil || null,
      ))
      return
    }

    if (daysToExpiry !== null && daysToExpiry < 0 && !['accepted', 'rejected'].includes(quote.status)) {
      addAction(actions, seen, action(
        `quote-expired-${quote.id}`,
        'critical',
        'عرض سعر منتهي',
        `${quote.clientName || 'العميل'} · انتهت صلاحية العرض ويحتاج قرارًا جديدًا.`,
        '/quotes',
        'quote',
        quote.id,
        quote.validUntil,
      ))
      return
    }

    if (daysToExpiry !== null && daysToExpiry <= 3 && !['accepted', 'rejected'].includes(quote.status)) {
      addAction(actions, seen, action(
        `quote-expiring-${quote.id}`,
        'warning',
        'عرض سعر على وشك الانتهاء',
        `${quote.clientName || 'العميل'} · متبقي ${Math.max(0, daysToExpiry)} يوم.`,
        '/quotes',
        'quote',
        quote.id,
        quote.validUntil,
      ))
    }

    if (['submitted', 'received'].includes(quote.status) && daysToExpiry !== null && daysToExpiry > 3) {
      addAction(actions, seen, action(
        `quote-followup-${quote.id}`,
        'info',
        'تابع عرض السعر',
        `${quote.clientName || 'العميل'} · العرض ما زال في دورة المتابعة.`,
        '/quotes',
        'quote',
        quote.id,
        quote.validUntil || null,
      ))
    }
  })

  policies.forEach((policy) => {
    if (!policy.clientId) {
      addAction(actions, seen, action(
        `policy-client-${policy.id}`,
        'warning',
        'أكمل ربط البوليصة',
        policy.policyNumber ? `بوليصة #${policy.policyNumber} بدون عميل مرتبط.` : 'بوليصة بدون عميل مرتبط.',
        '/policies',
        'policy',
        policy.id,
      ))
      return
    }

    const daysLeft = daysUntil(policy.renewalDate)
    if (daysLeft !== null && daysLeft < 0) {
      addAction(actions, seen, action(
        `policy-overdue-renewal-${policy.id}`,
        'critical',
        'تجديد متأخر',
        `${policy.clientName || 'عميل'} · البوليصة تجاوزت تاريخ التجديد.`,
        '/renewals',
        'policy',
        policy.id,
        policy.renewalDate,
      ))
    } else if (daysLeft !== null && daysLeft <= 7) {
      addAction(actions, seen, action(
        `policy-renewal-urgent-${policy.id}`,
        'critical',
        'ابدأ التجديد فورًا',
        `${policy.clientName || 'عميل'} · متبقي ${daysLeft} يوم.`,
        '/renewals',
        'policy',
        policy.id,
        policy.renewalDate,
      ))
    } else if (daysLeft !== null && daysLeft <= 30) {
      addAction(actions, seen, action(
        `policy-renewal-${policy.id}`,
        'warning',
        'جهّز التجديد',
        `${policy.clientName || 'عميل'} · متبقي ${daysLeft} يوم.`,
        '/renewals',
        'policy',
        policy.id,
        policy.renewalDate,
      ))
    }
  })

  claims.forEach((claim) => {
    if (!claim.policyId) {
      addAction(actions, seen, action(
        `claim-policy-${claim.id}`,
        'warning',
        'اربط المطالبة بالبوليصة',
        claim.clientName || 'المطالبة لا تحتوي على مرجع للبوليصة.',
        '/claims',
        'claim',
        claim.id,
      ))
      return
    }

    const age = daysSince(claim.updatedAt || claim.createdAt)
    if (['reported', 'submitted'].includes(claim.status)) {
      addAction(actions, seen, action(
        `claim-followup-${claim.id}`,
        age !== null && age >= 5 ? 'warning' : 'info',
        'تابع المطالبة',
        `${claim.clientName || 'عميل'} · الحالة تحتاج متابعة.`,
        '/claims',
        'claim',
        claim.id,
      ))
    } else if (claim.status === 'under_review' && (age ?? 0) >= 3) {
      addAction(actions, seen, action(
        `claim-review-${claim.id}`,
        'warning',
        'مراجعة مطالبة معلقة',
        `${claim.clientName || 'عميل'} · المطالبة ما زالت قيد المراجعة.`,
        '/claims',
        'claim',
        claim.id,
      ))
    }
  })

  payments.forEach((payment) => {
    if (!payment.policyId) {
      addAction(actions, seen, action(
        `payment-policy-${payment.id}`,
        'warning',
        'اربط الدفعة بالبوليصة',
        payment.clientName || 'دفعة غير مرتبطة ببوليصة.',
        '/payments',
        'payment',
        payment.id,
      ))
      return
    }

    const daysLate = daysUntil(payment.dueDate)
    if (payment.status === 'overdue' || (daysLate !== null && daysLate < 0 && payment.status !== 'paid')) {
      addAction(actions, seen, action(
        `payment-overdue-${payment.id}`,
        'critical',
        'تحصيل متأخر',
        `${payment.clientName || 'عميل'} · توجد دفعة متأخرة.`,
        '/payments',
        'payment',
        payment.id,
        payment.dueDate || null,
      ))
    } else if (daysLate !== null && daysLate <= 7 && payment.status !== 'paid') {
      addAction(actions, seen, action(
        `payment-due-soon-${payment.id}`,
        'warning',
        'دفعة مستحقة قريبًا',
        `${payment.clientName || 'عميل'} · الاستحقاق خلال ${Math.max(0, daysLate)} يوم.`,
        '/payments',
        'payment',
        payment.id,
        payment.dueDate,
      ))
    } else if (['pending', 'partial'].includes(payment.status)) {
      addAction(actions, seen, action(
        `payment-followup-${payment.id}`,
        'info',
        'متابعة تحصيل',
        `${payment.clientName || 'عميل'} · دفعة تحتاج متابعة.`,
        '/payments',
        'payment',
        payment.id,
        payment.dueDate || null,
      ))
    }
  })

  return actions
    .sort((a, b) => {
      const scoreDiff = priorityScore(a) - priorityScore(b)
      if (scoreDiff !== 0) return scoreDiff
      return (timestampValue(b.dueDate) || 0) - (timestampValue(a.dueDate) || 0)
    })
    .slice(0, 8)
}

function indexByClient(items) {
  const index = new Map()
  items.forEach((item) => {
    if (!item.clientId) return
    if (!index.has(item.clientId)) index.set(item.clientId, [])
    index.get(item.clientId).push(item)
  })
  return index
}

export function calculateWorkflowHealth({
  leads = [],
  opportunities = [],
  quotes = [],
  policies = [],
  claims = [],
  payments = [],
} = {}) {
  const checks = [
    ...leads
      .filter((item) => item.status !== 'lost')
      .map((item) => Boolean(item.clientId)),
    ...opportunities
      .filter((item) => !['won', 'lost'].includes(item.stage))
      .map((item) => Boolean(item.clientId)),
    ...quotes
      .filter((item) => !['accepted', 'rejected'].includes(item.status))
      .map((item) => Boolean(item.clientId)),
    ...policies.map((item) => Boolean(item.clientId)),
    ...claims
      .filter((item) => !['paid', 'rejected'].includes(item.status))
      .map((item) => Boolean(item.clientId && item.policyId)),
    ...payments
      .filter((item) => item.status !== 'paid')
      .map((item) => Boolean(item.clientId && item.policyId)),
  ]

  if (!checks.length) return { score: 100, connected: 0, total: 0 }

  const connected = checks.filter(Boolean).length
  return {
    score: Math.round((connected / checks.length) * 100),
    connected,
    total: checks.length,
  }
}

export function buildClient360(clientId, {
  leads = [],
  opportunities = [],
  quotes = [],
  policies = [],
  claims = [],
  payments = [],
} = {}) {
  const indexes = {
    leads: indexByClient(leads),
    opportunities: indexByClient(opportunities),
    quotes: indexByClient(quotes),
    policies: indexByClient(policies),
    claims: indexByClient(claims),
    payments: indexByClient(payments),
  }

  const clientLeads = indexes.leads.get(clientId) || []
  const clientOpportunities = indexes.opportunities.get(clientId) || []
  const clientQuotes = indexes.quotes.get(clientId) || []
  const clientPolicies = indexes.policies.get(clientId) || []
  const clientClaims = indexes.claims.get(clientId) || []
  const clientPayments = indexes.payments.get(clientId) || []

  return {
    leads: clientLeads,
    opportunities: clientOpportunities,
    quotes: clientQuotes,
    policies: clientPolicies,
    claims: clientClaims,
    payments: clientPayments,
    premium: clientPolicies.reduce((sum, item) => sum + (Number(item.premiumAmount) || 0), 0),
    commission: clientPolicies.reduce((sum, item) => sum + (Number(item.commissionAmount) || 0), 0),
    openClaims: clientClaims.filter((item) => !['paid', 'rejected'].includes(item.status)).length,
    outstandingPayments: clientPayments
      .filter((item) => item.status !== 'paid')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
  }
}
