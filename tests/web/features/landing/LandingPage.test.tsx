import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { apiSuccess, stubFetch } from '@tests/helpers/fetch-mock.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

async function openLanding() {
  stubFetch(() => apiSuccess({}));
  renderAt(<AppRoutes />, '/');
  await screen.findByRole('heading', { level: 1 });
}

describe('landing page', () => {
  it('has one h1 that says what the product is for', async () => {
    await openLanding();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/know how you pay/i);
  });

  it('has header, main and footer landmarks, and sections named by their headings', async () => {
    await openLanding();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    for (const name of [
      /one place for pay data/i,
      /built for the questions/i,
      /three steps/i,
      /one clear line around individual pay/i,
      /see your pay data clearly/i,
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('offers Create an account and Sign in in the hero and again at the end', async () => {
    await openLanding();

    for (const region of [
      screen.getByRole('region', { name: /know how you pay/i }),
      screen.getByRole('region', { name: /see your pay data clearly/i }),
    ]) {
      expect(within(region).getByRole('link', { name: 'Create an account' })).toHaveAttribute(
        'href',
        '/register',
      );
      expect(within(region).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
        'href',
        '/login',
      );
    }
  });

  it('lists six features and three ordered steps', async () => {
    await openLanding();

    const features = screen.getByRole('region', { name: /built for the questions/i });
    expect(within(features).getAllByRole('heading', { level: 3 })).toHaveLength(6);
    const steps = within(screen.getByRole('region', { name: /three steps/i })).getByRole('list');
    expect(steps.tagName).toBe('OL');
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
  });

  it('states the difference between the two account types', async () => {
    await openLanding();

    const roles = screen.getByRole('region', { name: /one clear line around individual pay/i });
    expect(within(roles).getByRole('heading', { name: 'HR Manager' })).toBeInTheDocument();
    expect(within(roles).getByRole('heading', { name: 'Viewer' })).toBeInTheDocument();
    expect(within(roles).getByText(/no individual salaries/i)).toBeInTheDocument();
  });

  it('describes the hero illustration as an illustration, not as data', async () => {
    await openLanding();

    const figure = screen.getByRole('img', { name: /illustration/i });
    expect(figure).toHaveTextContent(/illustrative sample/i);
  });

  it('links the header to its sections on the landing page only', async () => {
    await openLanding();

    const nav = screen.getByRole('navigation', { name: 'main menu', hidden: true });
    expect(within(nav).getByRole('link', { name: 'Features' })).toHaveAttribute(
      'href',
      '#features',
    );
    expect(within(nav).getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '#how-it-works',
    );
  });

  it('does not show section links on other public pages', async () => {
    stubFetch(() => apiSuccess({}));
    renderAt(<AppRoutes />, '/login');
    await screen.findByRole('heading', { name: 'Sign in' });

    expect(screen.queryByRole('link', { name: 'Features' })).not.toBeInTheDocument();
  });

  it('points a signed-in visitor to the app instead of asking them to sign up', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    stubFetch(() =>
      apiSuccess({ id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'VIEWER' }),
    );

    renderAt(<AppRoutes />, '/');

    const hero = await screen.findByRole('region', { name: /know how you pay/i });
    expect(await within(hero).findByRole('link', { name: 'Open the app' })).toHaveAttribute(
      'href',
      '/app',
    );
    expect(within(hero).queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument();
  });
});
