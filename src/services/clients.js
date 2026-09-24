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

const clientsRef = collection(db, 'clients')

function sortDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export function listenToClients(organizationId, onData, onError, options = {}) {
  let q = query(clientsRef, where('organizationId', '==', organizationId))

  if (options.status) {
    q = query(
      clientsRef,
      where('organizationId', '==', organizationId),
      where('status', '==', options.status)
    )
  }

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      onData(sortDesc(rows))
    },
    onError
  )
}

export function subscribeToClients(organizationId, onData, options = {}) {
  return listenToClients(organizationId, onData, options.onError, options)
}

export function addClient(organizationId, data) {
  return addDoc(clientsRef, {
    ...data,
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateClient(clientId, data) {
  return updateDoc(doc(db, 'clients', clientId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function deleteClient(clientId) {
  return deleteDoc(doc(db, 'clients', clientId))
}
