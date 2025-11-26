import { Card } from "../../../shared/ui/Card";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Button } from "../../../shared/ui/Button";

export function CalendarPage() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h1 className="text-lg font-semibold text-slate-50">Календарь</h1>
					<p className="text-sm text-slate-400">
						Здесь будет календарный вид задач по выбранному диапазону дат.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" size="sm">
						Сегодня
					</Button>
					<Button variant="secondary" size="sm">
						Неделя
					</Button>
				</div>
			</div>

			<Card>
				<EmptyState 
					title="Календарь пока пуст"
					description="Когда вы добавите задачи с датами начала или дедлайна, они появятся здесь."
				/>
			</Card>
		</div>
	);
}
