import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const auditRef = collection(db, 'auditLogs')

export function createAuditEntry(transaction, organizationId, actorId, action, entityType, entityId, details = {}) {
  const logRef = doc(auditRef)
  transaction.set(logRef, {
    organizationId,
    actorId,
    action,
    entityType,
    entityId: entityId || '',
    details,
    createdAt: serverTimestamp(),
  })
}

export async function writeAuditLog(organizationId, actorId, action, entityType, entityId, details = {}) {
  const logRef = doc(auditRef)
  await runTransaction(db, async (transaction) => {
    transaction.set(logRef, {
      organizationId,
      actorId,
      action,
      entityType,
      entityId: entityId || '',
      details,
      createdAt: serverTimestamp(),
    })
  })
}
