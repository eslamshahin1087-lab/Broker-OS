import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from './firebase'
import {
  addClient as addCanonicalClient,
  deleteClient,
  listenToClients,
  subscribeToClients,
  updateClient,
} from './clients'

export const addClient = (clientData, organizationId) => {
  return addCanonicalClient(organizationId, clientData)
}

export { deleteClient, listenToClients, subscribeToClients, updateClient }

export async function getClients(organizationId) {
  const q = query(collection(db, 'clients'), where('organizationId', '==', organizationId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((clientDoc) => ({ id: clientDoc.id, ...clientDoc.data() }))
}
