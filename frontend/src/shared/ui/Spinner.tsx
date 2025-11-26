import { cn } from '../lib/cn';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label="loading">
      <div
        className={cn(
          'h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent',
          className,
        )}
      />
    </div>
  );
}
