/* ═══════════════════════════════════════════════════
   Broker-OS — Constants
   ═══════════════════════════════════════════════════ */

/* ─── أنواع العملاء ─── */
export const CLIENT_TYPES = {
  INDIVIDUAL: 'individual',
  CORPORATE:  'corporate',
};

export const CLIENT_TYPE_LABELS = {
  [CLIENT_TYPES.INDIVIDUAL]: 'فرد',
  [CLIENT_TYPES.CORPORATE]:  'شركة',
};

/* ─── أنواع التأمين ─── */
export const INSURANCE_TYPES = {
  HEALTH:      'health',
  AUTO:        'auto',
  LIFE:        'life',
  PROPERTY:    'property',
  MARINE:      'marine',
  ENGINEERING: 'engineering',
  LIABILITY:   'liability',
  TRAVEL:      'travel',
  OTHER:       'other',
};

export const INSURANCE_TYPE_LABELS = {
  [INSURANCE_TYPES.HEALTH]:      'تأمين صحي',
  [INSURANCE_TYPES.AUTO]:        'تأمين سيارات',
  [INSURANCE_TYPES.LIFE]:        'تأمين حياة',
  [INSURANCE_TYPES.PROPERTY]:    'تأمين ممتلكات',
  [INSURANCE_TYPES.MARINE]:      'تأمين بحري',
  [INSURANCE_TYPES.ENGINEERING]: 'تأمين هندسي',
  [INSURANCE_TYPES.LIABILITY]:   'تأمين مسؤولية',
  [INSURANCE_TYPES.TRAVEL]:      'تأمين سفر',
  [INSURANCE_TYPES.OTHER]:       'أخرى',
};

/* ─── حالات العميل ─── */
export const CLIENT_STATUS = {
  ACTIVE:   'active',
  INACTIVE: 'inactive',
  VIP:      'vip',
  LEAD:     'lead',
};

export const CLIENT_STATUS_LABELS = {
  [CLIENT_STATUS.ACTIVE]:   'نشط',
  [CLIENT_STATUS.INACTIVE]: 'غير نشط',
  [CLIENT_STATUS.VIP]:      'عميل مميز',
  [CLIENT_STATUS.LEAD]:     'عميل محتمل',
};

export const CLIENT_STATUS_VARIANTS = {
  [CLIENT_STATUS.ACTIVE]:   'success',
  [CLIENT_STATUS.INACTIVE]: 'default',
  [CLIENT_STATUS.VIP]:      'warning',
  [CLIENT_STATUS.LEAD]:     'info',
};

/* ─── مصادر العملاء ─── */
export const LEAD_SOURCES = {
  REFERRAL: 'referral',
  WEBSITE:  'website',
  WALK_IN:  'walkin',
  SOCIAL:   'social',
  CALL:     'call',
  OTHER:    'other',
};

export const LEAD_SOURCE_LABELS = {
  [LEAD_SOURCES.REFERRAL]: 'إحالة',
  [LEAD_SOURCES.WEBSITE]:  'الموقع',
  [LEAD_SOURCES.WALK_IN]:  'زيارة مباشرة',
  [LEAD_SOURCES.SOCIAL]:   'وسائل التواصل',
  [LEAD_SOURCES.CALL]:     'مكالمة',
  [LEAD_SOURCES.OTHER]:    'أخرى',
};

/* ─── العملات ─── */
export const DEFAULT_CURRENCY = 'EGP';

/* ─── إعدادات ─── */
export const PAGE_SIZE = 20;
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;