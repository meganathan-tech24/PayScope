import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { safeRedirectTarget } from '../lib/redirect';

import { FullPageSpinner } from './ProtectedRoute';

// /login and /register make no sense once signed in. Signing in flips the session to
// authenticated, and this is what moves the visitor on: back to where they were heading
// (inside the app only), otherwise /app.
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={safeRedirectTarget(from)} replace />;
  }
  return <Outlet />;
}
