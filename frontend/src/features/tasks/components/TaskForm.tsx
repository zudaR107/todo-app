import * as React from 'react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Textarea } from '../../../shared/ui/Textarea';
import type { Task, TaskPriority, TaskStatus } from '../api';
import { cn } from '../../../shared/lib/cn';

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tagInput: string;
  dueDate: string;
}

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialTask?: Task | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  externalError?: string | null;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TaskForm({
  mode,
  initialTask,
  open,
  onClose,
  onSubmit,
  isSubmitting,
  externalError,
}: TaskFormProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<TaskStatus>('todo');
  const [priority, setPriority] = React.useState<TaskPriority>('normal');
  const [tagInput, setTagInput] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description ?? '');
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setTagInput(initialTask.tags.join(', '));
      setDueDate(toDateInputValue(initialTask.dueAt ?? null));
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('normal');
      setTagInput('');
      setDueDate('');
    }
    setValidationError(null);
  }, [mode, initialTask, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setValidationError('Введите название задачи.');
      return;
    }

    setValidationError(null);

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      tagInput,
      dueDate,
    });
  };

  const titleText = mode === 'create' ? 'Новая задача' : 'Редактирование задачи';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg bg-slate-950/90">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">{titleText}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {mode === 'create'
                  ? 'Опишите задачу, приоритет и дедлайн. Всё это можно поменять позже.'
                  : 'Обновите параметры задачи. Изменения применятся сразу после сохранения.'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-slate-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Закрыть
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Название</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например: созвон с клиентом"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Описание</label>
              <Textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Кратко опишите, что нужно сделать."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">Статус</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TaskStatus)}
                  className={cn(
                    'h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-50',
                    'shadow-sm outline-none transition-colors focus:border-emerald-500',
                    'focus:ring-2 focus:ring-emerald-500/60',
                  )}
                >
                  <option value="todo">To do</option>
                  <option value="doing">В работе</option>
                  <option value="done">Готово</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">Приоритет</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskPriority)}
                  className={cn(
                    'h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-50',
                    'shadow-sm outline-none transition-colors focus:border-emerald-500',
                    'focus:ring-2 focus:ring-emerald-500/60',
                  )}
                >
                  <option value="low">Низкий</option>
                  <option value="normal">Обычный</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                Теги (через запятую)
              </label>
              <Input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="например: работа, срочно"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Дедлайн</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Дедлайн используется в фильтрах и календаре. Можно оставить пустым.
              </p>
            </div>

            {validationError ? (
              <p className="text-xs text-red-400">{validationError}</p>
            ) : externalError ? (
              <p className="text-xs text-red-400">{externalError}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {mode === 'create' ? 'Создать задачу' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
