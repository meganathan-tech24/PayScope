import { useId } from 'react';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface RadioCardGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: readonly RadioOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

// A native radio group in a fieldset: arrow keys, labels and the legend come for free.
export function RadioCardGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  disabled,
}: RadioCardGroupProps<T>) {
  const groupId = useId();

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="field-label mb-1">{legend}</legend>
      {options.map((option) => {
        const descriptionId = `${groupId}-${option.value}`;
        return (
          <label key={option.value} className="radio-card">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-describedby={descriptionId}
              className="row-span-2 mt-1 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span className="text-sm font-semibold text-neutral-900">{option.label}</span>
            <span id={descriptionId} className="col-start-2 text-sm text-neutral-600">
              {option.description}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
