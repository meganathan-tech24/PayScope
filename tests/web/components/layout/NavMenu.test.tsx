import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NavMenu } from '@web/components/layout/NavMenu';

function setup() {
  render(
    <MemoryRouter>
      <NavMenu label="main menu">
        <a href="#one">One</a>
      </NavMenu>
    </MemoryRouter>,
  );
  return screen.getByRole('button', { name: /main menu/i });
}

describe('NavMenu', () => {
  it('starts closed, and its button controls the labelled navigation', () => {
    const button = setup();

    expect(button).toHaveAttribute('aria-expanded', 'false');
    const nav = screen.getByRole('navigation', { name: 'main menu', hidden: true });
    expect(button).toHaveAttribute('aria-controls', nav.id);
  });

  it('opens and closes with the button', async () => {
    const button = setup();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /close main menu/i })).toBe(button);

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape', async () => {
    const button = setup();
    await userEvent.click(button);

    await userEvent.keyboard('{Escape}');

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes after a link is chosen', async () => {
    const button = setup();
    await userEvent.click(button);

    await userEvent.click(screen.getByRole('link', { name: 'One' }));

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
