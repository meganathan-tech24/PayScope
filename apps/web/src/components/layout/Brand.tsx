import { Link } from 'react-router';

// A link, not a heading: every page owns exactly one h1.
export function Brand({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link
      to="/"
      className={[
        'display inline-flex min-h-11 items-center gap-2 text-xl font-semibold',
        tone === 'light' ? 'text-white' : 'text-neutral-900',
      ].join(' ')}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" aria-hidden="true">
        <rect x="3" y="13" width="4" height="8" rx="1" className="fill-brand-500" />
        <rect x="10" y="7" width="4" height="14" rx="1" className="fill-signal" />
        <rect x="17" y="3" width="4" height="18" rx="1" className="fill-brand-300" />
      </svg>
      PayScope
    </Link>
  );
}
