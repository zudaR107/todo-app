import * as React from 'react';
import { cn } from '../lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-lg font-semibold text-slate-50 sm:text-xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
