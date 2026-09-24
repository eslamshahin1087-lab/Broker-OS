import { addDoc, collection, getDocs, onSnapshot, query, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore'
import { db } from './firebase'

const LEADS_COLLECTION = 'leads'

export const LEAD_STATUSES = [
  { value: 'new', label: 'جديد' },
  { value: 'contacted', label: 'تم التواصل' },
  { value: 'qualified', label: 'مؤهل' },
  { value: 'proposal', label: 'عرض سعر' },
  { value: 'won', label: 'تم الفوز' },
  { value: 'lost', label: 'مفقود' },
]

export const addLead = async (leadData, organizationId) => {
  return addDoc(collection(db, LEADS_COLLECTION), {
    ...leadData,
    status: 'new',
    organizationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const getLeads = async (organizationId) => {
  const q = query(collection(db, LEADS_COLLECTION), where('organizationId', '==', organizationId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((leadDoc) => ({ id: leadDoc.id, ...leadDoc.data() }))
}

export const listenToLeads = (organizationId, onData, onError) => {
  const q = query(collection(db, LEADS_COLLECTION), where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs
        .map((leadDoc) => ({ id: leadDoc.id, ...leadDoc.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      onData(rows)
    },
    onError
  )
}

export const updateLeadStatus = async (organizationId, leadId, newStatus) => {
  const allowed = LEAD_STATUSES.some((status) => status.value === newStatus)
  if (!allowed) throw new Error('Invalid lead status')

  const leadRef = doc(db, LEADS_COLLECTION, leadId)
  return updateDoc(leadRef, { status: newStatus, updatedAt: serverTimestamp() })
}
