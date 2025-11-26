import { useParams } from "react-router-dom";
import { Card } from "../../../shared/ui/Card";
import { EmptyState } from "../../../shared/ui/EmptyState";

export function BoardPage() {
	const { projectId } = useParams<{ projectId: string }>();

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold text-slate-50">
					Канбан-доска проекта {projectId ?? ''}
				</h1>
				<p className="text-sm text-slate-400">
					В версии MVP здесь будет доска с колонками To Do / Doing / Done.
				</p>
			</div>

			<Card>
				<EmptyState 
					title="Задач пока нет"
					description="Создайте несколько задач в проекте, чтобы увидеть их на доске."
				/>
			</Card>
		</div>
	);
}
