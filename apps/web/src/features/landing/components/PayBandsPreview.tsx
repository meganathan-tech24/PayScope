// An illustration, not live data: middle-half pay range (the band), the median (the tick)
// and one flagged outlier (the amber dot) for one job title in four countries. Each row is
// on its own currency scale, which is the point: nothing is mixed.
const ROWS = [
  { country: 'United Kingdom', currency: 'GBP', band: 'ml-[28%] w-[34%]', median: 'left-[44%]' },
  {
    country: 'Germany',
    currency: 'EUR',
    band: 'ml-[22%] w-[38%]',
    median: 'left-[40%]',
    outlier: 'left-[92%]',
  },
  { country: 'India', currency: 'INR', band: 'ml-[34%] w-[26%]', median: 'left-[45%]' },
  { country: 'United States', currency: 'USD', band: 'ml-[30%] w-[40%]', median: 'left-[52%]' },
] as const;

export function PayBandsPreview() {
  return (
    <figure
      role="img"
      aria-label="Illustration: middle-half pay range and median for one job title in four countries, each in its own currency, with one outlier flagged in Germany"
      className="rounded-lg border border-ink-600 bg-ink-800 p-5 shadow-card sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Software Engineer</p>
          <p className="text-xs text-ink-300">Pay by country, each in its own currency</p>
        </div>
        <span className="badge bg-signal-100 text-ink">1 outlier flagged</span>
      </div>

      <ul className="mt-6 flex flex-col gap-5" aria-hidden="true">
        {ROWS.map((row) => (
          <li key={row.country} className="grid gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink-100">{row.country}</span>
              <span className="tabular-nums text-ink-300">{row.currency}</span>
            </div>
            <div className="relative h-3 rounded-full bg-ink-700">
              <div className={`absolute inset-y-0 rounded-full bg-brand-400 ${row.band}`} />
              <div className={`absolute inset-y-[-3px] w-0.5 bg-white ${row.median}`} />
              {'outlier' in row ? (
                <div
                  className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-signal ring-2 ring-ink-800 ${row.outlier}`}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <figcaption className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-5 rounded-full bg-brand-400" aria-hidden="true" />
          Middle half of pay
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-0.5 bg-white" aria-hidden="true" />
          Median
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden="true" />
          Outlier
        </span>
        <span className="w-full sm:w-auto">Illustrative sample</span>
      </figcaption>
    </figure>
  );
}
