import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const opportunitiesRef = collection(db, 'opportunities')

export const STAGES = [
  { value: 'new', label: 'جديد', color: '#64748b' },
  { value: 'contacted', label: 'تواصل', color: '#f59e0b' },
  { value: 'quoted', label: 'عرض سعر', color: '#3b82f6' },
  { value: 'won', label: 'فاز', color: '#16a34a' },
  { value: 'lost', label: 'خاسر', color: '#ef4444' },
]

export function stageLabel(value) {
  return STAGES.find((s) => s.value === value)?.label || value
}

export function stageColor(value) {
  return STAGES.find((s) => s.value === value)?.color || '#64748b'
}

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToOpportunities(organizationId, onData, onError) {
  const q = query(opportunitiesRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  )
}

export function addOpportunity(organizationId, data) {
  return addDoc(opportunitiesRef, {
    ...data,
    stage: 'new',
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function deleteOpportunity(opportunityId) {
  return deleteDoc(doc(db, 'opportunities', opportunityId))
}

export async function moveOpportunityStage(organizationId, opportunity, newStage) {
  const opRef = doc(db, 'opportunities', opportunity.id)

  return runTransaction(db, async (transaction) => {
    const opSnap = await transaction.get(opRef)

    if (!opSnap.exists()) throw new Error('Opportunity not found')

    const current = opSnap.data()
    if (current.organizationId !== organizationId) throw new Error('Organization mismatch')
    if (current.stage === newStage) return current.policyId || null

    if (current.policyId && current.stage === 'won' && newStage !== 'won') {
      throw new Error('WON_OPPORTUNITY_LOCKED')
    }

    if (newStage === 'won' && !current.policyId) {
      if (!current.clientId) {
        throw new Error('CLIENT_REQUIRED_FOR_WON_OPPORTUNITY')
      }

      const policyRef = doc(collection(db, 'policies'))
      const premium = Math.max(0, Number(current.estimatedPremium) || 0)
      const rate = Math.max(0, Number(current.commissionRate) || 0)

      transaction.set(policyRef, {
        clientId: current.clientId,
        clientName: current.clientName || '',
        type: current.type || 'other',
        premiumAmount: premium,
        commissionRate: rate,
        commissionAmount: Math.round((premium * rate) / 100),
        policyNumber: '',
        renewalDate: '',
        organizationId,
        sourceOpportunityId: opportunity.id,
        insurerId: current.insurerId || '',
        insurerName: current.insurerName || '',
        productId: current.productId || '',
        productName: current.productName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      transaction.update(opRef, {
        stage: 'won',
        policyId: policyRef.id,
        updatedAt: serverTimestamp(),
      })

      return policyRef.id
    }

    transaction.update(opRef, {
      stage: newStage,
      updatedAt: serverTimestamp(),
    })

    return current.policyId || null
  })
}
