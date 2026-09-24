/* ═══════════════════════════════════════════════════
   Input / Textarea / Select — حقول إدخال موحدة
   ═══════════════════════════════════════════════════ */

import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/* ─────────────── Input ─────────────── */
export const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, id, required, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-ink-700"
        >
          {label}
          {required && <span className="text-danger-500 ms-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-ink-400 pointer-events-none" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-base',
            Icon && 'ps-10',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
});

/* ─────────────── Textarea ─────────────── */
export const Textarea = forwardRef(function Textarea(
  { className, label, error, hint, id, required, rows = 4, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-ink-700"
        >
          {label}
          {required && <span className="text-danger-500 ms-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          'input-base resize-y min-h-[80px]',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
});

/* ─────────────── Select ─────────────── */
export const Select = forwardRef(function Select(
  { className, label, error, hint, id, required, options = [], children, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-ink-700"
        >
          {label}
          {required && <span className="text-danger-500 ms-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'input-base appearance-none pe-10 cursor-pointer',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
            className
          )}
          {...props}
        >
          {children}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-ink-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
});