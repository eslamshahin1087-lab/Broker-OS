import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const productsRef = collection(db, 'products')

export const PRODUCT_STATUSES = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToProducts(organizationId, onData, onError) {
  const q = query(productsRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((item) => ({ id: item.id, ...item.data() })))),
    onError
  )
}

export function addProduct(organizationId, data) {
  const rate = Number(data.defaultCommissionRate)
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0

  return addDoc(productsRef, {
    name: data.name?.trim() || '',
    type: data.type || 'other',
    insurerId: data.insurerId || '',
    insurerName: data.insurerName || '',
    description: data.description?.trim() || '',
    defaultCommissionRate: safeRate,
    status: data.status || 'active',
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateProduct(productId, data) {
  const patch = { ...data, updatedAt: serverTimestamp() }

  if (data.defaultCommissionRate !== undefined) {
    const rate = Number(data.defaultCommissionRate)
    if (Number.isFinite(rate) && rate >= 0) patch.defaultCommissionRate = rate
  }

  return updateDoc(doc(db, 'products', productId), patch)
}

export function deleteProduct(productId) {
  return updateDoc(doc(db, 'products', productId), {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  })
}
