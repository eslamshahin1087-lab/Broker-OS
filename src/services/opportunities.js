import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { addPolicy } from './policies'

const opportunitiesRef = collection(db, 'opportunities')

export const STAGES = [
  { value: 'new', label: 'جديد', color: '#6b7280' },
  { value: 'contacted', label: 'تواصل', color: '#f59e0b' },
  { value: 'quoted', label: 'عرض سعر', color: '#2563eb' },
  { value: 'won', label: 'فاز', color: '#16a34a' },
  { value: 'lost', label: 'خاسر', color: '#ef4444' },
]

export function stageLabel(value) {
  return STAGES.find((s) => s.value === value)?.label || value
}

export function stageColor(value) {
  return STAGES.find((s) => s.value === value)?.color || '#6b7280'
}

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToOpportunities(organizationId, onData, onError) {
  const q = query(opportunitiesRef, where('organizationId', '==', organizationId))
  return onSnapshot(q, (snap) => onData(sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), onError)
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

// بيغيّر مرحلة الفرصة. لو المرحلة الجديدة "فاز" وأول مرة، بيعمل بوليصة أوتوماتيك من بيانات الفرصة.
export async function moveOpportunityStage(organizationId, opportunity, newStage) {
  const opRef = doc(db, 'opportunities', opportunity.id)

  if (newStage === 'won' && !opportunity.policyId) {
    const policy = await addPolicy(organizationId, {
      clientId: opportunity.clientId,
      clientName: opportunity.clientName,
      type: opportunity.type,
      premiumAmount: opportunity.estimatedPremium || 0,
      commissionRate: opportunity.commissionRate || 0,
      policyNumber: '',
      renewalDate: '',
    })
    await updateDoc(opRef, { stage: newStage, policyId: policy.id, updatedAt: serverTimestamp() })
    return policy.id
  }

  await updateDoc(opRef, { stage: newStage, updatedAt: serverTimestamp() })
  return null
}
