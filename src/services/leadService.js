import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const LEADS_COLLECTION = 'leads';

export const addLead = async (leadData, organizationId) => {
  return await addDoc(collection(db, LEADS_COLLECTION), {
    ...leadData,
    status: 'new',
    organizationId,
    createdAt: serverTimestamp(),
  });
};

export const getLeads = async (organizationId) => {
  const q = query(collection(db, LEADS_COLLECTION), where('organizationId', '==', organizationId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateLeadStatus = async (leadId, newStatus) => {
  const leadRef = doc(db, LEADS_COLLECTION, leadId);
  return await updateDoc(leadRef, { status: newStatus });
};