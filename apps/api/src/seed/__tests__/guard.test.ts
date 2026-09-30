import { describe, expect, it } from 'vitest';

import { assertSeedAllowed } from '../guard.js';

describe('assertSeedAllowed', () => {
  it.each(['development', 'test', undefined])('allows %s', (env) => {
    expect(() => assertSeedAllowed({ NODE_ENV: env })).not.toThrow();
  });

  it('refuses production without explicit confirmation', () => {
    expect(() => assertSeedAllowed({ NODE_ENV: 'production' })).toThrow(/ALLOW_PRODUCTION_SEED/);
    expect(() =>
      assertSeedAllowed({ NODE_ENV: 'production', ALLOW_PRODUCTION_SEED: 'yes' }),
    ).toThrow();
  });

  it('allows production only with ALLOW_PRODUCTION_SEED=true', () => {
    expect(() =>
      assertSeedAllowed({ NODE_ENV: 'production', ALLOW_PRODUCTION_SEED: 'true' }),
    ).not.toThrow();
  });
});
