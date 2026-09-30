import { LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { Suspense, useEffect, useId, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { ROLE_LABEL } from '../../features/auth/role-labels';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

import { Brand } from './Brand';

// Signed-in layout. From lg up the navigation is a fixed sidebar; below lg the same
// navigation is a drawer behind a menu button. Logging out ends the session, and
// ProtectedRoute then moves the visitor to /login.
export function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navId = useId();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // Choosing a link inside the open drawer closes it.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (navRef.current?.contains(target) && target.closest('a')) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-neutral-50 lg:grid lg:grid-cols-[14rem_1fr]">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="surface-dark sticky top-0 z-30 flex items-center justify-between bg-ink px-3 lg:hidden">
        <Brand tone="light" />
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-ink-700"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? 'Close app menu' : 'Open app menu'}</span>
          {open ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-ink/60 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <nav
        id={navId}
        aria-label="app menu"
        ref={navRef}
        className={[
          'surface-dark fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink px-3 pb-4 pt-3 transition-transform motion-reduce:transition-none',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0',
          open ? 'translate-x-0 shadow-overlay' : 'invisible -translate-x-full lg:visible',
        ].join(' ')}
      >
        <div className="hidden lg:block">
          <Brand tone="light" />
        </div>
        <ul className="mt-2 flex flex-col gap-1 lg:mt-6">
          <li>
            <NavLink to="/app" end className="side-link">
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/employees" className="side-link">
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              Employees
            </NavLink>
          </li>
        </ul>
        <div className="mt-auto flex flex-col gap-3 border-t border-ink-700 pt-4">
          {user ? (
            <div className="flex min-w-0 flex-col gap-1.5 px-1">
              <span className="truncate text-sm font-medium text-white" title={user.name}>
                {user.name}
              </span>
              <span className="badge w-fit bg-ink-700 text-ink-100">{ROLE_LABEL[user.role]}</span>
            </div>
          ) : null}
          <Button variant="outline-light" icon={LogOut} onClick={logout}>
            Log out
          </Button>
        </div>
      </nav>

      <main id="main" className="min-w-0">
        <div className="container-app py-6 lg:py-8">
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
        </div>
      </main>
    </div>
  );
}
