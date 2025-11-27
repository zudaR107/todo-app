import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../../test/utils/renderWithProviders';
import { LoginForm } from './LoginForm';
import * as authApi from '../api';
import { AuthContext, type AuthContextValue } from '../../../app/hooks/useAuth';
import { ApiError } from '../../../shared/lib/api-client';
import { ROUTES } from '../../../app/routes';

vi.mock('../api');

const mockedAuthApi = vi.mocked(authApi);

function createAuthContextValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    status: 'unauthenticated',
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит форму логина', () => {
    const authValue = createAuthContextValue();

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginForm />} />
        </Routes>
      </AuthContext.Provider>,
      { route: ROUTES.login },
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('показывает ошибки валидации при пустых полях', async () => {
    const authValue = createAuthContextValue();

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginForm />} />
        </Routes>
      </AuthContext.Provider>,
      { route: ROUTES.login },
    );

    const submitButton = screen.getByRole('button', { name: /войти/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/введите корректный email/i)).toBeInTheDocument();
    expect(await screen.findByText(/введите пароль/i)).toBeInTheDocument();
    expect(mockedAuthApi.login).not.toHaveBeenCalled();
  });

  it('успешно логинит и переходит на /projects', async () => {
    const loginSpy = vi.fn();
    const authValue = createAuthContextValue({ login: loginSpy });

    const userResponse = {
      id: '1',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'superadmin' as const,
    };

    mockedAuthApi.login.mockResolvedValue({ accessToken: 'token123' });
    mockedAuthApi.me.mockResolvedValue(userResponse);

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginForm />} />
          <Route path={ROUTES.projects} element={<div>Projects page</div>} />
        </Routes>
      </AuthContext.Provider>,
      { route: ROUTES.login },
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'admin123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith(userResponse, 'token123');
    });

    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'admin123',
    });
    expect(mockedAuthApi.me).toHaveBeenCalledTimes(1);

    expect(await screen.findByText(/projects page/i)).toBeInTheDocument();
  });

  it('показывает ошибку при 401 от /auth/login', async () => {
    const authValue = createAuthContextValue();

    mockedAuthApi.login.mockRejectedValue(new ApiError(401, { message: 'Unauthorized' }));

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginForm />} />
        </Routes>
      </AuthContext.Provider>,
      { route: ROUTES.login },
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText(/неверный логин или пароль/i)).toBeInTheDocument();
  });

  it('показывает общую ошибку при других сбоях', async () => {
    const authValue = createAuthContextValue();

    mockedAuthApi.login.mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginForm />} />
        </Routes>
      </AuthContext.Provider>,
      { route: ROUTES.login },
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'admin123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText(/не удалось выполнить вход/i)).toBeInTheDocument();
  });
});
