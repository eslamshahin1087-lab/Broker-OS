import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage'
import { db, storage } from './firebase'
import { writeAuditLog } from './audit'

export const DOCUMENT_TYPES = [
  { value: 'policy', label: 'مستند بوليصة' },
  { value: 'claim', label: 'مستند مطالبة' },
  { value: 'client', label: 'مستند عميل' },
  { value: 'invoice', label: 'فاتورة / مستند مالي' },
  { value: 'general', label: 'مستند عام' },
]

const documentsRef = collection(db, 'documents')

function normalizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-\u0600-\u06FF ]/g, '_').trim().slice(0, 120) || 'document'
}

export function listenToDocuments(organizationId, onData, onError) {
  const q = query(documentsRef, where('organizationId', '==', organizationId))

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
      onData(rows)
    },
    onError
  )
}

export async function uploadDocument(organizationId, actorId, file, metadata = {}) {
  if (!organizationId || !actorId) throw new Error('Missing organization or actor')
  if (!file) throw new Error('No file selected')

  const sizeLimit = 15 * 1024 * 1024
  if (file.size > sizeLimit) {
    throw new Error('FILE_TOO_LARGE')
  }

  const allowedTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ])

  if (!allowedTypes.has(file.type)) {
    throw new Error('FILE_TYPE_NOT_ALLOWED')
  }

  const docRef = doc(documentsRef)
  const documentId = docRef.id
  const safeName = normalizeFileName(file.name)
  const storagePath = `organizations/${organizationId}/documents/${documentId}/${safeName}`
  const fileRef = storageRef(storage, storagePath)

  await uploadBytes(fileRef, file, {
    contentType: file.type,
    customMetadata: {
      organizationId,
      documentId,
      uploadedBy: actorId,
    },
  })

  const downloadUrl = await getDownloadURL(fileRef)

  try {
    await setDoc(docRef, {
      organizationId,
      createdBy: actorId,
      fileName: file.name,
      storedFileName: safeName,
      storagePath,
      downloadUrl,
      contentType: file.type,
      size: file.size,
      documentType: metadata.documentType || 'general',
      entityType: metadata.entityType || '',
      entityId: metadata.entityId || '',
      entityName: metadata.entityName || '',
      notes: metadata.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    await deleteObject(fileRef).catch(() => {})
    throw err
  }

  await writeAuditLog(
    organizationId,
    actorId,
    'document.created',
    'document',
    documentId,
    { fileName: file.name, documentType: metadata.documentType || 'general' }
  )

  return { documentId, storagePath, downloadUrl }
}

export async function deleteDocument(organizationId, actorId, document) {
  if (!document?.id || !document?.storagePath) throw new Error('Invalid document')
  const fileRef = storageRef(storage, document.storagePath)
  await deleteObject(fileRef)
  await deleteDoc(doc(documentsRef, document.id))
  await writeAuditLog(
    organizationId,
    actorId,
    'document.deleted',
    'document',
    document.id,
    { fileName: document.fileName || '' }
  )
}
