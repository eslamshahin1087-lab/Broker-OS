import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { createAuditEntry } from './audit'

export const ACTIVITY_TYPES = [
  { value: 'task', label: 'مهمة' },
  { value: 'call', label: 'مكالمة' },
  { value: 'meeting', label: 'اجتماع' },
  { value: 'follow_up', label: 'متابعة' },
  { value: 'note', label: 'ملاحظة' },
]

export const ACTIVITY_STATUSES = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'done', label: 'مكتملة' },
  { value: 'cancelled', label: 'ملغاة' },
]

export const ACTIVITY_PRIORITIES = [
  { value: 'critical', label: 'عاجلة' },
  { value: 'high', label: 'عالية' },
  { value: 'normal', label: 'عادية' },
  { value: 'low', label: 'منخفضة' },
]

const activitiesRef = collection(db, 'activities')

function sortDesc(rows) {
  return [...rows].sort((a, b) => {
    const aDue = a.dueDate || ''
    const bDue = b.dueDate || ''
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    return aDue.localeCompare(bDue)
  })
}

export function listenToActivities(organizationId, onData, onError) {
  const q = query(activitiesRef, where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      onData(sortDesc(rows))
    },
    onError
  )
}

export async function addActivity(organizationId, actorId, data) {
  const ref = doc(activitiesRef)
  return runTransaction(db, async (transaction) => {
    transaction.set(ref, {
      title: data.title?.trim() || 'مهمة جديدة',
      description: data.description?.trim() || '',
      type: data.type || 'task',
      priority: data.priority || 'normal',
      status: data.status || 'open',
      dueDate: data.dueDate || '',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      entityType: data.entityType || '',
      entityId: data.entityId || '',
      createdBy: actorId,
      assignedTo: data.assignedTo || actorId,
      organizationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    createAuditEntry(transaction, organizationId, actorId, 'activity.created', 'activity', ref.id, {
      title: data.title?.trim() || 'مهمة جديدة',
      entityType: data.entityType || '',
      entityId: data.entityId || '',
    })

    return ref.id
  })
}

export async function updateActivity(organizationId, actorId, activityId, data) {
  const ref = doc(activitiesRef, activityId)

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('Activity not found')
    if (snap.data().organizationId !== organizationId) throw new Error('Organization mismatch')

    transaction.update(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    })

    createAuditEntry(transaction, organizationId, actorId, 'activity.updated', 'activity', activityId, {
      status: data.status || '',
      title: data.title || '',
    })
  })
}

export async function completeActivity(organizationId, actorId, activityId) {
  return updateActivity(organizationId, actorId, activityId, { status: 'done' })
}

export async function deleteActivity(organizationId, actorId, activityId) {
  const ref = doc(activitiesRef, activityId)

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('Activity not found')
    if (snap.data().organizationId !== organizationId) throw new Error('Organization mismatch')

    transaction.delete(ref)
    createAuditEntry(transaction, organizationId, actorId, 'activity.deleted', 'activity', activityId, {
      title: snap.data().title || '',
    })
  })
}

export function isActivityOverdue(activity, today = new Date()) {
  if (!activity?.dueDate || activity.status === 'done' || activity.status === 'cancelled') return false
  const due = new Date(activity.dueDate + 'T23:59:59')
  return due.getTime() < today.getTime()
}
