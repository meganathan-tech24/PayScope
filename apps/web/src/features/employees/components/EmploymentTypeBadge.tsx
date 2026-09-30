import { employmentTypeLabel } from '../lib/format';

// The label always carries the meaning; the tint only groups the types at a glance.
const TONE: Record<string, string> = {
  FULL_TIME: 'bg-brand-100 text-brand-700',
  PART_TIME: 'bg-sky-100 text-sky-900',
  CONTRACT: 'bg-neutral-200 text-neutral-800',
  INTERN: 'bg-orange-100 text-orange-900',
};

export function EmploymentTypeBadge({ type }: { type: string }) {
  return (
    <span className={`badge whitespace-nowrap ${TONE[type] ?? 'bg-neutral-100 text-neutral-800'}`}>
      {employmentTypeLabel(type)}
    </span>
  );
}
