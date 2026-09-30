import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@web/App';

describe('App', () => {
  it('renders the public layout with the PayScope brand in the header', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('PayScope');
  });

  it('renders a main landmark and a skip link to it', () => {
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });
});
