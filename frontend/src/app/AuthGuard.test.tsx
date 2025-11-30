import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { AuthContext, type AuthContextValue } from './hooks/useAuth';
import { ROUTES } from './routes';

function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    status: 'unauthenticated',
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderWithAuth(authValue: AuthContextValue, initialPath = ROUTES.projects) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path={ROUTES.projects}
            element={
              <AuthGuard>
                <div>Private page</div>
              </AuthGuard>
            }
          />
          <Route path={ROUTES.login} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('AuthGuard', () => {
  it('показывает спиннер при загрузке сессии', () => {
    const authValue = createAuthValue({ status: 'loading' });

    renderWithAuth(authValue);

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('редиректит на /login при отсутствии сессии', () => {
    const authValue = createAuthValue({ status: 'unauthenticated', user: null });

    renderWithAuth(authValue);

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it('показывает приватный контент при authenticated', () => {
    const authValue = createAuthValue({
      status: 'authenticated',
      user: {
        id: '1',
        email: 'user@example.com',
        displayName: 'User',
        role: 'user',
      },
    });

    renderWithAuth(authValue);

    expect(screen.getByText(/private page/i)).toBeInTheDocument();
  });
});
