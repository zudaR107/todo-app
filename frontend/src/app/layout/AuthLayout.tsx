import type { PropsWithChildren } from "react";
import { Card } from "../../shared/ui/Card";

export function AuthLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
			<Card className="w-full max-w-md border-slate-800/80 bg-slate-950/80 p-6">
				<div className="mb-4 text-center">
					<p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">todo-app</p>
					<h1 className="mt-2 text-xl font-semibold text-slate-50">Вход в аккаунт</h1>
					<p className="mt-1 text-sm text-slate-400">Личный планировщик задач</p>
				</div>
				{children}
			</Card>
		</div>
	);
}
