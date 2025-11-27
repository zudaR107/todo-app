import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import type { Me } from '../../shared/types/api';
import { setAccessToken } from '../../shared/lib/auth-storage';
import { ApiError } from '../../shared/lib/api-client';
import * as authApi from '../../features/auth/api';
import type { AuthStatus, AuthContextValue } from '../hooks/useAuth';
import { AuthContext } from '../hooks/useAuth';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');

  const refreshSession: AuthContextValue['refreshSession'] = async () => {
    setStatus('loading');

    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);

      const me = await authApi.me();
      setUser(me);
      setStatus('authenticated');
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) {
        console.error('Failed to refresh session', error);
      }

      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  const login: AuthContextValue['login'] = (nextUser, accessToken) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  };

  const logout: AuthContextValue['logout'] = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Failed to logout', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
