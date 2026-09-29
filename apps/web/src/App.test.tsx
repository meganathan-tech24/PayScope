import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the app shell with the PayScope title', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'PayScope' })).toBeInTheDocument();
  });

  it('renders the home placeholder content', () => {
    render(<App />);

    expect(
      screen.getByText('Employee management and pay insights land in later phases.'),
    ).toBeInTheDocument();
  });
});
