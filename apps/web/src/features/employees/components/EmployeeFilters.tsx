import { SlidersHorizontal, X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { Button } from '../../../components/ui/Button';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { countryName } from '../lib/format';
import type { EmployeeListParams } from '../types';

interface EmployeeFiltersProps {
  params: EmployeeListParams;
  onChange: (patch: Partial<EmployeeListParams>, options?: { replace?: boolean }) => void;
  onClear: () => void;
  hasFilters: boolean;
  /** Extra controls that share the collapsible panel on small screens (the sort choice). */
  children?: ReactNode;
}

export function EmployeeFilters({
  params,
  onChange,
  onClear,
  hasFilters,
  children,
}: EmployeeFiltersProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  // The search box is always visible; the count is for the filters folded into the panel.
  const active = [params.country, params.department, params.jobTitle].filter(Boolean).length;
  const countries = useFilterOptions('country');
  const departments = useFilterOptions('department');
  const jobTitles = useFilterOptions('jobTitle');

  return (
    <form
      role="search"
      aria-label="Filter employees"
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:items-end"
    >
      <TextField
        label="Search by name or email"
        type="search"
        name="search"
        autoComplete="off"
        value={params.search}
        // Each keystroke updates the URL (replacing, so Back is not flooded); the request
        // itself waits until typing pauses.
        onChange={(event) => onChange({ search: event.target.value }, { replace: true })}
      />

      {/* Below md the rest of the filters fold into a panel; from md up they are always shown. */}
      <div className="md:hidden">
        <Button
          type="button"
          tone="neutral"
          look="outline"
          icon={SlidersHorizontal}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          Filters and sort
          {active > 0 ? (
            <>
              <span className="badge-brand" aria-hidden="true">
                {active}
              </span>
              <span className="sr-only">, {active} active</span>
            </>
          ) : null}
        </Button>
      </div>

      <div
        id={panelId}
        className={[
          'gap-4 md:grid md:grid-cols-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]',
          open ? 'grid grid-cols-1 sm:grid-cols-2' : 'hidden',
        ].join(' ')}
      >
        <SelectField
          label="Country"
          value={params.country}
          onChange={(event) => onChange({ country: event.target.value })}
        >
          <option value="">All countries</option>
          {(countries.data ?? []).map((code) => (
            <option key={code} value={code}>
              {countryName(code)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Department"
          value={params.department}
          onChange={(event) => onChange({ department: event.target.value })}
        >
          <option value="">All departments</option>
          {(departments.data ?? []).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Job title"
          value={params.jobTitle}
          onChange={(event) => onChange({ jobTitle: event.target.value })}
        >
          <option value="">All job titles</option>
          {(jobTitles.data ?? []).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
        <div className="flex items-end">
          <Button
            type="button"
            tone="neutral"
            look="outline"
            icon={X}
            onClick={onClear}
            disabled={!hasFilters}
          >
            Clear filters
          </Button>
        </div>
        {children ? <div className="sm:col-span-2 md:hidden">{children}</div> : null}
      </div>
    </form>
  );
}
