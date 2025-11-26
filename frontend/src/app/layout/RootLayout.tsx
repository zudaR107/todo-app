import type { PropsWithChildren } from 'react';
import { cn } from '../../shared/lib/cn';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <div
      data-testid="app-root"
      className={cn('min-h-screen bg-slate-950 text-slate-50 antialiased flex flex-col')}
    >
      {children}
    </div>
  );
}
