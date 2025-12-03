import React, { useState } from 'react';
import { z } from 'zod';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { Spinner } from '../../../shared/ui/Spinner';
import { useCreateProjectMutation } from '../hooks';
import type { CreateProjectBody, Project } from '../api';
import { cn } from '../../../shared/lib/cn';

type ProjectCreateFormVariant = 'page' | 'sidebar';

interface ProjectCreateFormProps {
  onCreated?: (project: Project) => void;
  onCancel?: () => void;
  variant?: ProjectCreateFormVariant;
  className?: string;
}

const projectCreateSchema = z.object({
  name: z.string().min(1, 'Введите название проекта').max(100),
  color: z.string().optional(),
});

type FieldErrors = Partial<Record<'name', string>>;

export function ProjectCreateForm({
  onCreated,
  onCancel,
  variant = 'page',
  className,
}: ProjectCreateFormProps) {
  const createMutation = useCreateProjectMutation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981'); // emerald-500 by default
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = createMutation.isPending;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const values: CreateProjectBody = {
      name,
      color,
    };

    const result = projectCreateSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'name') {
          nextErrors.name = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    try {
      const created = await createMutation.mutateAsync(result.data);
      setName('');
      setFormError(null);
      if (onCreated) {
        onCreated(created);
      }
    } catch {
      setFormError('Не удалось создать проект. Попробуйте еще раз.');
    }
  };

  const labelClass =
    variant === 'sidebar'
      ? 'block text-[11px] font-medium text-slate-200'
      : 'block text-xs font-medium text-slate-200';

  const descriptionClass =
    variant === 'sidebar' ? 'mt-1 text-[11px] text-slate-500' : 'mt-1 text-xs text-slate-500';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn('space-y-3', className)}
      id={variant === 'page' ? 'project-create-form' : undefined}
    >
      <div className="space-y-1.5">
        <label htmlFor="project-name" className={labelClass}>
          Название проекта
        </label>
        <Input
          id="project-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder='Например, "Личное" или "Работа"'
          autoComplete="off"
          required
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
        ) : (
          <p className={descriptionClass}>Минимум одно слово. Название можно изменить позже.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className={labelClass}>Цвет проекта</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            name="color"
            aria-label="Цвет проекта"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-8 w-8 cursor-pointer rounded-md border border-slate-700 bg-slate-900/80"
          />
          <span className="text-xs text-slate-400">
            Цвет используется как индикатор проекта в списках и календаре.
          </span>
        </div>
      </div>

      {formError ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {formError}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> <span>Создаём...</span>
            </span>
          ) : (
            'Создать проект'
          )}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-3 text-xs"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}
