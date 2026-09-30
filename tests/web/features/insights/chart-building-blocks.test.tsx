import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChartCard } from '@web/features/insights/components/charts/ChartCard';
import { DataTableDisclosure } from '@web/features/insights/components/charts/DataTableDisclosure';
import {
  SectionEmpty,
  SectionError,
  SectionSkeleton,
} from '@web/features/insights/components/SectionStates';
import { formatMoneyCompact } from '@web/lib/money';

describe('ChartCard', () => {
  it('names the section, gives the chart a text alternative, and keeps the table outside the image', () => {
    render(
      <ChartCard
        title="Pay by country"
        description="Middle half of pay"
        summary="Highest median: Germany, €62,000.00"
        chart={<svg data-testid="drawing" />}
        table={
          <DataTableDisclosure>
            <table>
              <caption>Pay by country</caption>
              <tbody>
                <tr>
                  <td>Germany</td>
                </tr>
              </tbody>
            </table>
          </DataTableDisclosure>
        }
      />,
    );

    const section = screen.getByRole('region', { name: 'Pay by country' });
    const image = within(section).getByRole('img', {
      name: 'Highest median: Germany, €62,000.00',
    });
    expect(within(image).getByTestId('drawing')).toBeInTheDocument();
    expect(
      within(section).getByText('Highest median: Germany, €62,000.00', { selector: 'figcaption' }),
    ).toBeInTheDocument();
    expect(image).not.toContainElement(within(section).getByRole('table', { hidden: true }));
  });

  it('shows a state instead of the chart and table', () => {
    render(
      <ChartCard title="Bands" chart={<svg data-testid="drawing" />} state={<p>Nothing here</p>} />,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByTestId('drawing')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('DataTableDisclosure', () => {
  it('is closed until opened, and toggles from its summary', async () => {
    render(
      <DataTableDisclosure>
        <p>the table</p>
      </DataTableDisclosure>,
    );
    const details = screen
      .getByText('View data as a table')
      .closest('details') as HTMLDetailsElement;

    // A native <details>: the browser gives it Enter/Space support; jsdom only models the click.
    expect(details.open).toBe(false);
    await userEvent.click(screen.getByText('View data as a table'));
    expect(details.open).toBe(true);
    await userEvent.click(screen.getByText('View data as a table'));
    expect(details.open).toBe(false);
  });
});

describe('section states', () => {
  it('announces loading, explains an empty section, and retries after an error', async () => {
    const retry = vi.fn();
    render(
      <>
        <SectionSkeleton label="Loading pay by country" />
        <SectionEmpty>No data for this currency.</SectionEmpty>
        <SectionError what="pay by country" onRetry={retry} />
      </>,
    );

    expect(screen.getByRole('status', { name: 'Loading pay by country' })).toBeInTheDocument();
    expect(screen.getByText('No data for this currency.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('We could not load pay by country.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe('formatMoneyCompact', () => {
  it('shortens amounts in their own currency for chart axes', () => {
    expect(formatMoneyCompact(8_500_000, 'USD')).toBe('$85K');
    expect(formatMoneyCompact(15_000_000, 'JPY')).toBe('¥15M');
    expect(formatMoneyCompact(9_200_000, 'EUR')).toBe('€92K');
  });

  it('falls back for an unusable currency code', () => {
    expect(formatMoneyCompact(12_345, 'X')).toBe('X 123');
  });
});
