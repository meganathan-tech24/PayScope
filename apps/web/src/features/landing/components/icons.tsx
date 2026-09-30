import type { ReactElement } from 'react';

type IconName = 'directory' | 'insights' | 'outliers' | 'currency' | 'privacy' | 'export';

const PATHS: Record<IconName, ReactElement> = {
  directory: <path d="M4 6h16M4 12h16M4 18h10" />,
  insights: <path d="M5 20V10M12 20V4M19 20v-7" />,
  outliers: (
    <>
      <path d="M4 18h16" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="12" cy="13" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
    </>
  ),
  currency: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.3-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" />
    </>
  ),
  privacy: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  export: <path d="M12 4v11M8 11l4 4 4-4M5 20h14" />,
};

export function FeatureIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
