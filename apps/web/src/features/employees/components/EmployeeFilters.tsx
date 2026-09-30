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
}

export function EmployeeFilters({ params, onChange, onClear, hasFilters }: EmployeeFiltersProps) {
  const countries = useFilterOptions('country');
  const departments = useFilterOptions('department');
  const jobTitles = useFilterOptions('jobTitle');

  return (
    <form
      role="search"
      aria-label="Filter employees"
      onSubmit={(event) => event.preventDefault()}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="sm:col-span-2 lg:col-span-4">
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
      </div>
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
        <Button type="button" variant="secondary" onClick={onClear} disabled={!hasFilters}>
          Clear filters
        </Button>
      </div>
    </form>
  );
}
