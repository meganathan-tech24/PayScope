import { LoginForm } from '../features/auth/components/LoginForm';

export function LoginPage() {
  return (
    <div className="container-page grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="display text-3xl font-semibold sm:text-4xl">Sign in</h1>
          <p className="text-neutral-600">
            One sign-in for every account type. What you see afterwards depends on your role.
          </p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
      </div>
      <aside
        aria-label="About signing in"
        className="hidden rounded-lg bg-ink p-8 text-ink-100 lg:flex lg:flex-col lg:justify-end"
      >
        <p className="display text-2xl font-semibold text-white">
          Pay decisions, with the numbers in front of you.
        </p>
        <p className="mt-3 max-w-prose text-sm">
          HR Managers see every figure. Viewers see the directory and aggregated statistics, never
          an individual salary.
        </p>
      </aside>
    </div>
  );
}
