import * as React from 'react';
import { cn } from '../lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'muted' | 'success' | 'warning' | 'danger' | 'outline';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-800 text-slate-100 border border-slate-700',
  muted: 'bg-slate-900/60 text-slate-400 border border-slate-800',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
  danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/40',
  outline: 'bg-transparent text-slate-200 border border-slate-600',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
