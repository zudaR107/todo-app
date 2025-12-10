import * as React from 'react';
import { Card } from '../../../shared/ui/Card';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { cn } from '../../../shared/lib/cn';
import type { TasksFilters } from '../hooks';
import type { TaskPriority, TaskStatus } from '../api';
import { defaultTasksFilters } from '../hooks';

interface TaskFiltersProps {
  value: TasksFilters;
  onChange: (next: TasksFilters) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'В работе' },
  { value: 'done', label: 'Готово' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
];

export function TaskFilters({ value, onChange, className }: TaskFiltersProps) {
  const [search, setSearch] = React.useState(value.q);

  React.useEffect(() => {
    setSearch(value.q);
  }, [value.q]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      if (search !== value.q) {
        onChange({ ...value, q: search });
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [search, value, onChange]);

  const handleReset = () => {
    onChange({ ...defaultTasksFilters });
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value as TaskStatus | '';
    onChange({
      ...value,
      status: raw === '' ? null : raw,
    });
  };

  const handlePriorityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value as TaskPriority | '';
    onChange({
      ...value,
      priority: raw === '' ? null : raw,
    });
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      tag: event.target.value,
    });
  };

  const handleDueFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      dueFrom: event.target.value,
    });
  };

  const handleDueToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      dueTo: event.target.value,
    });
  };

  return (
    <Card className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-50">Фильтры</h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-[11px] text-slate-400 hover:text-slate-50"
          onClick={handleReset}
        >
          Сбросить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Статус</label>
          <select
            value={value.status ?? ''}
            onChange={handleStatusChange}
            className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-50 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/60"
          >
            <option value="">Любой статус</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Приоритет</label>
          <select
            value={value.priority ?? ''}
            onChange={handlePriorityChange}
            className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-50 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/60"
          >
            <option value="">Любой приоритет</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Тег</label>
          <Input value={value.tag} onChange={handleTagChange} placeholder="например: #личное" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Поиск по названию</label>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="например: созвон"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Дедлайн с</label>
          <Input type="date" value={value.dueFrom} onChange={handleDueFromChange} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Дедлайн до</label>
          <Input type="date" value={value.dueTo} onChange={handleDueToChange} />
        </div>
      </div>
    </Card>
  );
}
