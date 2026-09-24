/* ═══════════════════════════════════════════════════
   Button — زر موحّد
   ═══════════════════════════════════════════════════ */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-300',
  outline:   'border border-ink-200 bg-white text-ink-800 hover:bg-ink-50 active:bg-ink-100',
  ghost:     'text-ink-700 hover:bg-ink-100 active:bg-ink-200',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 shadow-sm',
  success:   'bg-success-500 text-white hover:bg-success-600 active:bg-success-600 shadow-sm',
};

const sizes = {
  sm:   'h-9  px-3 text-sm gap-1.5 rounded-lg',
  md:   'h-11 px-4 text-sm gap-2   rounded-xl',
  lg:   'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:ring-2 focus-visible:ring-brand-500/40',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});