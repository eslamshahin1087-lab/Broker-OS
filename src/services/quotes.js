import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
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

export async function updateQuoteStatus(organizationId, quoteId, status) {
  if (!QUOTE_STATUSES.some((item) => item.value === status)) {
    throw new Error('Invalid quote status')
  }

  const quoteRef = doc(db, 'quotes', quoteId)

  return runTransaction(db, async (transaction) => {
    const quoteSnap = await transaction.get(quoteRef)

    if (!quoteSnap.exists()) throw new Error('Quote not found')

    const quote = quoteSnap.data()

    if (quote.organizationId !== organizationId) {
      throw new Error('Organization mismatch')
    }

    if (status === 'accepted' && !quote.policyId) {
      if (!quote.clientId) {
        throw new Error('CLIENT_REQUIRED_FOR_ACCEPTED_QUOTE')
      }

      const policyRef = doc(collection(db, 'policies'))
      const premium = normalizeMoney(quote.premiumAmount)
      const rate = normalizeMoney(quote.commissionRate)
      let opportunityRef = null

      if (quote.opportunityId) {
        opportunityRef = doc(db, 'opportunities', quote.opportunityId)
        const opportunitySnap = await transaction.get(opportunityRef)

        if (opportunitySnap.exists()) {
          const opportunity = opportunitySnap.data()
          if (opportunity.organizationId !== organizationId) {
            throw new Error('Organization mismatch')
          }
          if (opportunity.clientId && opportunity.clientId !== quote.clientId) {
            throw new Error('QUOTE_OPPORTUNITY_CLIENT_MISMATCH')
          }
        } else {
          opportunityRef = null
        }
      }

      transaction.set(policyRef, {
        clientId: quote.clientId,
        clientName: quote.clientName || '',
        type: quote.type || 'other',
        premiumAmount: premium,
        commissionRate: rate,
        commissionAmount: Math.round((premium * rate) / 100),
        policyNumber: '',
        renewalDate: '',
        organizationId,
        sourceQuoteId: quoteId,
        opportunityId: quote.opportunityId || '',
        insurerId: quote.insurerId || '',
        insurerName: quote.insurerName || '',
        productId: quote.productId || '',
        productName: quote.productName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      transaction.update(quoteRef, {
        status: 'accepted',
        policyId: policyRef.id,
        updatedAt: serverTimestamp(),
      })

      if (opportunityRef) {
        transaction.update(opportunityRef, {
          stage: 'won',
          policyId: policyRef.id,
          updatedAt: serverTimestamp(),
        })
      }

      return policyRef.id
    }

    transaction.update(quoteRef, {
      status,
      updatedAt: serverTimestamp(),
    })

    return quote.policyId || null
  })
}

export function deleteQuote(quoteId) {
  return deleteDoc(doc(db, 'quotes', quoteId))
}
