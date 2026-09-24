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

const insurersRef = collection(db, 'insurers')

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToInsurers(organizationId, onData, onError) {
  const q = query(insurersRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => onData(sortDesc(snap.docs.map((item) => ({ id: item.id, ...item.data() })))),
    onError
  )
}

export function addInsurer(organizationId, data) {
  return addDoc(insurersRef, {
    name: data.name?.trim() || '',
    licenseNumber: data.licenseNumber?.trim() || '',
    contactName: data.contactName?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    website: data.website?.trim() || '',
    notes: data.notes?.trim() || '',
    active: data.active !== false,
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateInsurer(insurerId, data) {
  return updateDoc(doc(db, 'insurers', insurerId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function deleteInsurer(insurerId) {
  return updateDoc(doc(db, 'insurers', insurerId), {
    active: false,
    updatedAt: serverTimestamp(),
  })
}
