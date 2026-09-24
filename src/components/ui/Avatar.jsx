/* ═══════════════════════════════════════════════════
   Avatar — صورة رمزية مع بديل تلقائي
   ═══════════════════════════════════════════════════ */

import { cn, initials, colorFromString } from '../../lib/utils';

const sizes = {
  xs: 'w-7  h-7  text-[10px]',
  sm: 'w-9  h-9  text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({
  name = '',
  src,
  size = 'md',
  className,
  ring = false,
  ...props
}) {
  const sizeClass = sizes[size] || sizes.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          sizeClass,
          ring && 'ring-2 ring-white shadow-sm',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
        colorFromString(name),
        sizeClass,
        ring && 'ring-2 ring-white shadow-sm',
        className
      )}
      title={name}
      {...props}
    >
      {initials(name)}
    </div>
  );
}

/* ─────────────── AvatarGroup — مجموعة أفاتارات ─────────────── */
export function AvatarGroup({ names = [], max = 3, size = 'sm', className }) {
  const visible = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className={cn('flex items-center -space-x-2 space-x-reverse', className)}>
      {visible.map((name, i) => (
        <Avatar key={i} name={name} size={size} ring />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-ink-200 text-ink-700 font-semibold ring-2 ring-white',
            sizes[size] || sizes.sm
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}