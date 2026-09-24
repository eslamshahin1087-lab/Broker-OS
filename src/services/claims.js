import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { createAuditEntry } from './audit'

export const CLAIM_STATUSES = [
  { value: 'reported', label: 'تم الإبلاغ' },
  { value: 'submitted', label: 'تم تقديم المطالبة' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'approved', label: 'مقبولة' },
  { value: 'paid', label: 'تم التعويض' },
  { value: 'rejected', label: 'مرفوضة' },
]

const claimsRef = collection(db, 'claims')

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToClaims(organizationId, onData, onError) {
  const q = query(claimsRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((item) => ({ id: item.id, ...item.data() })))),
    onError
  )
}

export async function addClaim(organizationId, actorId, data) {
  const claimRef = doc(claimsRef)

  return runTransaction(db, async (transaction) => {
    transaction.set(claimRef, {
      claimNumber: data.claimNumber?.trim() || '',
      policyId: data.policyId || '',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      type: data.type || 'other',
      incidentDate: data.incidentDate || '',
      amountClaimed: Math.max(0, Number(data.amountClaimed) || 0),
      amountApproved: Math.max(0, Number(data.amountApproved) || 0),
      status: data.status || 'reported',
      insurerId: data.insurerId || '',
      insurerName: data.insurerName || '',
      description: data.description?.trim() || '',
      notes: data.notes?.trim() || '',
      organizationId,
      createdBy: actorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    createAuditEntry(transaction, organizationId, actorId, 'claim.created', 'claim', claimRef.id, {
      clientId: data.clientId || '',
      policyId: data.policyId || '',
      amountClaimed: Math.max(0, Number(data.amountClaimed) || 0),
    })

    return claimRef.id
  })
}

export async function updateClaim(organizationId, actorId, claimId, data) {
  const claimRef = doc(db, 'claims', claimId)

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(claimRef)
    if (!snap.exists()) throw new Error('Claim not found')
    if (snap.data().organizationId !== organizationId) throw new Error('Organization mismatch')

    transaction.update(claimRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })

    createAuditEntry(transaction, organizationId, actorId, 'claim.updated', 'claim', claimId, {
      status: data.status || '',
    })
  })
}

export function deleteClaim(claimId) {
  return deleteDoc(doc(db, 'claims', claimId))
}
