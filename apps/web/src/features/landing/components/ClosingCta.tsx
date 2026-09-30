import { Link } from 'react-router';

import { buttonClass } from '../../../components/ui/button-styles';
import { useAuth } from '../../auth/hooks/useAuth';

export function ClosingCta() {
  const { status } = useAuth();

  return (
    <section aria-labelledby="cta-title" className="bg-ink text-ink-100">
      <div className="container-page flex flex-col items-start gap-6 py-14 sm:py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 id="cta-title" className="display text-3xl font-semibold text-white sm:text-4xl">
            See your pay data clearly
          </h2>
          <p className="mt-2 text-ink-100">
            Create an account in a minute, or sign in if you already have one.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {status === 'authenticated' ? (
            <Link to="/app" className={buttonClass('signal', 'lg')}>
              Open the app
            </Link>
          ) : (
            <>
              <Link to="/register" className={buttonClass('signal', 'lg')}>
                Create an account
              </Link>
              <Link to="/login" className={buttonClass('outline-light', 'lg')}>
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
