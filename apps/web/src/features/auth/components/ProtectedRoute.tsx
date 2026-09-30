import { Navigate, Outlet, useLocation } from 'react-router';

import { Spinner } from '../../../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-neutral-600">
      <Spinner label="Loading" />
    </div>
  );
}

// Signed-out visitors go to /login (remembering where they were going); while the
// session is still being checked nothing is decided, so there is no flash of the login page.
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthenticated') {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }
  return <Outlet />;
}
