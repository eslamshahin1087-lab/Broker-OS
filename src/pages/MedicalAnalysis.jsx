
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import AppIcon from '../components/AppIcon'
import PageHeader from '../components/PageHeader'
import { listenToClients } from '../services/clients'
import { listenToPolicies } from '../services/policies'
import { useAuth } from '../services/AuthContext'
import {
  CSV_HEADERS,
  analyzeMedicalUtilization,
  normalizeUtilizationRow,
  parseCsv,
} from '../services/medicalUtilizationEngine'
import { buildMedicalAnalysisLink } from '../services/relationshipEngine'
import { downloadMedicalAnalysisPdf } from '../services/medicalAnalysisPdf'
import logo from '../assets/logo.png'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyRow(searchClientId = '', searchPolicyId = '') {
  return {
    date: todayISO(),
    memberId: '',
    memberName: '',
    policyId: searchPolicyId,
    provider: '',
    specialty: '',
    category: 'كشف',
    service: '',
    quantity: 1,
    unitCost: '',
    totalCost: '',
    networkStatus: 'in-network',
    approvalStatus: 'approved',
    visitType: 'outpatient',
  }
}

function money(value) {
  return Number(value || 0).toLocaleString('ar-EG') + ' ج.م'
}

export default function MedicalAnalysis() {
  const { organizationId } = useAuth()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [policies, setPolicies] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(() => emptyRow(searchParams.get('clientId') || '', searchParams.get('policyId') || ''))
  const [csvError, setCsvError] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)

  const clientId = searchParams.get('clientId') || ''
  const policyId = searchParams.get('policyId') || ''

  useEffect(() => {
    if (!organizationId) return undefined
    const unsubClients = listenToClients(organizationId, setClients, (error) => console.error(error))
    const unsubPolicies = listenToPolicies(organizationId, setPolicies, (error) => console.error(error))
    return () => {
      unsubClients?.()
      unsubPolicies?.()
    }
  }, [organizationId])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      memberId: clientId || current.memberId,
      policyId: policyId || current.policyId,
    }))
  }, [clientId, policyId])

  const report = useMemo(() => analyzeMedicalUtilization(rows), [rows])

  const selectedClient = clients.find((item) => item.id === form.memberId)
  const selectedPolicy = policies.find((item) => item.id === form.policyId)

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'memberId') {
        const client = clients.find((item) => item.id === value)
        next.memberName = client?.name || ''
      }
      if (name === 'policyId') {
        const policy = policies.find((item) => item.id === value)
        if (policy?.clientId) {
          next.memberId = policy.clientId
          next.memberName = policy.clientName || clients.find((item) => item.id === policy.clientId)?.name || ''
        }
      }
      if (name === 'quantity' || name === 'unitCost') {
        const quantity = Math.max(1, Number(name === 'quantity' ? value : next.quantity) || 1)
        const unitCost = Math.max(0, Number(name === 'unitCost' ? value : next.unitCost) || 0)
        next.totalCost = String(Math.round(quantity * unitCost * 100) / 100)
      }
      return next
    })
  }

  const addRow = (event) => {
    event.preventDefault()
    setRows((current) => [...current, normalizeUtilizationRow(form, current.length)])
    setForm(emptyRow(clientId, policyId))
  }

  const removeRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  const clearRows = () => {
    setRows([])
    setCsvError('')
  }

  const handleCsv = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setCsvError('')
    try {
      const text = await file.text()
      const imported = parseCsv(text)
      if (!imported.length) {
        setCsvError('لم يتم العثور على صفوف صالحة في ملف CSV.')
        return
      }
      setRows((current) => [
        ...current,
        ...imported.map((row, index) => normalizeUtilizationRow(row, current.length + index)),
      ])
    } catch (error) {
      console.error(error)
      setCsvError('تعذر قراءة ملف CSV.')
    }
  }

  const downloadTemplate = () => {
    const sample = CSV_HEADERS.join(',') + '\n' +
      '2026-09-24,001,مثال,policy-001,Hospital A,باطنة,كشف,كشف طبي,1,250,250,in-network,approved,outpatient\n'
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'broker-os-medical-utilization-template.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const exportPdf = async () => {
    if (!rows.length) return
    setPdfBusy(true)
    try {
      await downloadMedicalAnalysisPdf({
        ...report,
        logoUrl: logo,
        generatedAt: new Date().toLocaleString('ar-EG'),
      })
    } catch (error) {
      console.error(error)
      setCsvError('تعذر إنشاء ملف PDF من المتصفح. جرّب إعادة فتح الصفحة ثم المحاولة مرة أخرى.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="page-shell medical-analysis-page">
      <PageHeader
        icon="medical"
        eyebrow="Medical Intelligence"
        title="تحليل الاستهلاكات الطبية"
        description="محرك تحليل ذكي محلي يحول حركات الاستهلاك إلى تقرير تشغيلي ومالي شامل وقابل للمراجعة."
        action={
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length || pdfBusy}>
            <AppIcon name="documents" size={14} />
            {pdfBusy ? 'جارٍ إعداد PDF...' : 'تحميل التقرير PDF'}
          </button>
        }
      />

      <div className="medical-ai-banner">
        <div className="medical-ai-badge"><AppIcon name="spark" size={16} /> AI Analytics</div>
        <div>
          <strong>تحليل قابل للتفسير - Privacy First</strong>
          <span>البيانات تتم معالجتها محليًا داخل المتصفح في هذه النسخة ولا يتم إرسال الاستهلاكات الطبية إلى خدمة خارجية.</span>
        </div>
      </div>

      {(clientId || policyId) && (
        <div className="medical-context-link">
          <AppIcon name="shield" size={15} />
          <span>
            {selectedClient ? 'العميل: ' + selectedClient.name : ''}
            {selectedClient && selectedPolicy ? ' · ' : ''}
            {selectedPolicy ? 'البوليصة: ' + (selectedPolicy.policyNumber || selectedPolicy.id) : ''}
          </span>
          <Link to={buildMedicalAnalysisLink({})}>إلغاء الربط</Link>
        </div>
      )}

      <section className="card medical-entry-card">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-head-icon"><AppIcon name="plus" size={15} /></span>
            <div>
              <span className="eyebrow">Data Intake</span>
              <h2>إدخال حركة استهلاك</h2>
            </div>
          </div>
          <div className="medical-entry-actions">
            <label className="btn btn-secondary medical-file-btn">
              <AppIcon name="documents" size={13} />
              استيراد CSV
              <input type="file" accept=".csv,text/csv" onChange={handleCsv} />
            </label>
            <button className="btn btn-secondary" type="button" onClick={downloadTemplate}>
              نموذج CSV
            </button>
          </div>
        </div>

        <form className="medical-form-grid" onSubmit={addRow}>
          <input className="field" type="date" name="date" value={form.date} onChange={update} required />
          <select className="field" name="memberId" value={form.memberId} onChange={update}>
            <option value="">المستفيد / العميل</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          <input className="field" name="memberName" placeholder="اسم المستفيد إذا لم يوجد بالعملاء" value={form.memberName} onChange={update} />
          <select className="field" name="policyId" value={form.policyId} onChange={update}>
            <option value="">البوليصة</option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {(policy.clientName || 'عميل') + (policy.policyNumber ? ' · #' + policy.policyNumber : '')}
              </option>
            ))}
          </select>
          <input className="field" name="provider" placeholder="مقدم الخدمة" value={form.provider} onChange={update} />
          <input className="field" name="specialty" placeholder="التخصص" value={form.specialty} onChange={update} />
          <input className="field" name="category" placeholder="الفئة: كشف / دواء / أشعة..." value={form.category} onChange={update} />
          <input className="field" name="service" placeholder="الخدمة" value={form.service} onChange={update} />
          <input className="field" type="number" min="1" step="1" name="quantity" placeholder="الكمية" value={form.quantity} onChange={update} />
          <input className="field" type="number" min="0" step="0.01" name="unitCost" placeholder="سعر الوحدة" value={form.unitCost} onChange={update} />
          <input className="field" type="number" min="0" step="0.01" name="totalCost" placeholder="الإجمالي" value={form.totalCost} onChange={update} required />
          <select className="field" name="networkStatus" value={form.networkStatus} onChange={update}>
            <option value="in-network">داخل الشبكة</option>
            <option value="out-of-network">خارج الشبكة</option>
          </select>
          <select className="field" name="approvalStatus" value={form.approvalStatus} onChange={update}>
            <option value="approved">معتمد</option>
            <option value="pending">معلق</option>
            <option value="under-review">تحت المراجعة</option>
            <option value="rejected">مرفوض</option>
          </select>
          <select className="field" name="visitType" value={form.visitType} onChange={update}>
            <option value="outpatient">خارجي</option>
            <option value="inpatient">داخلي</option>
            <option value="emergency">طوارئ</option>
          </select>
          <div className="medical-form-submit">
            <button className="btn btn-primary btn-block" type="submit">
              <AppIcon name="plus" size={14} /> إضافة للحساب
            </button>
          </div>
        </form>

        {csvError && <div className="alert" style={{ marginTop: 12 }}>{csvError}</div>}
      </section>

      <section className="medical-toolbar card">
        <div>
          <span className="eyebrow">Current Dataset</span>
          <strong>{rows.length} حركة</strong>
          <span>التحليل الحالي مؤقت حتى نهاية جلسة المتصفح.</span>
        </div>
        <div className="medical-toolbar-actions">
          <button className="btn btn-secondary" type="button" onClick={clearRows} disabled={!rows.length}>
            <AppIcon name="trash" size={13} /> مسح البيانات
          </button>
          <Link className="btn btn-secondary" to={buildMedicalAnalysisLink({ clientId: '', policyId: '' })}>
            <AppIcon name="spark" size={13} /> تحليل جديد
          </Link>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="card empty-state-visual medical-empty-state">
          <span className="empty-state-icon"><AppIcon name="medical" size={19} /></span>
          <strong>ابدأ بإدخال الاستهلاكات</strong>
          <span>أدخل الحركات يدويًا أو ارفع CSV وسيتم بناء التقرير تلقائيًا.</span>
          <small>لا يتم حفظ البيانات الطبية تلقائيًا في Firestore في هذه النسخة.</small>
        </section>
      ) : (
        <>
          <section className="stat-grid medical-kpi-grid">
            <Metric label="إجمالي الإنفاق" value={money(report.totalCost)} hint="Gross utilization" icon="finance" />
            <Metric label="الحركات" value={report.totalEvents} hint="Events" icon="activities" />
            <Metric label="المستفيدون" value={report.totalMembers} hint="Members" icon="clients" />
            <Metric label="متوسط الحركة" value={money(report.avgEventCost)} hint="Average event cost" icon="payments" />
          </section>

          <section className="dashboard-grid">
            <div className="card">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Executive Summary</span>
                  <h2>الملخص التنفيذي</h2>
                </div>
                <span className="mini-kpi">{report.networkOutRate}% خارج الشبكة</span>
              </div>
              <div className="medical-insight-list">
                {report.insights.map((item, index) => (
                  <div className="medical-insight" key={index}>
                    <span className="medical-insight-index">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Controls</span>
                  <h2>المؤشرات التشغيلية</h2>
                </div>
                <span className="workflow-score">{report.approvalRate}%</span>
              </div>
              <div className="medical-control-grid">
                <Metric label="داخل/خارج الشبكة" value={report.networkOutRate + '%'} hint="Out-of-network" />
                <Metric label="الموافقات" value={report.approvalRate + '%'} hint="Approved" />
                <Metric label="معلّق" value={report.pendingCount} hint="Pending" />
                <Metric label="مرفوض" value={report.rejectedCount} hint="Rejected" />
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <AnalysisList title="أعلى الفئات" eyebrow="Categories" items={report.topCategories} />
            <AnalysisList title="أعلى مقدمي الخدمة" eyebrow="Providers" items={report.topProviders} />
          </section>

          <section className="dashboard-grid">
            <AnalysisList title="أعلى الخدمات" eyebrow="Services" items={report.topServices} />
            <AnalysisList title="أعلى المستفيدين" eyebrow="Members" items={report.topMembers} />
          </section>

          <section className="dashboard-grid">
            <TrendPanel items={report.monthlyTrend} />
            <div className="card">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Data Quality</span>
                  <h2>جودة البيانات وتركيز الإنفاق</h2>
                </div>
                <span className="workflow-score">{report.completenessRate}%</span>
              </div>
              <div className="medical-control-grid">
                <Metric label="اكتمال البيانات" value={report.completenessRate + '%'} hint="Required fields" />
                <Metric label="تركيز أعلى 10%" value={report.topMemberCostShare + '%'} hint="Top members cost share" />
                <Metric label="الوسيط" value={money(report.medianEventCost)} hint="Median event cost" />
                <Metric label="حد المراجعة" value={money(report.highCostThreshold)} hint="High-cost threshold" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <span className="eyebrow">Review Queue</span>
                <h2>مؤشرات تحتاج مراجعة</h2>
              </div>
              <span className="mini-kpi">{report.anomalyRows.length} مؤشر</span>
            </div>

            {report.anomalyRows.length === 0 ? (
              <div className="empty-state">لا توجد مؤشرات شاذة بارزة وفق قواعد التحليل الحالية.</div>
            ) : (
              <div className="medical-review-list">
                {report.anomalyRows.map((row) => (
                  <div className="medical-review-row" key={row.id}>
                    <div>
                      <strong>{row.memberName || row.memberId || 'مستفيد غير محدد'}</strong>
                      <span>{row.service || row.category || 'خدمة'} · {row.provider || 'مقدم خدمة غير محدد'}</span>
                    </div>
                    <div className="medical-review-score">{row.score}%</div>
                    <div className="medical-review-reasons">{row.reasons.join(' · ')}</div>
                    <span className="gold-value">{money(row.totalCost)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <span className="eyebrow">Recommendations</span>
                <h2>التوصيات التشغيلية</h2>
              </div>
              <AppIcon name="spark" size={18} />
            </div>
            <div className="recommendation-list">
              {report.recommendations.map((item, index) => (
                <div className="recommendation-card" key={index}>
                  <AppIcon name="check" size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card medical-policy-note">
            <div>
              <span className="eyebrow">Usage & Terms</span>
              <h2>سياسة الاستخدام والحدود</h2>
              <p>هذا التقرير أداة تحليل تشغيلي وإحصائي وليس تشخيصًا طبيًا أو قرارًا آليًا في المطالبات. يجب مراجعة المؤشرات بشريًا قبل أي قرار مالي أو تشغيلي.</p>
            </div>
            <Link to="/legal" className="btn btn-secondary">الشروط والسياسات</Link>
          </section>

          <div className="medical-data-table card">
            <div className="section-head">
              <div>
                <span className="eyebrow">Dataset</span>
                <h2>البيانات المدخلة</h2>
              </div>
              <span className="mini-kpi">{rows.length} صف</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>التاريخ</th><th>المستفيد</th><th>مقدم الخدمة</th><th>الفئة</th><th>الخدمة</th><th>الإجمالي</th><th></th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>{row.memberName || row.memberId || '—'}</td>
                      <td>{row.provider || '—'}</td>
                      <td>{row.category || '—'}</td>
                      <td>{row.service || '—'}</td>
                      <td>{money(row.totalCost)}</td>
                      <td><button className="icon-button-danger" type="button" onClick={() => removeRow(row.id)}><AppIcon name="trash" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, hint, icon }) {
  return (
    <div className="stat-card medical-metric">
      {icon && <div className="stat-icon"><AppIcon name={icon} size={18} /></div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  )
}

function TrendPanel({ items = [] }) {
  const max = Math.max(1, ...(items.map((item) => item.cost)))
  return (
    <div className="card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Monthly Trend</span>
          <h2>اتجاه الإنفاق الشهري</h2>
        </div>
      </div>
      <div className="medical-ranking-list">
        {items.length === 0 ? <div className="empty-state">أدخل تواريخ كافية لعرض الاتجاه الشهري.</div> : items.slice(-8).map((item) => (
          <div className="medical-ranking-item" key={item.month}>
            <div className="medical-ranking-copy">
              <strong>{item.month}</strong>
              <span>{item.events} حركة</span>
            </div>
            <div className="medical-ranking-bar">
              <span style={{ width: Math.max(4, (item.cost / max) * 100) + '%' }} />
            </div>
            <b>{money(item.cost)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisList({ title, eyebrow, items = [] }) {
  const max = Math.max(1, ...(items.map((item) => item.cost)))
  return (
    <div className="card">
      <div className="section-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="medical-ranking-list">
        {items.length === 0 ? <div className="empty-state">لا توجد بيانات كافية.</div> : items.map((item) => (
          <div className="medical-ranking-item" key={item.key}>
            <div className="medical-ranking-copy">
              <strong>{item.key}</strong>
              <span>{item.events} حركة · {item.share}% من الإنفاق</span>
            </div>
            <div className="medical-ranking-bar">
              <span style={{ width: Math.max(4, (item.cost / max) * 100) + '%' }} />
            </div>
            <b>{money(item.cost)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
