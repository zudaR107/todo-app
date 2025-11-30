import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../../features/auth/api';
import { ApiError } from '../../shared/lib/api-client';

vi.mock('../../features/auth/api');

const mockedAuthApi = vi.mocked(authApi);

function StatusProbe() {
  const { status, user } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user-email">{user?.email ?? ''}</span>
    </div>
  );
}

function LogoutProbe() {
  const { status, user, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user-email">{user?.email ?? ''}</span>
      <button
        type="button"
        data-testid="logout-btn"
        onClick={() => {
          void logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('при монтировании успешно восстанавливает сессию', async () => {
    const user = {
      id: '1',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'superadmin' as const,
    };

    mockedAuthApi.refresh.mockResolvedValue({ accessToken: 'token123' });
    mockedAuthApi.me.mockResolvedValue(user);

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('admin@example.com');
    expect(mockedAuthApi.refresh).toHaveBeenCalledTimes(1);
    expect(mockedAuthApi.me).toHaveBeenCalledTimes(1);
  });

  it('при 401 от /auth/refresh переводит в unauthenticated', async () => {
    mockedAuthApi.refresh.mockRejectedValue(new ApiError(401, { message: 'Unauthorized' }));

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('');
    expect(mockedAuthApi.refresh).toHaveBeenCalledTimes(1);
    expect(mockedAuthApi.me).not.toHaveBeenCalled();
  });

  it('logout вызывает /auth/logout и очищает состояние', async () => {
    const user = {
      id: '1',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'superadmin' as const,
    };

    mockedAuthApi.refresh.mockResolvedValue({ accessToken: 'token123' });
    mockedAuthApi.me.mockResolvedValue(user);
    mockedAuthApi.logout.mockResolvedValue();

    render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('admin@example.com');

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('');
    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1);
  });
});
