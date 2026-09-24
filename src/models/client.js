/* ═══════════════════════════════════════════════════
   Client Model — نموذج بيانات العميل
   ═══════════════════════════════════════════════════ */

import {
  CLIENT_TYPES,
  CLIENT_STATUS,
  LEAD_SOURCES,
} from '../constants';

export function createClientModel(data = {}) {
  return {
    type: data.type || CLIENT_TYPES.INDIVIDUAL,
    name: data.name || '',
    nameEn: data.nameEn || '',
    email: data.email || '',
    phone: data.phone || '',
    phone2: data.phone2 || '',
    whatsapp: data.whatsapp || '',

    address: {
      country: data.address?.country || 'مصر',
      city: data.address?.city || '',
      area: data.address?.area || '',
      street: data.address?.street || '',
      building: data.address?.building || '',
      notes: data.address?.notes || '',
    },

    company: {
      name: data.company?.name || '',
      taxId: data.company?.taxId || '',
      industry: data.company?.industry || '',
      employees: data.company?.employees || null,
    },

    status: data.status || CLIENT_STATUS.LEAD,
    source: data.source || LEAD_SOURCES.OTHER,
    tags: data.tags || [],
    notes: data.notes || '',

    riskScore: data.riskScore ?? null,
    lifetimeValue: data.lifetimeValue ?? 0,
    policiesCount: data.policiesCount ?? 0,
    claimsCount: data.claimsCount ?? 0,

    organizationId: data.organizationId || '',
    assignedTo: data.assignedTo || '',
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    isDeleted: data.isDeleted || false,
  };
}

export function sanitizeClient(data) {
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !value.toDate) {
      clean[key] = sanitizeClient(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function clientFromDoc(doc) {
  if (!doc.exists()) return null;
  return { id: doc.id, ...doc.data() };
}

export function clientsFromSnapshot(snapshot) {
  return snapshot.docs.map(clientFromDoc);
}