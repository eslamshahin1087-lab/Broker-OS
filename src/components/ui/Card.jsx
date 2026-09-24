/* ═══════════════════════════════════════════════════
   Card — بطاقة موحّدة
   ═══════════════════════════════════════════════════ */

import { cn } from '../../lib/utils';

/* ─────────────── Card ─────────────── */
export function Card({ className, padding = 'md', ...props }) {
  const paddings = {
    none: '',
    sm:   'p-3',
    md:   'p-5',
    lg:   'p-6',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-card border border-ink-100',
        paddings[padding],
        className
      )}
      {...props}
    />
  );
}

/* ─────────────── CardHeader ─────────────── */
export function CardHeader({
  className,
  title,
  subtitle,
  action,
  icon: Icon,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 mb-4',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          {title && (
            <h3 className="text-base font-semibold text-ink-900 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-ink-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─────────────── CardBody ─────────────── */
export function CardBody({ className, ...props }) {
  return <div className={cn('', className)} {...props} />;
}

/* ─────────────── CardFooter ─────────────── */
export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-ink-100 flex items-center gap-2',
        className
      )}
      {...props}
    />
  );
}