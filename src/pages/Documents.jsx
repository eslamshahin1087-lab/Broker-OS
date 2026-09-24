import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { canManageOperations } from '../constants/roles'
import { listenToClients } from '../services/clients'
import { listenToPolicies } from '../services/policies'
import {
  DOCUMENT_TYPES,
  deleteDocument,
  listenToDocuments,
  uploadDocument,
} from '../services/documents'

const emptyForm = {
  documentType: 'policy',
  entityType: '',
  entityId: '',
  notes: '',
}

const FILE_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx,.xls,.xlsx'

function formatSize(bytes = 0) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function documentTypeLabel(type) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label || 'مستند'
}

export default function Documents() {
  const { user, organizationId, role } = useAuth()
  const [documents, setDocuments] = useState([])
  const [clients, setClients] = useState([])
  const [policies, setPolicies] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) return undefined

    const unsub = listenToDocuments(
      organizationId,
      setDocuments,
      (err) => {
        console.error(err)
        setError('تعذر تحميل المستندات')
      }
    )

    const unsubClients = listenToClients(organizationId, setClients)
    const unsubPolicies = listenToPolicies(organizationId, setPolicies)

    return () => {
      unsub?.()
      unsubClients?.()
      unsubPolicies?.()
    }
  }, [organizationId])

  const referenceOptions = useMemo(() => {
    if (form.entityType === 'client') {
      return clients.map((client) => ({
        id: client.id,
        name: client.name,
      }))
    }

    if (form.entityType === 'policy') {
      return policies.map((policy) => ({
        id: policy.id,
        name:
          (policy.policyNumber ? '#' + policy.policyNumber + ' · ' : '') +
          (policy.clientName || 'بوليصة'),
      }))
    }

    return []
  }, [form.entityType, clients, policies])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'entityType' ? { entityId: '' } : {}),
    }))
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    setError('')

    if (!file) {
      setError('اختر ملفًا أولًا')
      return
    }

    setSaving(true)

    try {
      const selectedReference = referenceOptions.find(
        (item) => item.id === form.entityId
      )

      await uploadDocument(organizationId, user.uid, file, {
        documentType: form.documentType,
        entityType: form.entityType,
        entityId: form.entityId,
        entityName: selectedReference?.name || '',
        notes: form.notes.trim(),
      })

      setFile(null)
      setForm(emptyForm)
      setShowForm(false)
      event.target.reset()
    } catch (err) {
      console.error(err)
      if (err.message === 'FILE_TOO_LARGE') {
        setError('حجم الملف يتجاوز الحد المسموح 15 ميجابايت')
      } else if (err.message === 'FILE_TYPE_NOT_ALLOWED') {
        setError('نوع الملف غير مسموح به')
      } else {
        setError('تعذر رفع المستند')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (document) => {
    if (!confirm('متأكد إنك عايز تحذف المستند ده؟')) return

    try {
      await deleteDocument(organizationId, user.uid, document)
    } catch (err) {
      console.error(err)
      setError('تعذر حذف المستند')
    }
  }

  return (
    <div className="page-shell">
      <div className="hero">
        <div>
          <span className="eyebrow">Document Vault</span>
          <h1>المستندات</h1>
          <p>ملفات العملاء والبوالص والمطالبات محفوظة داخل مساحة المؤسسة.</p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? 'إلغاء' : '+ رفع مستند'}
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={handleUpload} style={{ marginBottom: 18 }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">Secure Upload</span>
              <h2>رفع مستند جديد</h2>
            </div>
            <span className="subtitle">حتى 15 MB</span>
          </div>

          <div className="commercial-form-grid">
            <select
              name="documentType"
              value={form.documentType}
              onChange={handleChange}
              className="field"
            >
              {DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              name="entityType"
              value={form.entityType}
              onChange={handleChange}
              className="field"
            >
              <option value="">بدون ربط بسجل</option>
              <option value="client">ربط بعميل</option>
              <option value="policy">ربط ببوليصة</option>
            </select>

            <select
              name="entityId"
              value={form.entityId}
              onChange={handleChange}
              className="field"
              disabled={!form.entityType}
            >
              <option value="">
                {form.entityType ? 'اختر السجل المرتبط' : 'اختر نوع الربط أولًا'}
              </option>
              {referenceOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="field"
            placeholder="ملاحظات على المستند"
          />

          <input
            type="file"
            accept={FILE_ACCEPT}
            className="field"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            required
          />

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={saving}
          >
            {saving ? '...جارٍ الرفع' : 'رفع وحفظ المستند'}
          </button>
        </form>
      )}

      {documents.length === 0 ? (
        <div className="card empty-state">
          لا توجد مستندات بعد. ارفع أول مستند لبدء خزينة الملفات.
        </div>
      ) : (
        <div className="commercial-grid">
          {documents.map((document) => (
            <div key={document.id} className="card commercial-card">
              <div className="commercial-card-head">
                <div>
                  <span className="eyebrow">{documentTypeLabel(document.documentType)}</span>
                  <h3>{document.fileName}</h3>
                </div>
                <span className="badge" style={{ background: 'var(--primary-blue)' }}>
                  {formatSize(document.size)}
                </span>
              </div>

              <div className="commercial-meta">
                {document.entityName && <span>{document.entityName}</span>}
                {document.contentType && <span>{document.contentType}</span>}
              </div>

              {document.notes && (
                <p className="subtitle" style={{ lineHeight: 1.8 }}>
                  {document.notes}
                </p>
              )}

              <div className="hero-actions" style={{ marginTop: 10 }}>
                <a
                  href={document.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  فتح المستند
                </a>

                {canManageOperations(role) && (
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => handleDelete(document)}
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
