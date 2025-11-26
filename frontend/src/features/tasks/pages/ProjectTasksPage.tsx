import { useParams } from "react-router-dom";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";

export function ProjectTasksPage() {
	const { projectId } = useParams<{ projectId: string }>();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h1 className="text-lg font-semibold text-slate-50">
						Задачи проекта {projectId ?? ''}
					</h1>
					<p className="text-sm text-slate-400">
						Позже здесь появится список задач и фильтры.
					</p>
				</div>
				<Button>+ Задача</Button>
			</div>

			<Card>
				<EmptyState 
					title="Задач пока нет"
					description="Когда вы создадите задачи, они появятся здесь."
				/>
			</Card>
		</div>
	);
}
