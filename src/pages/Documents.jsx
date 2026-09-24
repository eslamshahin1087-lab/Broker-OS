import AppIcon from '../components/AppIcon'
import PageHeader from '../components/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { canManageOperations } from '../constants/roles'
import { listenToClients } from '../services/clients'
import { listenToPolicies } from '../services/policies'
import { DOCUMENT_TYPES, addDocument, deleteDocument, listenToDocuments } from '../services/documents'

const emptyForm = {
  fileName: '',
  documentType: 'policy',
  entityType: '',
  entityId: '',
  documentUrl: '',
  notes: '',
}

function label(type) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label || 'مستند'
}

export default function Documents() {
  const { user, organizationId, role } = useAuth()
  const [documents, setDocuments] = useState([])
  const [clients, setClients] = useState([])
  const [policies, setPolicies] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) return undefined
    const unsubDocs = listenToDocuments(organizationId, setDocuments, (err) => {
      console.error(err)
      setError('تعذر تحميل المستندات')
    })
    const unsubClients = listenToClients(organizationId, setClients)
    const unsubPolicies = listenToPolicies(organizationId, setPolicies)
    return () => {
      unsubDocs?.()
      unsubClients?.()
      unsubPolicies?.()
    }
  }, [organizationId])

  const references = useMemo(() => {
    if (form.entityType === 'client') return clients.map((item) => ({ id: item.id, name: item.name }))
    if (form.entityType === 'policy') {
      return policies.map((item) => ({
        id: item.id,
        name: (item.policyNumber ? '#' + item.policyNumber + ' · ' : '') + (item.clientName || 'بوليصة'),
      }))
    }
    return []
  }, [form.entityType, clients, policies])

  const change = (e) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'entityType' ? { entityId: '' } : {}) }))
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.fileName.trim() || !form.documentUrl.trim()) {
      setError('اكتب اسم المستند والرابط')
      return
    }
    setSaving(true)
    try {
      const ref = references.find((item) => item.id === form.entityId)
      await addDocument(organizationId, user.uid, { ...form, entityName: ref?.name || '' })
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError(err.message === 'DOCUMENT_URL_MUST_BE_HTTPS'
        ? 'رابط المستند يجب أن يبدأ بـ https://'
        : 'تعذر حفظ المستند')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (document) => {
    if (!confirm('متأكد إنك عايز تحذف سجل المستند ده؟')) return
    try {
      await deleteDocument(organizationId, user.uid, document)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف المستند')
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="documents"
        eyebrow="Document Registry"
        title="المستندات"
        description="روابط المستندات ومراجعها داخل العميل والبوليصة بدون تخزين الملفات على Firebase Storage."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <AppIcon name={showForm ? 'close' : 'plus'} size={14} />
            {showForm ? 'إلغاء' : 'مستند'}
          </button>
        }
      />

      {error && <div className="alert">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={save} style={{ marginBottom: 18 }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">External Document Link</span>
              <h2>إضافة مستند</h2>
            </div>
          </div>
          <input name="fileName" value={form.fileName} onChange={change} className="field" placeholder="اسم المستند *" required />
          <input name="documentUrl" type="url" value={form.documentUrl} onChange={change} className="field" placeholder="https://..." required />

          <div className="commercial-form-grid">
            <select name="documentType" value={form.documentType} onChange={change} className="field">
              {DOCUMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select name="entityType" value={form.entityType} onChange={change} className="field">
              <option value="">بدون ربط بسجل</option>
              <option value="client">ربط بعميل</option>
              <option value="policy">ربط ببوليصة</option>
            </select>
            <select name="entityId" value={form.entityId} onChange={change} className="field" disabled={!form.entityType}>
              <option value="">{form.entityType ? 'اختر السجل المرتبط' : 'اختر نوع الربط أولًا'}</option>
              {references.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <textarea name="notes" value={form.notes} onChange={change} rows={3} className="field" placeholder="ملاحظات على المستند" />
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? '...جارٍ الحفظ' : 'حفظ المستند'}
          </button>
        </form>
      )}

      {documents.length === 0 ? (
        <div className="card empty-state">لا توجد مستندات بعد.</div>
      ) : (
        <div className="commercial-grid">
          {documents.map((document) => (
            <div key={document.id} className="card commercial-card">
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{label(document.documentType)}</span>
                  <h3>{document.fileName}</h3>
                </div>
              </div>
              <div className="commercial-meta">
                {document.entityName && <span>{document.entityName}</span>}
                <span>رابط HTTPS</span>
              </div>
              {document.notes && <p className="subtitle">{document.notes}</p>}
              <div className="hero-actions" style={{ marginTop: 10 }}>
                <a href={document.documentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">فتح المستند</a>
                {canManageOperations(role) && (
                  <button type="button" className="btn btn-danger-outline" onClick={() => remove(document)}>حذف</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
