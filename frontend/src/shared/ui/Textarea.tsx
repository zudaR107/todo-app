import * as React from 'react';
import { cn } from '../lib/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 ' +
          'text-sm text-slate-50 shadow-sm outline-none transition-colors ' +
          'placeholder:text-slate-500 focus:border-emerald-500 ' +
          'focus:ring-2 focus:ring-emerald-500/60',
        className,
      )}
      {...props}
    />
  );
});
