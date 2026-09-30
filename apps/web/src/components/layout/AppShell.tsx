import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { ROLE_LABEL } from '../../features/auth/role-labels';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

import { Brand } from './Brand';
import { NavMenu } from './NavMenu';

// Signed-in layout: role-aware navigation, who you are, and a visible Log out. Logging
// out ends the session, and ProtectedRoute then moves the visitor to /login.
export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="relative border-b border-neutral-200 bg-white">
        <div className="container-page flex items-center justify-between gap-4 py-2">
          <Brand />
          <NavMenu label="app menu">
            <NavLink to="/app" end className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/app/employees" className="nav-link">
              Employees
            </NavLink>
            <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-3 md:ml-2 md:mt-0 md:border-0 md:pt-0">
              {user ? (
                <p className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="max-w-[10rem] truncate font-medium">{user.name}</span>
                  <span className="badge-brand">{ROLE_LABEL[user.role]}</span>
                </p>
              ) : null}
              <Button variant="secondary" onClick={logout}>
                Log out
              </Button>
            </div>
          </NavMenu>
        </div>
      </header>
      <main id="main" className="container-page flex-1 py-8">
        {/* The signed-in pages (and Recharts) are loaded on demand. */}
        <Suspense
          fallback={
            <div className="flex justify-center py-16 text-neutral-600">
              <Spinner label="Loading page" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
