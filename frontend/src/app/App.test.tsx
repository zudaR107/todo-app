import { render, screen, waitFor } from '@testing-library/react';
import { vi, type Mocked } from 'vitest';
import App from './App';
import * as authApi from '../features/auth/api';
import type { Me } from '../shared/types/api';

vi.mock('../features/auth/api', () => ({
  login: vi.fn(),
  refresh: vi.fn(),
  me: vi.fn(),
  logout: vi.fn(),
}));

const mockedAuthApi = authApi as Mocked<typeof authApi>;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит корневой layout', async () => {
    mockedAuthApi.refresh.mockResolvedValue({
      accessToken: 'test-token',
    });

    const fakeUser: Me = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    };
    mockedAuthApi.me.mockResolvedValue(fakeUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
    });
  });
});
