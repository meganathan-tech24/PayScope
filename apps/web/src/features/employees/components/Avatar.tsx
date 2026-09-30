import { initials } from '../lib/format';

// Decorative: the name is always written next to it.
export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
    >
      {initials(name)}
    </span>
  );
}
