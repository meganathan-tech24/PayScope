import { SelectField } from '../../../components/ui/SelectField';
import { sortLabel } from '../lib/format';
import type { EmployeeListParams, SortDir } from '../types';

// A sort choice that works at every width (the table headers only exist from md up). The
// fields offered come from the role, so a VIEWER is never shown a salary option.
export function SortControls({
  fields,
  params,
  onChange,
}: {
  fields: readonly string[];
  params: EmployeeListParams;
  onChange: (patch: Partial<EmployeeListParams>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:hidden">
      <SelectField
        label="Sort by"
        value={params.sortBy}
        onChange={(event) => onChange({ sortBy: event.target.value })}
      >
        {fields.map((field) => (
          <option key={field} value={field}>
            {sortLabel(field)}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Order"
        value={params.sortDir}
        onChange={(event) => onChange({ sortDir: event.target.value as SortDir })}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </SelectField>
    </div>
  );
}
