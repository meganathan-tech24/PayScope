import { useId } from 'react';

import { SelectField } from '../../../components/ui/SelectField';
import type { CurrencyOption } from '../lib/currencies';
import { currencyLabel } from '../lib/notes';

interface Props {
  options: CurrencyOption[];
  currency: string;
  usd: boolean;
  onCurrency: (code: string) => void;
  onUsd: (on: boolean) => void;
}

// Pay statistics are per currency, so choosing one is required. The USD view is a separate,
// clearly labelled, off-by-default switch.
export function CurrencyControls({ options, currency, usd, onCurrency, onUsd }: Props) {
  const switchId = useId();
  const hintId = `${switchId}-hint`;

  return (
    <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-end">
      <SelectField
        label="Currency"
        value={currency}
        disabled={usd}
        hint={
          usd
            ? 'Not used while the USD view is on'
            : 'Pay statistics are shown one currency at a time'
        }
        onChange={(event) => onCurrency(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {currencyLabel(option.code)}
          </option>
        ))}
      </SelectField>
      <div className="relative flex min-h-11 items-start gap-3 rounded-lg bg-neutral-50 px-4 py-3">
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          checked={usd}
          aria-describedby={hintId}
          onChange={(event) => onUsd(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
        />
        <div className="flex flex-col">
          {/* The label's ::after covers the whole box, so the whole box is the click target. */}
          <label
            htmlFor={switchId}
            className="cursor-pointer text-sm font-medium text-neutral-900 after:absolute after:inset-0"
          >
            Show approximate USD view
          </label>
          <p id={hintId} className="text-sm text-neutral-600">
            Converts every currency to US dollars at fixed sample rates. Off by default.
          </p>
        </div>
      </div>
    </div>
  );
}
