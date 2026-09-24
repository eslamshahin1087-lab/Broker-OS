/* ═══════════════════════════════════════════════════
   EmptyState — حالة "لا يوجد بيانات"
   ═══════════════════════════════════════════════════ */

import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default', // default | search
  ...props
}) {
  const isSearch = variant === 'search';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
            isSearch
              ? 'bg-ink-100 text-ink-500'
              : 'bg-brand-50 text-brand-600'
          )}
        >
          <Icon className="w-8 h-8" />
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      )}
      {description && (
        <p className="mt-1 text-sm text-ink-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}