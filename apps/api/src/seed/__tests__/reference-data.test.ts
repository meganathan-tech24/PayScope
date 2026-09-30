import { APPROXIMATE_USD_RATES, isIsoCountryCode, isIsoCurrencyCode } from '@payscope/shared';
import { describe, expect, it } from 'vitest';

import {
  COUNTRIES,
  EMPLOYMENT_TYPES,
  JOB_TITLES,
  NAME_POOLS,
  REFERENCE_DATE,
} from '../reference-data.js';

describe('seed reference data', () => {
  it('uses 8-10 real countries with real currencies that have a rate', () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(8);
    expect(COUNTRIES.length).toBeLessThanOrEqual(10);
    for (const country of COUNTRIES) {
      expect(isIsoCountryCode(country.code)).toBe(true);
      expect(isIsoCurrencyCode(country.currency)).toBe(true);
      expect(APPROXIMATE_USD_RATES[country.currency]).toBeGreaterThan(0);
      expect(country.costFactor).toBeGreaterThan(0);
      expect(country.weight).toBeGreaterThan(0);
    }
  });

  it('has 15-20 unique job titles with sane bands', () => {
    expect(JOB_TITLES.length).toBeGreaterThanOrEqual(15);
    expect(JOB_TITLES.length).toBeLessThanOrEqual(20);
    expect(new Set(JOB_TITLES.map((job) => job.title)).size).toBe(JOB_TITLES.length);
    for (const job of JOB_TITLES) {
      expect(job.minUsd).toBeGreaterThan(0);
      expect(job.maxUsd).toBeGreaterThan(job.minUsd);
      expect(job.weight).toBeGreaterThan(0);
    }
  });

  it('has a name pool for every region a country refers to', () => {
    for (const country of COUNTRIES) {
      const pool = NAME_POOLS[country.region];
      expect(pool.first.length).toBeGreaterThanOrEqual(15);
      expect(pool.last.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('weights employment types and keeps the reference date in the past', () => {
    expect(EMPLOYMENT_TYPES.map((type) => type.value).sort()).toEqual([
      'CONTRACT',
      'FULL_TIME',
      'INTERN',
      'PART_TIME',
    ]);
    expect(REFERENCE_DATE.getTime()).toBeLessThan(Date.now());
  });
});
