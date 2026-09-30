import type { Role } from '@payscope/types';
import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../hooks/useAuth';

// Sits inside ProtectedRoute. The API enforces the same rule; this only avoids
// showing a page the server would refuse.
export function RoleGuard({ roles }: { roles: readonly Role[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
