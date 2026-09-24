import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { createAuditEntry } from './audit'

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'مستحق' },
  { value: 'partial', label: 'جزئي' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'overdue', label: 'متأخر' },
]

const paymentsRef = collection(db, 'payments')

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToPayments(organizationId, onData, onError) {
  const q = query(paymentsRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((item) => ({ id: item.id, ...item.data() })))),
    onError
  )
}

export async function addPayment(organizationId, actorId, data) {
  const paymentRef = doc(paymentsRef)
  const amount = Math.max(0, Number(data.amount) || 0)

  return runTransaction(db, async (transaction) => {
    transaction.set(paymentRef, {
      policyId: data.policyId || '',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      amount,
      currency: data.currency || 'EGP',
      status: data.status || 'pending',
      paymentDate: data.paymentDate || '',
      dueDate: data.dueDate || '',
      reference: data.reference?.trim() || '',
      method: data.method || '',
      notes: data.notes?.trim() || '',
      organizationId,
      createdBy: actorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    createAuditEntry(transaction, organizationId, actorId, 'payment.created', 'payment', paymentRef.id, {
      amount,
      policyId: data.policyId || '',
    })

    return paymentRef.id
  })
}

export async function updatePayment(organizationId, actorId, paymentId, data) {
  const paymentRef = doc(db, 'payments', paymentId)

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(paymentRef)
    if (!snap.exists()) throw new Error('Payment not found')
    if (snap.data().organizationId !== organizationId) throw new Error('Organization mismatch')

    const patch = { ...data, updatedAt: serverTimestamp() }
    if (data.amount !== undefined) patch.amount = Math.max(0, Number(data.amount) || 0)

    transaction.update(paymentRef, patch)
    createAuditEntry(transaction, organizationId, actorId, 'payment.updated', 'payment', paymentId, {
      status: data.status || '',
    })
  })
}
