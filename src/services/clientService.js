import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const CLIENTS_COLLECTION = 'clients';

export const addClient = async (clientData, organizationId) => {
  return await addDoc(collection(db, CLIENTS_COLLECTION), {
    ...clientData,
    organizationId,
    createdAt: serverTimestamp(),
  });
};

export const getClients = async (organizationId) => {
  const q = query(
    collection(db, CLIENTS_COLLECTION),
    where('organizationId', '==', organizationId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};