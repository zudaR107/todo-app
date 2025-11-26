import * as React from 'react';
import { cn } from '../lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 ' +
          'text-sm text-slate-50 shadow-sm outline-none transition-colors ' +
          'placeholder:text-slate-500 focus:border-emerald-500 ' +
          'focus:ring-2 focus:ring-emerald-500/60',
        className,
      )}
      {...props}
    />
  );
});
