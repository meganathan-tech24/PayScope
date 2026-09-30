import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/StateMessages';
import { useAuth } from '../features/auth/hooks/useAuth';
import { CurrencyControls } from '../features/insights/components/CurrencyControls';
import { HeadcountSection } from '../features/insights/components/HeadcountSection';
import { ApproximateNote } from '../features/insights/components/InsightNotes';
import { PayByGroupSection } from '../features/insights/components/PayByGroupSection';
import { SectionError, SectionSkeleton } from '../features/insights/components/SectionStates';
import { SummaryCards } from '../features/insights/components/SummaryCards';
import { useCountryStats, useHeadcount, useOutliers } from '../features/insights/hooks/useInsights';
import { useInsightsParams } from '../features/insights/hooks/useInsightsParams';
import { currencyOptions, resolveCurrency } from '../features/insights/lib/currencies';

export function DashboardPage() {
  const { user } = useAuth();
  const { params, update } = useInsightsParams();
  const isHr = user?.role === 'HR_MANAGER';

  // The native country rows tell us which currencies exist; the active view (native or USD)
  // feeds the cards.
  const nativeStats = useCountryStats(false);
  const activeStats = useCountryStats(params.usd);
  const headcount = useHeadcount('country');
  const options = currencyOptions(nativeStats.data?.rows ?? []);
  const currency = resolveCurrency(params.currency, options);
  const outliers = useOutliers(isHr, params.usd ? undefined : currency || undefined);

  if (!user) return null;

  const rows = (activeStats.data?.rows ?? []).filter(
    (row) => params.usd || row.currency === currency,
  );
  const employees = (headcount.data ?? []).reduce((sum, row) => sum + row.headcount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="display text-3xl font-semibold">Dashboard</h1>
        <p className="max-w-prose text-neutral-600">
          How the organisation pays, by country, job title and department.
        </p>
      </div>

      {!isHr ? (
        <Alert tone="info">
          You are viewing aggregated statistics. Individual salaries, minimum and maximum pay and
          outliers are available to HR Managers only.
        </Alert>
      ) : null}

      {nativeStats.isPending ? (
        <SectionSkeleton label="Loading pay insights" />
      ) : nativeStats.isError ? (
        <SectionError what="the pay insights" onRetry={() => void nativeStats.refetch()} />
      ) : options.length === 0 ? (
        <EmptyState title="No pay data yet">
          Statistics appear here once employees have been added.
        </EmptyState>
      ) : (
        <>
          <CurrencyControls
            options={options}
            currency={currency}
            usd={params.usd}
            onCurrency={(code) => update({ currency: code })}
            onUsd={(on) => update({ usd: on })}
          />
          {params.usd ? (
            <ApproximateNote excludedHeadcount={activeStats.data?.excludedHeadcount} />
          ) : null}

          {activeStats.isError ? (
            <SectionError what="the summary" onRetry={() => void activeStats.refetch()} />
          ) : activeStats.isPending || headcount.isPending ? (
            <SectionSkeleton label="Loading summary" />
          ) : (
            <SummaryCards
              employees={employees}
              countries={new Set(nativeStats.data.rows.map((row) => row.key)).size}
              rows={rows}
              outliers={isHr ? outliers.data?.total : undefined}
            />
          )}

          <PayByGroupSection
            payBy={params.payBy}
            onPayBy={(payBy) => update({ payBy })}
            usd={params.usd}
            currency={currency}
          />
          <HeadcountSection
            by={params.headcountBy}
            onBy={(headcountBy) => update({ headcountBy })}
          />
        </>
      )}
    </div>
  );
}
