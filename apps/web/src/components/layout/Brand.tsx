import { Link } from 'react-router';

// A link, not a heading: every page owns exactly one h1.
export function Brand({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link
      to="/"
      className={[
        'inline-flex min-h-11 items-center gap-2.5 text-lg font-semibold tracking-tight',
        tone === 'light' ? 'text-white' : 'text-neutral-900',
      ].join(' ')}
    >
      <LogoMark tone={tone} />
      PayScope
    </Link>
  );
}

// Three rising pay bars in a rounded square; the middle bar is the only amber in the mark.
export function LogoMark({
  tone = 'dark',
  className = 'h-7 w-7',
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <svg viewBox="0 0 28 28" className={`${className} shrink-0`} fill="none" aria-hidden="true">
      <rect
        width="28"
        height="28"
        rx="7"
        className={tone === 'light' ? 'fill-brand-500' : 'fill-brand-600'}
      />
      <rect x="6" y="15" width="4" height="7" rx="1" className="fill-white" />
      <rect x="12" y="10" width="4" height="12" rx="1" className="fill-signal" />
      <rect x="18" y="6" width="4" height="16" rx="1" className="fill-white" />
    </svg>
  );
}
