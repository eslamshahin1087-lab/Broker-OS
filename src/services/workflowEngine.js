const PRIORITY_WEIGHT = {
  critical: 1,
  warning: 2,
  info: 3,
}

function parseDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function daysUntil(value, today = new Date()) {
  const target = parseDate(value)
  if (!target) return null

  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function action(id, priority, title, description, link, entity = '', entityId = '') {
  return { id, priority, title, description, link, entity, entityId }
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

  leads.forEach((lead) => {
    if (!lead.clientId && ['qualified', 'proposal'].includes(lead.status)) {
      actions.push(action(
        `lead-link-${lead.id}`,
        'warning',
        'أكمل ربط الـLead بعميل',
        lead.name || 'يوجد Lead مؤهل بدون عميل مرتبط.',
        '/leads',
        'lead',
        lead.id
      ))
    }
  })

  opportunities.forEach((opportunity) => {
    if (!opportunity.clientId) {
      actions.push(action(
        `opportunity-client-${opportunity.id}`,
        'warning',
        'أكمل بيانات الفرصة',
        opportunity.name || opportunity.clientName || 'الفرصة تحتاج ربطًا بعميل.',
        '/opportunities',
        'opportunity',
        opportunity.id
      ))
      return
    }

    if (['new', 'contacted'].includes(opportunity.stage)) {
      actions.push(action(
        `opportunity-followup-${opportunity.id}`,
        'info',
        'متابعة فرصة',
        `${opportunity.clientName || 'عميل'} · الفرصة لم تصل بعد إلى عرض سعر.`,
        '/opportunities',
        'opportunity'
      ))
    }
  })

  quotes.forEach((quote) => {
    if (!quote.clientId) {
      actions.push(action(
        `quote-client-${quote.id}`,
        'warning',
        'أكمل ربط عرض السعر',
        'عرض السعر غير مرتبط بعميل.',
        '/quotes',
        'quote',
        quote.id
      ))
      return
    }

    if (['submitted', 'received'].includes(quote.status)) {
      actions.push(action(
        `quote-followup-${quote.id}`,
        'info',
        'تابع عرض السعر',
        `${quote.clientName || 'العميل'} · العرض ما زال في دورة المتابعة.`,
        '/quotes',
        'quote'
      ))
    }
  })

  policies.forEach((policy) => {
    if (!policy.clientId) {
      actions.push(action(
        `policy-client-${policy.id}`,
        'warning',
        'أكمل ربط البوليصة',
        policy.policyNumber ? `بوليصة #${policy.policyNumber} بدون عميل مرتبط.` : 'بوليصة بدون عميل مرتبط.',
        '/policies',
        'policy',
        policy.id
      ))
      return
    }

    const daysLeft = daysUntil(policy.renewalDate)
    if (daysLeft !== null && daysLeft < 0) {
      actions.push(action(
        `policy-overdue-renewal-${policy.id}`,
        'critical',
        'تجديد متأخر',
        `${policy.clientName || 'عميل'} · البوليصة تجاوزت تاريخ التجديد.`,
        '/renewals',
        'policy',
        policy.id
      ))
    } else if (daysLeft !== null && daysLeft <= 30) {
      actions.push(action(
        `policy-renewal-${policy.id}`,
        'critical',
        'ابدأ التجديد',
        `${policy.clientName || 'عميل'} · متبقي ${daysLeft} يوم.`,
        '/renewals',
        'policy'
      ))
    }
  })

  claims.forEach((claim) => {
    if (!claim.policyId) {
      actions.push(action(
        `claim-policy-${claim.id}`,
        'warning',
        'اربط المطالبة بالبوليصة',
        claim.clientName || 'المطالبة لا تحتوي على مرجع للبوليصة.',
        '/claims',
        'claim',
        claim.id
      ))
      return
    }

    if (['reported', 'submitted', 'under_review', 'approved'].includes(claim.status)) {
      actions.push(action(
        `claim-followup-${claim.id}`,
        claim.status === 'under_review' ? 'warning' : 'info',
        'تابع المطالبة',
        `${claim.clientName || 'عميل'} · الحالة تحتاج متابعة.`,
        '/claims',
        'claim'
      ))
    }
  })

  payments.forEach((payment) => {
    if (!payment.policyId) {
      actions.push(action(
        `payment-policy-${payment.id}`,
        'warning',
        'اربط المدفوعات بالبوليصة',
        payment.clientName || 'دفعة غير مرتبطة ببوليصة.',
        '/payments',
        'payment',
        payment.id
      ))
      return
    }

    const daysLate = daysUntil(payment.dueDate)
    if (payment.status === 'overdue' || (daysLate !== null && daysLate < 0 && payment.status !== 'paid')) {
      actions.push(action(
        `payment-overdue-${payment.id}`,
        'critical',
        'تحصيل متأخر',
        `${payment.clientName || 'عميل'} · توجد دفعة متأخرة.`,
        '/payments',
        'payment'
      ))
    } else if (payment.status === 'pending' || payment.status === 'partial') {
      actions.push(action(
        `payment-followup-${payment.id}`,
        'info',
        'متابعة تحصيل',
        `${payment.clientName || 'عميل'} · دفعة تحتاج متابعة.`,
        '/payments',
        'payment'
      ))
    }
  })

  return actions
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    .slice(0, 8)
}

export function calculateWorkflowHealth({
  opportunities = [],
  quotes = [],
  policies = [],
  claims = [],
  payments = [],
} = {}) {
  const checks = [
    ...opportunities.map((item) => Boolean(item.clientId)),
    ...quotes.map((item) => Boolean(item.clientId)),
    ...policies.map((item) => Boolean(item.clientId)),
    ...claims.map((item) => Boolean(item.clientId && item.policyId)),
    ...payments.map((item) => Boolean(item.clientId && item.policyId)),
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
  const clientLeads = leads.filter((item) => item.clientId === clientId)
  const clientOpportunities = opportunities.filter((item) => item.clientId === clientId)
  const clientQuotes = quotes.filter((item) => item.clientId === clientId)
  const clientPolicies = policies.filter((item) => item.clientId === clientId)
  const clientClaims = claims.filter((item) => item.clientId === clientId)
  const clientPayments = payments.filter((item) => item.clientId === clientId)

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
