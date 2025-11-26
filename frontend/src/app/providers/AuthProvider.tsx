import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import type { Me } from '../../shared/types/api';
import { setAccessToken } from '../../shared/lib/auth-storage';
import type { AuthStatus, AuthContextValue } from '../hooks/useAuth';
import { AuthContext } from '../hooks/useAuth';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');

  const login: AuthContextValue['login'] = (nextUser, accessToken) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  };

  const logout: AuthContextValue['logout'] = () => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  };

  const value: AuthContextValue = {
    user,
    status,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
