/* ═══════════════════════════════════════════════════
   Broker-OS — Utility Helpers
   ═══════════════════════════════════════════════════ */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج Tailwind classes بأمان (يحل التعارضات تلقائياً)
 * مثال: cn('px-2', 'px-4') → 'px-4'
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق العملة بالأرقام اللاتينية
 */
export function formatCurrency(amount, currency = 'EGP') {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * تنسيق رقم عادي مع فواصل الآلاف
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * تنسيق التاريخ بالعربية
 * يقبل: Date, timestamp, أو Firestore Timestamp
 */
export function formatDate(date, style = 'medium') {
  if (!date) return '—';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const options = {
    short:  { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long:   { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  }[style] || { year: 'numeric', month: 'short', day: 'numeric' };

  return new Intl.DateTimeFormat('ar-EG', options).format(d);
}

/**
 * الوقت النسبي بالعربية: "منذ 3 أيام"
 */
export function timeAgo(date) {
  if (!date) return '—';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'الآن';
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return m === 1 ? 'منذ دقيقة' : m === 2 ? 'منذ دقيقتين' : `منذ ${m} دقائق`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return h === 1 ? 'منذ ساعة' : h === 2 ? 'منذ ساعتين' : `منذ ${h} ساعات`;
  }
  if (seconds < 2592000) {
    const dd = Math.floor(seconds / 86400);
    return dd === 1 ? 'منذ يوم' : dd === 2 ? 'منذ يومين' : `منذ ${dd} أيام`;
  }
  if (seconds < 31536000) {
    const mo = Math.floor(seconds / 2592000);
    return mo === 1 ? 'منذ شهر' : mo === 2 ? 'منذ شهرين' : `منذ ${mo} أشهر`;
  }
  const y = Math.floor(seconds / 31536000);
  return y === 1 ? 'منذ سنة' : y === 2 ? 'منذ سنتين' : `منذ ${y} سنوات`;
}

/**
 * الأحرف الأولى من الاسم (للأفاتار)
 * "أحمد محمد علي" → "أم"
 */
export function initials(name = '') {
  const trimmed = String(name).trim();
  if (!trimmed) return '؟';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

/**
 * توليد لون ثابت من نص (للأفاتار بدون صورة)
 */
export function colorFromString(str = '') {
  const colors = [
    'bg-brand-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-danger-500',
    'bg-info-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * تحويل رقم إلى صيغة مختصرة: 1.2M أو 277K
 */
export function abbreviateNumber(num) {
  if (num == null || isNaN(num)) return '—';
  if (num < 1000) return String(num);
  if (num < 1_000_000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
  if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  return (num / 1_000_000_000).toFixed(1) + 'B';
}

/**
 * تأخير بسيط (للاختبار)
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * استخراج الأحرف الأولى من البريد الإلكتروني
 * "islam@broker-os.com" → "islam"
 */
export function emailToName(email = '') {
  return String(email).split('@')[0] || '';
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/**
 * التحقق من صحة رقم الهاتف (مصري / خليجي)
 */
export function isValidPhone(phone = '') {
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  return /^(\+?\d{10,15})$/.test(cleaned);
}

/**
 * قص النص وإضافة "..."
 */
export function truncate(text = '', max = 50) {
  const s = String(text);
  return s.length > max ? s.slice(0, max).trim() + '…' : s;
}