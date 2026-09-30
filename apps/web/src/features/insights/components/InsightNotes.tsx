import { Alert } from '../../../components/ui/Alert';
import { hiddenGroupsMessage } from '../lib/notes';

export function HiddenGroupsNote({ count }: { count: number }) {
  if (count <= 0) return null;
  return <Alert tone="info">{hiddenGroupsMessage(count)}</Alert>;
}

/** Shown in every section while the USD view is on. */
export function ApproximateNote({ excludedHeadcount = 0 }: { excludedHeadcount?: number }) {
  return (
    <Alert tone="info">
      <strong>Approximate.</strong> Amounts are US dollars converted at fixed sample exchange rates,
      not live rates.
      {excludedHeadcount > 0
        ? ` ${excludedHeadcount} ${excludedHeadcount === 1 ? 'employee has' : 'employees have'} no exchange rate and ${excludedHeadcount === 1 ? 'is' : 'are'} left out.`
        : null}
    </Alert>
  );
}
