import type { PropsWithChildren } from "react";
import { Button } from "../../shared/ui/Button";

export function MainLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<aside className="hidden w-64 border-r border-slate-800 bg-slate-950/80 p-4 md:flex md:flex-col">
				<div className="mb-6">
					<p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">todo-app</p>
					<h2 className="mt-2 text-sm font-semibold text-slate-50">Мои проекты</h2>
					<p className="mt-1 text-xs text-slate-500">Список проектов появится здесь.</p>
				</div>
				<div className="flex-1 overflow-y-auto rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-500">
					Пока заглушка. Позже здесь будет список проектов.
				</div>
				<Button className="mt-4 w-full" size="sm">
					+ Новый проект
				</Button>
			</aside>

			{/* Main area */}
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
					<div>
						<h1 className="text-sm font-semibold text-slate-50">todo-app</h1>
						<p className="text-xs text-slate-400">Ежедневный планировщик на MERN + Typescript</p>
					</div>
					<div className="flex items-center gap-3 text-xs text-slate-400">
						<span>
							Пользователь:{' '}
							<span className="font-medium text-slate-100">
								гость
							</span>
						</span>
					</div>
				</header>
				<main className="flex-1 bg-[radial-gradient(circle_at_top,#1f2937,#020617)] px-4 py-4">
					<div className="mx-auto h-full max-w-6xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
