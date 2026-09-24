export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  SALES: 'sales',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
}

export const ROLE_LABELS = {
  [ROLES.OWNER]: 'مالك',
  [ROLES.ADMIN]: 'مدير',
  [ROLES.SALES]: 'مبيعات',
  [ROLES.OPERATIONS]: 'تشغيل',
  [ROLES.FINANCE]: 'مالية',
}

export const MANAGEABLE_ROLES = [
  ROLES.ADMIN,
  ROLES.SALES,
  ROLES.OPERATIONS,
  ROLES.FINANCE,
]

export function canManageTeam(role) {
  return role === ROLES.OWNER || role === ROLES.ADMIN
}

export function canManageFinance(role) {
  return role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.FINANCE
}

export function canManageOperations(role) {
  return role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.SALES || role === ROLES.OPERATIONS
}
