import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../hooks/useAuth';

import { FullPageSpinner } from './ProtectedRoute';

// /login and /register make no sense once signed in.
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;
  return <Outlet />;
}
