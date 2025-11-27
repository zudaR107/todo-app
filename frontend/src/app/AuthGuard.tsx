import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './routes';
import { Spinner } from '../shared/ui/Spinner';

export function AuthGuard({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return children;
}
