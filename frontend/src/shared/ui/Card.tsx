import * as React from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
	return (
		<div 
			className={cn(
				'rounded-2xl border border-slate-800 bg-slate-900/80 p-4 ' +
					'shadow-lg shadow-slate-950/40',
				className,
			)}
			{...props}
		/>
	);
}
