import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from '@web/components/ui/Alert';

describe('Alert', () => {
  it.each([
    ['error', 'alert', 'alert-error'],
    ['info', 'status', 'alert-info'],
    ['success', 'status', 'alert-success'],
  ] as const)('renders the %s tone as a %s with its own class and an icon', (tone, role, cls) => {
    render(<Alert tone={tone}>Something happened</Alert>);

    const alert = screen.getByRole(role);
    expect(alert).toHaveClass(cls);
    expect(alert).toHaveTextContent('Something happened');
    expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
