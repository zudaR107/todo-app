import { useMutation } from '@tanstack/react-query';
import type { LoginBody } from './api';
import * as authApi from './api';
import type { Me } from '../../shared/types/api';
import { useAuth } from '../../app/hooks/useAuth';
import { setAccessToken } from '../../shared/lib/auth-storage';

export function useLoginMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (body: LoginBody) => {
      const { accessToken } = await authApi.login(body);
      setAccessToken(accessToken);
      const me = await authApi.me();
      login(me, accessToken);
      return me;
    },
  });
}

export function useMeQuery() {
  const { user, status } = useAuth();

  const isLoading = status === 'idle' || status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isError = status === 'unauthenticated';

  return {
    data: user as Me | null,
    status,
    isLoading,
    isError,
    isAuthenticated,
    error: null as unknown as Error | null,
  };
}
