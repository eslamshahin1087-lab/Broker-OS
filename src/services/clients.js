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

// بيرجع unsub function — استخدمها جوه useEffect وارجعها في الـ cleanup
// الترتيب بيحصل في الكود (مش orderBy في الـ query) عشان نتجنب الحاجة لـ composite index في Firestore
export function listenToClients(organizationId, onData, onError) {
  const q = query(clientsRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      rows.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      onData(rows)
    },
    onError
  )
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
