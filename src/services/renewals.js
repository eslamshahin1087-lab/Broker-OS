import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { createAuditEntry } from './audit'
import { daysUntilRenewal } from './policies'

const policiesRef = collection(db, 'policies')

export const RENEWAL_STATUSES = [
  { value: 'pending', label: 'لم يبدأ' },
  { value: 'contacted', label: 'تم التواصل' },
  { value: 'quoted', label: 'تم طلب عرض' },
  { value: 'renewed', label: 'تم التجديد' },
  { value: 'lost', label: 'لم يتم التجديد' },
]

function sortByRenewal(rows) {
  return [...rows].sort((a, b) => {
    const ad = daysUntilRenewal(a.renewalDate)
    const bd = daysUntilRenewal(b.renewalDate)
    return (ad ?? 99999) - (bd ?? 99999)
  })
}

export function listenToRenewals(organizationId, onData, onError, withinDays = 90) {
  const q = query(policiesRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .map((item) => ({ ...item, daysLeft: daysUntilRenewal(item.renewalDate) }))
        .filter((item) => item.daysLeft !== null && item.daysLeft <= withinDays)
        .sort((a, b) => (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999))
      onData(sortByRenewal(rows))
    },
    onError
  )
}

export async function updateRenewal(organizationId, actorId, policyId, data) {
  const policyRef = doc(db, 'policies', policyId)

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(policyRef)
    if (!snap.exists()) throw new Error('Policy not found')
    if (snap.data().organizationId !== organizationId) throw new Error('Organization mismatch')

    transaction.update(policyRef, {
      renewalStatus: data.renewalStatus || 'pending',
      renewalNotes: data.renewalNotes || '',
      lastRenewalFollowUpAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    createAuditEntry(transaction, organizationId, actorId, 'renewal.updated', 'policy', policyId, {
      renewalStatus: data.renewalStatus || 'pending',
    })
  })
}
