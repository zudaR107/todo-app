import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Spinner } from '../../../shared/ui/Spinner';
import { useLoginMutation } from '../hooks';
import { ROUTES } from '../../../app/routes';
import { ApiError } from '../../../shared/lib/api-client';
import type { LoginBody } from '../api';

type FieldErrors = Partial<Record<keyof LoginBody, string>>;

const loginSchema = z.object({
  email: z.email('Введите корректный email'),
  password: z.string().min(6, 'Введите пароль'),
});

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const values: LoginBody = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    };

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (path === 'email' || path === 'password') {
          nextErrors[path] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    try {
      await loginMutation.mutateAsync(values);
      navigate(ROUTES.projects);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Неверный логин или пароль');
      } else {
        setFormError('Не удалось выполнить вход. Попробуйте еще раз.');
      }
    }
  };

  const isSubmitting = loginMutation.isPending;

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {fieldErrors.email ? (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200" htmlFor="password">
          Пароль
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {fieldErrors.password ? (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {formError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner /> <span>Входим...</span>
          </span>
        ) : (
          'Войти'
        )}
      </Button>
    </form>
  );
}
