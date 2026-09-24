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

const policiesRef = collection(db, 'policies')

export const POLICY_TYPES = [
  { value: 'auto', label: 'سيارات' },
  { value: 'health', label: 'صحة' },
  { value: 'life', label: 'حياة' },
  { value: 'property', label: 'ممتلكات' },
  { value: 'other', label: 'أخرى' },
]

export function policyTypeLabel(value) {
  return POLICY_TYPES.find((t) => t.value === value)?.label || value
}

export function daysUntilRenewal(renewalDate) {
  if (!renewalDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(renewalDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

export function getUpcomingRenewals(policies, withinDays = 30) {
  return policies
    .map((p) => ({ ...p, daysLeft: daysUntilRenewal(p.renewalDate) }))
    .filter((p) => p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToPolicies(organizationId, onData, onError) {
  const q = query(policiesRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  )
}

export function listenToPoliciesByClient(organizationId, clientId, onData, onError) {
  const q = query(
    policiesRef,
    where('organizationId', '==', organizationId),
    where('clientId', '==', clientId)
  )
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  )
}

export function addPolicy(organizationId, data) {
  const premium = Number(data.premiumAmount)
  const rate = Number(data.commissionRate)
  const safePremium = Number.isFinite(premium) && premium >= 0 ? premium : 0
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0

  return addDoc(policiesRef, {
    ...data,
    premiumAmount: safePremium,
    commissionRate: safeRate,
    commissionAmount: Math.round((safePremium * safeRate) / 100),
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updatePolicy(policyId, data) {
  const policyRef = doc(db, 'policies', policyId)
  const currentSnap = await getDoc(policyRef)

  if (!currentSnap.exists()) throw new Error('Policy not found')

  const current = currentSnap.data()
  const premiumInput = data.premiumAmount !== undefined ? Number(data.premiumAmount) : Number(current.premiumAmount)
  const rateInput = data.commissionRate !== undefined ? Number(data.commissionRate) : Number(current.commissionRate)

  const premium = Number.isFinite(premiumInput) ? Math.max(0, premiumInput) : 0
  const rate = Number.isFinite(rateInput) ? Math.max(0, rateInput) : 0

  return updateDoc(policyRef, {
    ...data,
    premiumAmount: premium,
    commissionRate: rate,
    commissionAmount: Math.round((premium * rate) / 100),
    updatedAt: serverTimestamp(),
  })
}

export function deletePolicy(policyId) {
  return deleteDoc(doc(db, 'policies', policyId))
}
