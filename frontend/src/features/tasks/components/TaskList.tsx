import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import type { Task, TaskPriority, TaskStatus } from '../api';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString();
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'todo':
      return <Badge variant="muted">To do</Badge>;
    case 'doing':
      return <Badge variant="warning">В работе</Badge>;
    case 'done':
      return <Badge variant="success">Готово</Badge>;
    default:
      return <Badge variant="muted">Неизвестно</Badge>;
  }
}

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  switch (priority) {
    case 'low':
      return <Badge variant="muted">Низкий приоритет</Badge>;
    case 'normal':
      return <Badge variant="outline">Обычный приоритет</Badge>;
    case 'high':
      return <Badge variant="danger">Высокий приоритет</Badge>;
    default:
      return <Badge variant="outline">Неизвестно</Badge>;
  }
}

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
  if (!tasks.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const dueLabel = formatDate(task.dueAt);
        const startLabel = formatDate(task.startAt);

        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onTaskClick?.(task)}
            className="w-full text-left"
          >
            <Card className="flex flex-col gap-3 border-slate-800/80 bg-slate-900/80 transition-colors hover:border-emerald-500/40 hover:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                  <h3 className="truncate text-sm font-semibold text-slate-50">{task.title}</h3>
                  {task.description ? (
                    <p className="line-clamp-2 text-xs text-slate-400">{task.description}</p>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                  {task.tags && task.tags.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {task.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="max-w-[120px] truncate">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 4 ? (
                        <span className="text-[11px] text-slate-500">+{task.tags.length - 4}</span>
                      ) : null}
                    </div>
                  ) : null}

                  {dueLabel ? (
                    <span className="text-[11px] text-slate-400">
                      Дедлайн: <span className="text-slate-200">{dueLabel}</span>
                    </span>
                  ) : startLabel ? (
                    <span className="text-[11px] text-slate-400">
                      Начало: <span className="text-slate-200">{startLabel}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
