/* ═══════════════════════════════════════════════════
   Badge — شارة صغيرة ملونة
   ═══════════════════════════════════════════════════ */

import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-ink-100 text-ink-700',
  brand:   'bg-brand-50 text-brand-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger:  'bg-danger-50 text-danger-600',
  info:    'bg-info-50 text-info-600',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  icon: Icon,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}