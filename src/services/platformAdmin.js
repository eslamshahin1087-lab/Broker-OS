import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const platformAdminsRef = collection(db, 'platformAdmins')
const platformFeaturesRef = collection(db, 'platformFeatures')
const platformSettingsRef = collection(db, 'platformSettings')
const platformAuditRef = collection(db, 'platformAuditLogs')
const usersRef = collection(db, 'users')

export const DEFAULT_PLATFORM_FEATURES = [
  ['dashboard', 'الرئيسية', 'لوحة مؤشرات المنصة'],
  ['clients', 'العملاء', 'إدارة العملاء وClient 360'],
  ['leads', 'Leads', 'إدارة العملاء المحتملين'],
  ['opportunities', 'الفرص', 'Pipeline وإدارة الفرص'],
  ['quotes', 'عروض الأسعار', 'العروض والتحويل إلى بوليصة'],
  ['policies', 'البوالص', 'إدارة وثائق التأمين'],
  ['finance', 'المالية', 'لوحة المالية'],
  ['insurers', 'شركات التأمين', 'دليل شركات التأمين'],
  ['products', 'المنتجات', 'منتجات شركات التأمين'],
  ['renewals', 'التجديدات', 'متابعة التجديدات'],
  ['claims', 'المطالبات', 'إدارة المطالبات'],
  ['payments', 'المدفوعات', 'تسجيل ومتابعة المدفوعات'],
  ['documents', 'المستندات', 'سجل المستندات'],
  ['team', 'الفريق', 'إدارة أعضاء المؤسسة'],
  ['audit', 'التدقيق', 'سجل التدقيق للمؤسسة'],
].map(([key, label, description]) => ({ key, label, description, enabled: true }))

export function listenToPlatformUsers(onData, onError) {
  return onSnapshot(
    query(usersRef),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
      onData(rows)
    },
    onError
  )
}

export function updatePlatformUser(userId, data) {
  return updateDoc(doc(usersRef, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function listenToPlatformFeatures(onData, onError) {
  return onSnapshot(
    query(platformFeaturesRef),
    (snapshot) => {
      onData(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (a.label || a.key || '').localeCompare(b.label || b.key || ''))
      )
    },
    onError
  )
}

export async function savePlatformFeature(feature) {
  const ref = doc(platformFeaturesRef, feature.key)
  await setDoc(ref, {
    key: feature.key,
    label: feature.label,
    description: feature.description || '',
    enabled: feature.enabled !== false,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return ref.id
}

export function listenToPlatformSettings(onData, onError) {
  return onSnapshot(
    doc(platformSettingsRef, 'general'),
    (snapshot) => onData(snapshot.exists() ? snapshot.data() : {}),
    onError
  )
}

export async function savePlatformSettings(data) {
  await setDoc(doc(platformSettingsRef, 'general'), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export function listenToPlatformAuditLogs(onData, onError) {
  return onSnapshot(
    query(platformAuditRef),
    (snapshot) => {
      onData(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 100)
      )
    },
    onError
  )
}

export async function writePlatformAudit(actorId, action, entityType, entityId, details = {}) {
  await addDoc(platformAuditRef, {
    actorId,
    action,
    entityType,
    entityId: entityId || '',
    details,
    createdAt: serverTimestamp(),
  })
}

export async function seedDefaultPlatformFeatures() {
  for (const feature of DEFAULT_PLATFORM_FEATURES) {
    await savePlatformFeature(feature)
  }
}
