/* ═══════════════════════════════════════════════════
   Modal — نافذة منبثقة (Drawer على الموبايل)
   ═══════════════════════════════════════════════════ */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  hideClose = false,
}) {
  /* ── قفل التمرير + ESC ── */
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[95vw]',
  };

  const handleBackdrop = () => {
    if (closeOnBackdrop) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdrop}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white shadow-pop flex flex-col',
          'rounded-t-3xl sm:rounded-2xl',
          'max-h-[92vh] sm:max-h-[90vh]',
          'animate-slide-up sm:animate-fade-in',
          sizes[size]
        )}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-100 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-ink-900 truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-sm text-ink-500 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-ink-100 bg-ink-50/50 flex gap-2 justify-end shrink-0 rounded-b-3xl sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}