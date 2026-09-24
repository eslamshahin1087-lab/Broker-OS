import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export const QUOTE_STATUSES = [
  { value: 'draft', label: 'مسودة' },
  { value: 'submitted', label: 'تم الإرسال' },
  { value: 'received', label: 'تم استلام العرض' },
  { value: 'accepted', label: 'مقبول' },
  { value: 'rejected', label: 'مرفوض' },
]

const quotesRef = collection(db, 'quotes')

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

function normalizeMoney(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

export function listenToQuotes(organizationId, onData, onError) {
  const q = query(quotesRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((item) => ({ id: item.id, ...item.data() })))),
    onError
  )
}

export function addQuote(organizationId, data) {
  const premium = normalizeMoney(data.premiumAmount)
  const rate = normalizeMoney(data.commissionRate)

  return addDoc(quotesRef, {
    clientId: data.clientId || '',
    clientName: data.clientName || '',
    opportunityId: data.opportunityId || '',
    insurerId: data.insurerId || '',
    insurerName: data.insurerName || '',
    productId: data.productId || '',
    productName: data.productName || '',
    type: data.type || 'other',
    premiumAmount: premium,
    commissionRate: rate,
    commissionAmount: Math.round((premium * rate) / 100),
    status: data.status || 'draft',
    validUntil: data.validUntil || '',
    notes: data.notes?.trim() || '',
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateQuote(quoteId, data) {
  const ref = doc(db, 'quotes', quoteId)
  const snap = await getDoc(ref)

  if (!snap.exists()) throw new Error('Quote not found')

  const current = snap.data()
  const premium = normalizeMoney(
    data.premiumAmount !== undefined ? data.premiumAmount : current.premiumAmount
  )
  const rate = normalizeMoney(
    data.commissionRate !== undefined ? data.commissionRate : current.commissionRate
  )

  return updateDoc(ref, {
    ...data,
    premiumAmount: premium,
    commissionRate: rate,
    commissionAmount: Math.round((premium * rate) / 100),
    updatedAt: serverTimestamp(),
  })
}

export function updateQuoteStatus(quoteId, status) {
  if (!QUOTE_STATUSES.some((item) => item.value === status)) {
    throw new Error('Invalid quote status')
  }

  return updateDoc(doc(db, 'quotes', quoteId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export function deleteQuote(quoteId) {
  return deleteDoc(doc(db, 'quotes', quoteId))
}
