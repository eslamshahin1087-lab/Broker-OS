import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import { writeAuditLog } from './audit'

export const DOCUMENT_TYPES = [
  { value: 'policy', label: 'مستند بوليصة' },
  { value: 'claim', label: 'مستند مطالبة' },
  { value: 'client', label: 'مستند عميل' },
  { value: 'invoice', label: 'فاتورة / مستند مالي' },
  { value: 'general', label: 'مستند عام' },
]

const documentsRef = collection(db, 'documents')

export function listenToDocuments(organizationId, onData, onError) {
  const q = query(documentsRef, where('organizationId', '==', organizationId))
  return onSnapshot(q, (snapshot) => {
    const rows = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    onData(rows)
  }, onError)
}

export async function addDocument(organizationId, actorId, data = {}) {
  if (!organizationId || !actorId) throw new Error('Missing organization or actor')
  if (!data.fileName?.trim()) throw new Error('DOCUMENT_NAME_REQUIRED')
  if (!data.documentUrl?.trim()) throw new Error('DOCUMENT_URL_REQUIRED')

  const documentUrl = data.documentUrl.trim()
  if (!documentUrl.startsWith('https://')) throw new Error('DOCUMENT_URL_MUST_BE_HTTPS')

  const ref = await addDoc(documentsRef, {
    organizationId,
    createdBy: actorId,
    fileName: data.fileName.trim(),
    documentUrl,
    documentType: data.documentType || 'general',
    entityType: data.entityType || '',
    entityId: data.entityId || '',
    entityName: data.entityName || '',
    notes: data.notes?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog(
    organizationId,
    actorId,
    'document.created',
    'document',
    ref.id,
    { fileName: data.fileName.trim(), documentType: data.documentType || 'general' }
  )

  return ref.id
}

export async function updateDocument(organizationId, actorId, documentId, data = {}) {
  if (!organizationId || !actorId || !documentId) throw new Error('INVALID_DOCUMENT')
  if (data.documentUrl && !data.documentUrl.trim().startsWith('https://')) {
    throw new Error('DOCUMENT_URL_MUST_BE_HTTPS')
  }

  await updateDoc(doc(documentsRef, documentId), {
    ...data,
    ...(data.documentUrl ? { documentUrl: data.documentUrl.trim() } : {}),
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog(organizationId, actorId, 'document.updated', 'document', documentId, {
    fileName: data.fileName || '',
  })
}

export async function deleteDocument(organizationId, actorId, document) {
  if (!document?.id) throw new Error('Invalid document')
  await deleteDoc(doc(documentsRef, document.id))
  await writeAuditLog(organizationId, actorId, 'document.deleted', 'document', document.id, {
    fileName: document.fileName || '',
  })
}
