import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';

export function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Проекты</h1>
          <p className="text-sm text-slate-400">Здесь будет список ваших проектов.</p>
        </div>
        <Button>+ Новый проект</Button>
      </div>

      <Card className="mt-2">
        <EmptyState
          title="Проектов пока нет"
          description="Создайте первый проект, чтобы начать планировать задачи."
          actionLabel="Создать проект"
          onActionClick={() => {}}
        />
      </Card>
    </div>
  );
}
