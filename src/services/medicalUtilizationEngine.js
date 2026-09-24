
const DAY_MS = 86400000

function number(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(number(value) * factor) / factor
}

function parseDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthKey(value) {
  const date = parseDate(value)
  return date ? date.toISOString().slice(0, 7) : 'غير محدد'
}

function percent(part, total) {
  return total > 0 ? round((part / total) * 100, 1) : 0
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + number(selector(row)), 0)
}

function average(rows, selector) {
  return rows.length ? sum(rows, selector) / rows.length : 0
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  if (!sorted.length) return 0
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function quantile(values, q) {
  const sorted = [...values].sort((a, b) => a - b)
  if (!sorted.length) return 0
  const position = (sorted.length - 1) * q
  const base = Math.floor(position)
  const rest = position - base
  return sorted[base + 1] === undefined
    ? sorted[base]
    : sorted[base] + rest * (sorted[base + 1] - sorted[base])
}

function group(rows, keySelector) {
  const map = new Map()
  rows.forEach((row) => {
    const key = String(keySelector(row) || 'غير محدد').trim() || 'غير محدد'
    if (!map.has(key)) {
      map.set(key, { key, events: 0, cost: 0, quantity: 0, members: new Set() })
    }
    const item = map.get(key)
    item.events += 1
    item.cost += number(row.totalCost)
    item.quantity += number(row.quantity, 1)
    if (row.memberId || row.memberName) item.members.add(row.memberId || row.memberName)
  })

  return [...map.values()]
    .map((item) => ({
      ...item,
      cost: round(item.cost),
      avgCost: round(item.cost / Math.max(item.events, 1)),
      members: item.members.size,
      share: 0,
    }))
    .sort((a, b) => b.cost - a.cost)
}

function withShare(items, totalCost) {
  return items.map((item) => ({ ...item, share: percent(item.cost, totalCost) }))
}

export const CSV_HEADERS = [
  'date',
  'memberId',
  'memberName',
  'policyId',
  'provider',
  'specialty',
  'category',
  'service',
  'quantity',
  'unitCost',
  'totalCost',
  'networkStatus',
  'approvalStatus',
  'visitType',
]

export function normalizeUtilizationRow(input = {}, index = 0) {
  const quantity = Math.max(1, number(input.quantity, 1))
  const unitCost = Math.max(0, number(input.unitCost))
  const explicitTotal = number(input.totalCost)
  const totalCost = Math.max(0, explicitTotal || quantity * unitCost)

  return {
    id: input.id || 'util-' + Date.now() + '-' + index,
    date: input.date || '',
    memberId: String(input.memberId || '').trim(),
    memberName: String(input.memberName || '').trim(),
    policyId: String(input.policyId || '').trim(),
    provider: String(input.provider || '').trim(),
    specialty: String(input.specialty || '').trim(),
    category: String(input.category || '').trim(),
    service: String(input.service || '').trim(),
    quantity,
    unitCost,
    totalCost,
    networkStatus: String(input.networkStatus || 'in-network').trim(),
    approvalStatus: String(input.approvalStatus || 'approved').trim(),
    visitType: String(input.visitType || 'outpatient').trim(),
  }
}

function splitCsvLine(line) {
  const result = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function parseCsv(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const header = splitCsvLine(lines[0]).map((item) => item.toLowerCase())
  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line)
    const row = {}
    header.forEach((key, valueIndex) => {
      row[key] = values[valueIndex] ?? ''
    })
    return normalizeUtilizationRow(row, index)
  }).filter((row) => row.date || row.memberName || row.totalCost > 0)
}

export function analyzeMedicalUtilization(rows = []) {
  const normalizedRows = rows.map((row, index) => normalizeUtilizationRow(row, index))
  const totalEvents = normalizedRows.length
  const totalCost = round(sum(normalizedRows, (row) => row.totalCost))
  const totalMembers = new Set(normalizedRows.map((row) => row.memberId || row.memberName).filter(Boolean)).size
  const quantities = normalizedRows.map((row) => row.quantity)
  const costs = normalizedRows.map((row) => row.totalCost)
  const avgEventCost = round(average(normalizedRows, (row) => row.totalCost))
  const medianEventCost = round(median(costs))
  const q1 = quantile(costs, 0.25)
  const q3 = quantile(costs, 0.75)
  const iqr = Math.max(0, q3 - q1)
  const highCostThreshold = round(q3 + (1.5 * iqr))

  const memberGroups = withShare(group(normalizedRows, (row) => row.memberName || row.memberId), totalCost)
  const categoryGroups = withShare(group(normalizedRows, (row) => row.category), totalCost)
  const serviceGroups = withShare(group(normalizedRows, (row) => row.service), totalCost)
  const providerGroups = withShare(group(normalizedRows, (row) => row.provider), totalCost)
  const specialtyGroups = withShare(group(normalizedRows, (row) => row.specialty), totalCost)

  const monthlyMap = new Map()
  normalizedRows.forEach((row) => {
    const key = monthKey(row.date)
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, events: 0, cost: 0 })
    const item = monthlyMap.get(key)
    item.events += 1
    item.cost += row.totalCost
  })
  const monthlyTrend = [...monthlyMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({ ...item, cost: round(item.cost) }))

  const networkOut = normalizedRows.filter((row) => row.networkStatus === 'out-of-network').length
  const pending = normalizedRows.filter((row) => ['pending', 'under-review'].includes(row.approvalStatus)).length
  const rejected = normalizedRows.filter((row) => row.approvalStatus === 'rejected').length
  const approved = normalizedRows.filter((row) => row.approvalStatus === 'approved').length

  const anomalyRows = normalizedRows
    .map((row) => {
      const reasons = []
      if (row.totalCost >= highCostThreshold && highCostThreshold > 0) reasons.push('تكلفة مرتفعة مقارنة بتوزيع البيانات')
      if (row.quantity >= Math.max(5, quantile(quantities, 0.9))) reasons.push('تكرار/كمية مرتفعة')
      if (row.networkStatus === 'out-of-network') reasons.push('خارج الشبكة')
      if (['pending', 'under-review'].includes(row.approvalStatus)) reasons.push('بحاجة لمراجعة تشغيلية')
      return reasons.length
        ? {
            ...row,
            score: Math.min(100, reasons.length * 25 + (row.totalCost >= highCostThreshold ? 20 : 0)),
            reasons,
          }
        : null
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.totalCost - a.totalCost)
    .slice(0, 12)

  const duplicateMap = new Map()
  normalizedRows.forEach((row) => {
    const key = [row.date, row.memberName || row.memberId, row.provider, row.service, row.totalCost].join('|')
    duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1)
  })
  const duplicateCandidates = normalizedRows.filter((row) => {
    const key = [row.date, row.memberName || row.memberId, row.provider, row.service, row.totalCost].join('|')
    return (duplicateMap.get(key) || 0) > 1
  }).slice(0, 12)

  const top10Cost = memberGroups.slice(0, Math.max(1, Math.ceil(memberGroups.length * 0.1)))
    .reduce((sumValue, item) => sumValue + item.cost, 0)

  const requiredFields = ['date', 'memberName', 'provider', 'category', 'service']
  const missingFields = Object.fromEntries(
    requiredFields.map((field) => [
      field,
      normalizedRows.filter((row) => !String(row[field] || '').trim()).length,
    ])
  )
  const missingFieldTotal = Object.values(missingFields).reduce((total, value) => total + value, 0)
  const completenessRate = totalEvents
    ? round(Math.max(0, 100 - (missingFieldTotal / (totalEvents * requiredFields.length)) * 100), 1)
    : 0

  const recommendations = []
  if (percent(networkOut, totalEvents) >= 15) recommendations.push('مراجعة نسبة الاستخدام خارج الشبكة وربط مقدمي الخدمة البدلاء الأكثر كفاءة.')
  if (percent(pending + rejected, totalEvents) >= 10) recommendations.push('تشديد متابعة الموافقات والحالات المعلقة والمرفوضة وربطها بخطوات تشغيلية واضحة.')
  if (percent(top10Cost, totalCost) >= 50 && memberGroups.length >= 3) recommendations.push('تفعيل متابعة مركزة للحالات الأعلى استهلاكًا قبل دورات التجديد أو إعادة التسعير.')
  if (anomalyRows.length) recommendations.push('مراجعة المؤشرات الشاذة يدويًا قبل اتخاذ أي قرار مالي أو تعويضي.')
  if (duplicateCandidates.length) recommendations.push('فحص السجلات المتشابهة لاحتمال التكرار أو الإدخال المزدوج قبل اعتماد الإجماليات.')
  if (!recommendations.length) recommendations.push('البيانات الحالية مستقرة تحليليًا ولا تظهر مؤشرات تشغيلية بارزة؛ استمر في جمع البيانات بشكل منتظم.')

  const trendDirection = monthlyTrend.length >= 2
    ? monthlyTrend[monthlyTrend.length - 1].cost - monthlyTrend[monthlyTrend.length - 2].cost
    : 0

  const insights = [
    'إجمالي الإنفاق الطبي المسجل ' + totalCost.toLocaleString('ar-EG') + ' جنيه عبر ' + totalEvents + ' حركة استهلاك.',
    totalMembers ? 'متوسط الإنفاق لكل مستفيد مسجل ' + round(totalCost / totalMembers).toLocaleString('ar-EG') + ' جنيه.' : 'لم يتم رصد مستفيدين واضحين في البيانات.',
    categoryGroups[0] ? 'أعلى فئة إنفاق هي ' + categoryGroups[0].key + ' بنسبة ' + categoryGroups[0].share + '% من إجمالي التكلفة.' : 'لا توجد فئات إنفاق كافية للتحليل.',
    providerGroups[0] ? 'أعلى مقدم خدمة من حيث التكلفة هو ' + providerGroups[0].key + ' بقيمة ' + providerGroups[0].cost.toLocaleString('ar-EG') + ' جنيه.' : 'لا توجد بيانات كافية عن مقدمي الخدمة.',
    trendDirection > 0
      ? 'الإنفاق في آخر شهر أعلى من الشهر السابق بمقدار ' + Math.abs(round(trendDirection)).toLocaleString('ar-EG') + ' جنيه.'
      : trendDirection < 0
        ? 'الإنفاق في آخر شهر أقل من الشهر السابق بمقدار ' + Math.abs(round(trendDirection)).toLocaleString('ar-EG') + ' جنيه.'
        : 'لا يوجد اتجاه شهري واضح من البيانات الحالية.',
  ]

  return {
    rows: normalizedRows,
    totalEvents,
    totalCost,
    totalMembers,
    avgEventCost,
    medianEventCost,
    networkOutCount: networkOut,
    networkOutRate: percent(networkOut, totalEvents),
    pendingCount: pending,
    rejectedCount: rejected,
    approvedCount: approved,
    approvalRate: percent(approved, totalEvents),
    highCostThreshold,
    topMemberCostShare: percent(top10Cost, totalCost),
    completenessRate,
    missingFields,
    topCategories: categoryGroups.slice(0, 6),
    topServices: serviceGroups.slice(0, 6),
    topProviders: providerGroups.slice(0, 6),
    topSpecialties: specialtyGroups.slice(0, 6),
    topMembers: memberGroups.slice(0, 8),
    monthlyTrend,
    anomalyRows,
    duplicateCandidates,
    recommendations,
    insights,
  }
}
