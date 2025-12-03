import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProjectsQuery } from '../features/projects/hooks';
import { ROUTES } from './routes';
import { Spinner } from '../shared/ui/Spinner';

export function RequireProjects({ children }: PropsWithChildren) {
  const { data: projects, isLoading, isError } = useProjectsQuery();
  const location = useLocation();

  const hasProjects = (projects?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!hasProjects && !isError) {
    return <Navigate to={ROUTES.projects} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
