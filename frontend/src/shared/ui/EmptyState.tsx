import { Inbox } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../lib/cn";

interface EmptyStateProps {
	title: string;
	description?: string;
	actionLabel?: string;
	onActionClick?: () => void;
	className?: string;
}

export function EmptyState({
	title,
	description,
	actionLabel,
	onActionClick,
	className,
}: EmptyStateProps) {
	return (
		<div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed ' +
          'border-slate-800 bg-slate-900/40 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80">
        <Inbox className="h-6 w-6 text-slate-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-50">{title}</h2>
        {description ? (
          <p className="max-w-md text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {actionLabel && onActionClick ? (
        <Button size="sm" variant="primary" onClick={onActionClick}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
	);
}
