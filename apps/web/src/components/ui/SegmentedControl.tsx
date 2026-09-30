import { useId } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

// A native radio group styled as buttons: arrow keys, the legend and the checked state come
// from the browser, and the choice is shown by fill and weight as well as colour.
export function SegmentedControl<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
}) {
  const name = useId();

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="field-label mb-1.5">{legend}</legend>
      <div className="flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-neutral-700 hover:bg-white peer-checked:bg-ink peer-checked:font-semibold peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
