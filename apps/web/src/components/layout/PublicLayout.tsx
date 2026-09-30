import { NavLink, Outlet, useLocation } from 'react-router';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { buttonClass } from '../ui/button-styles';

import { Brand } from './Brand';
import { NavMenu } from './NavMenu';

// Header and footer for the public pages (landing, login, register, 403, 404).
export function PublicLayout() {
  const { status } = useAuth();
  const onLanding = useLocation().pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="relative border-b border-neutral-200 bg-white">
        <div className="container-page flex items-center justify-between py-2">
          <Brand />
          <NavMenu label="main menu">
            {onLanding ? (
              <>
                <a href="#features" className="nav-link">
                  Features
                </a>
                <a href="#how-it-works" className="nav-link">
                  How it works
                </a>
                <a href="#roles" className="nav-link">
                  Who sees what
                </a>
              </>
            ) : null}
            {status === 'authenticated' ? (
              <NavLink to="/app" className={buttonClass('primary')}>
                Open app
              </NavLink>
            ) : (
              <>
                <NavLink to="/login" className="nav-link">
                  Sign in
                </NavLink>
                <NavLink to="/register" className={buttonClass('primary')}>
                  Create account
                </NavLink>
              </>
            )}
          </NavMenu>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200 bg-white">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>PayScope, salary management and pay insights for ACME.</p>
          <p>Demo application: all data is synthetic.</p>
        </div>
      </footer>
    </div>
  );
}
