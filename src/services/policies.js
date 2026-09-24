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

// بيرجع عدد الأيام الباقية لتاريخ التجديد، أو null لو مفيش تاريخ محدد
export function daysUntilRenewal(renewalDate) {
  if (!renewalDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(renewalDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

// البوالص اللي هتتجدد خلال عدد أيام معين (افتراضيًا 30)، مرتبة بالأقرب أولًا
export function getUpcomingRenewals(policies, withinDays = 30) {
  return policies
    .map((p) => ({ ...p, daysLeft: daysUntilRenewal(p.renewalDate) }))
    .filter((p) => p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

// كل البوالص الخاصة بمنظمة (org) — لشاشة Policies العامة و Home
export function listenToPolicies(organizationId, onData, onError) {
  const q = query(policiesRef, where('organizationId', '==', organizationId))
  return onSnapshot(q, (snap) => onData(sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), onError)
}

// بوالص عميل معيّن — لشاشة Client 360
export function listenToPoliciesByClient(clientId, onData, onError) {
  const q = query(policiesRef, where('clientId', '==', clientId))
  return onSnapshot(q, (snap) => onData(sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), onError)
}

export function addPolicy(organizationId, data) {
  const premium = Number(data.premiumAmount) || 0
  const rate = Number(data.commissionRate) || 0
  return addDoc(policiesRef, {
    ...data,
    premiumAmount: premium,
    commissionRate: rate,
    commissionAmount: Math.round((premium * rate) / 100),
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updatePolicy(policyId, data) {
  const patch = { ...data, updatedAt: serverTimestamp() }
  if (data.premiumAmount !== undefined || data.commissionRate !== undefined) {
    const premium = Number(data.premiumAmount)
    const rate = Number(data.commissionRate)
    if (!Number.isNaN(premium) && !Number.isNaN(rate)) {
      patch.commissionAmount = Math.round((premium * rate) / 100)
    }
  }
  return updateDoc(doc(db, 'policies', policyId), patch)
}

export function deletePolicy(policyId) {
  return deleteDoc(doc(db, 'policies', policyId))
}
