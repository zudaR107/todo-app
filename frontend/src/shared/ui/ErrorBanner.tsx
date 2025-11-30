import { cn } from '../lib/cn';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-red-500/40 bg-red-950/60 px-3 py-2 text-xs text-red-100',
        className,
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-3 rounded-lg border border-red-400/40 bg-red-900/40 px-2 py-1 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-800/60"
        >
          Повторить
        </button>
      ) : null}
    </div>
  );
}
