import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseConfig } from '../config.js';

const validEnv = {
  DATABASE_URL: 'postgresql://payscope:payscope@localhost:5432/payscope',
  JWT_SECRET: 'a'.repeat(32),
  CORS_ORIGIN: 'http://localhost:5173',
};

describe('parseConfig', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${String(code)})`);
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a valid environment and applies defaults', () => {
    const config = parseConfig(validEnv);

    expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(config.JWT_EXPIRES_IN).toBe('1h');
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(4000);
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.LOG_DB_MIN_LEVEL).toBe('warn');
  });

  it('coerces PORT to a number', () => {
    const config = parseConfig({ ...validEnv, PORT: '4100' });

    expect(config.PORT).toBe(4100);
  });

  it('fails fast when JWT_SECRET is missing', () => {
    const { JWT_SECRET: _omit, ...envWithoutSecret } = validEnv;

    expect(() => parseConfig(envWithoutSecret)).toThrow('process.exit(1)');
    // eslint-disable-next-line no-console -- asserting on the spy, not logging
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET'));
  });

  it('fails fast when JWT_SECRET is too short', () => {
    expect(() => parseConfig({ ...validEnv, JWT_SECRET: 'too-short' })).toThrow('process.exit(1)');
  });

  it('fails fast when DATABASE_URL is not a valid url', () => {
    expect(() => parseConfig({ ...validEnv, DATABASE_URL: 'not-a-url' })).toThrow(
      'process.exit(1)',
    );
  });

  it('fails fast when NODE_ENV is not a recognized value', () => {
    expect(() => parseConfig({ ...validEnv, NODE_ENV: 'staging' })).toThrow('process.exit(1)');
  });
});
