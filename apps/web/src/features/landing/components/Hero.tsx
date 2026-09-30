import { Link } from 'react-router';

import { buttonClass } from '../../../components/ui/button-styles';
import { useAuth } from '../../auth/hooks/useAuth';

import { PayBandsPreview } from './PayBandsPreview';

export function Hero() {
  const { status } = useAuth();

  return (
    <section aria-labelledby="hero-title" className="bg-ink text-ink-100">
      <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-signal">
            Salary management for HR
          </p>
          <h1
            id="hero-title"
            className="display text-4xl font-semibold text-white sm:text-5xl lg:text-6xl"
          >
            Know how you pay.
            <br />
            <span className="text-signal">Spot where it drifts.</span>
          </h1>
          <p className="max-w-xl text-lg text-ink-100">
            PayScope replaces the salary spreadsheet. Manage 10,000 employees across countries and
            currencies, and see pay by country, job title and department at a glance.
          </p>
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
          <p className="text-sm text-ink-300">
            Per currency by default. Nothing is converted behind your back.
          </p>
        </div>
        <PayBandsPreview />
      </div>
    </section>
  );
}
