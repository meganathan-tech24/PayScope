export function assertSeedAllowed(env: {
  NODE_ENV?: string | undefined;
  ALLOW_PRODUCTION_SEED?: string | undefined;
}): void {
  if (env.NODE_ENV === 'production' && env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error(
      'Refusing to seed in production: this deletes every employee. Set ALLOW_PRODUCTION_SEED=true to confirm.',
    );
  }
}
