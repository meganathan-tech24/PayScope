import { APPROXIMATE_USD_RATES } from '@payscope/shared';
import { describe, expect, it } from 'vitest';

import {
  employeeBodySchema,
  employeeIdParamsSchema,
  MAX_SALARY_MINOR_UNITS,
} from '@api/modules/employees/employees.schema.js';
import {
  generateEmployees,
  minorUnitExponent,
  OUTLIER_HIGH_FACTOR,
  OUTLIER_LOW_FACTOR,
  salaryBand,
  TENURE_UPLIFT_PER_YEAR,
  TENURE_YEARS_CAP,
} from '@api/seed/employee-generator.js';
import {
  COUNTRIES,
  DEFAULT_EMPLOYEE_COUNT,
  EARLIEST_HIRE_DATE,
  EMAIL_DOMAIN,
  EMPLOYMENT_TYPES,
  JOB_TITLES,
  REFERENCE_DATE,
} from '@api/seed/reference-data.js';

// One shared 10,000-row run: generation is deterministic, so tests can share it.
const employees = generateEmployees();

const country = (code: string) => {
  const found = COUNTRIES.find((c) => c.code === code);
  if (!found) throw new Error(`unknown country ${code}`);
  return found;
};
const job = (title: string) => {
  const found = JOB_TITLES.find((j) => j.title === title);
  if (!found) throw new Error(`unknown title ${title}`);
  return found;
};

describe('generateEmployees: shape and determinism', () => {
  it('generates exactly 10,000 employees by default, and honours an explicit count', () => {
    expect(employees).toHaveLength(DEFAULT_EMPLOYEE_COUNT);
    expect(DEFAULT_EMPLOYEE_COUNT).toBe(10_000);
    expect(generateEmployees({ count: 7 })).toHaveLength(7);
    expect(generateEmployees({ count: 0 })).toEqual([]);
  });

  it('is identical for the same seed, including ids and dates', () => {
    expect(generateEmployees({ count: 500, seed: 1 })).toEqual(
      generateEmployees({ count: 500, seed: 1 }),
    );
  });

  it('differs for a different seed', () => {
    const a = generateEmployees({ count: 200, seed: 1 });
    const b = generateEmployees({ count: 200, seed: 2 });

    expect(a.map((e) => e.id)).not.toEqual(b.map((e) => e.id));
    expect(a.map((e) => e.salary)).not.toEqual(b.map((e) => e.salary));
  });

  it('is a prefix-stable stream: the first rows do not depend on the total count', () => {
    expect(generateEmployees({ count: 50, seed: 3 })).toEqual(
      generateEmployees({ count: 200, seed: 3 }).slice(0, 50),
    );
  });

  it('gives every employee a unique id and a unique lowercase ASCII email', () => {
    expect(new Set(employees.map((e) => e.id)).size).toBe(employees.length);
    expect(new Set(employees.map((e) => e.email)).size).toBe(employees.length);
    for (const e of employees) {
      expect(e.email).toMatch(
        new RegExp(`^[a-z]+\\.[a-z]+(\\.\\d+)?@${EMAIL_DOMAIN.replace('.', '\\.')}$`),
      );
    }
  });

  it('produces rows the employees API itself would accept', () => {
    for (const { id, ...body } of employees) {
      expect(employeeIdParamsSchema.safeParse({ id }).success).toBe(true);
      expect(employeeBodySchema.safeParse(body).success).toBe(true);
    }
  });
});

describe('generateEmployees: realism', () => {
  it('pairs each country with its currency and covers every country and 15+ titles', () => {
    for (const e of employees) {
      expect(e.currency).toBe(country(e.country).currency);
    }
    expect(new Set(employees.map((e) => e.country)).size).toBe(COUNTRIES.length);
    expect(new Set(employees.map((e) => e.jobTitle)).size).toBeGreaterThanOrEqual(15);
  });

  it('keeps each title in its own department', () => {
    for (const e of employees) {
      expect(e.department).toBe(job(e.jobTitle).department);
    }
  });

  it('uses all four employment types but only makes eligible titles interns', () => {
    const types = new Set(employees.map((e) => e.employmentType));
    expect([...types].sort()).toEqual(EMPLOYMENT_TYPES.map((t) => t.value).sort());
    for (const e of employees.filter((row) => row.employmentType === 'INTERN')) {
      expect(job(e.jobTitle).internEligible).toBe(true);
    }
  });

  it('keeps hire dates between the earliest date and the reference date (never in the future)', () => {
    for (const e of employees) {
      expect(e.hireDate.getTime()).toBeGreaterThanOrEqual(EARLIEST_HIRE_DATE.getTime());
      expect(e.hireDate.getTime()).toBeLessThanOrEqual(REFERENCE_DATE.getTime());
      expect(e.hireDate.getTime()).toBeLessThan(Date.now());
    }
  });
});

describe('salary bands', () => {
  it('reports the minor-unit exponent per currency (JPY 0, USD 2)', () => {
    expect(minorUnitExponent('JPY')).toBe(0);
    expect(minorUnitExponent('USD')).toBe(2);
    expect(minorUnitExponent('INR')).toBe(2);
  });

  it('converts a USD band into local minor units', () => {
    const engineer = job('Software Engineer');

    expect(salaryBand(engineer, country('US'))).toEqual({ min: 7_000_000, max: 14_000_000 });
    // 70,000 USD x 0.7 x 150 = 7,350,000 yen; the yen has no minor unit.
    expect(salaryBand(engineer, country('JP'))).toEqual({ min: 7_350_000, max: 14_700_000 });
    // 70,000 USD x 0.28 x 84 = 1,646,400 rupees = 164,640,000 paise (rounded to 3 s.f. first).
    expect(salaryBand(engineer, country('IN'))).toEqual({ min: 165_000_000, max: 329_000_000 });
  });

  it('gives a wider, higher band to a more senior title in the same country', () => {
    const junior = salaryBand(job('Software Engineer'), country('DE'));
    const manager = salaryBand(job('Engineering Manager'), country('DE'));

    expect(manager.min).toBeGreaterThan(junior.min);
    expect(manager.max).toBeGreaterThan(junior.max);
  });

  it('keeps every band well below the integer salary cap even at the worst-case multipliers', () => {
    const worstCase = 1 + TENURE_YEARS_CAP * TENURE_UPLIFT_PER_YEAR;
    const contractPremium = Math.max(...EMPLOYMENT_TYPES.map((t) => t.payFactor));

    for (const c of COUNTRIES) {
      for (const j of JOB_TITLES) {
        const { max } = salaryBand(j, c);
        expect(max * worstCase * contractPremium * OUTLIER_HIGH_FACTOR).toBeLessThan(
          MAX_SALARY_MINOR_UNITS,
        );
      }
    }
  });
});

describe('generated salaries', () => {
  const byId = (row: (typeof employees)[number]) => ({
    band: salaryBand(job(row.jobTitle), country(row.country)),
    row,
  });

  it('are positive integers in minor units under the API cap', () => {
    for (const e of employees) {
      expect(Number.isInteger(e.salary)).toBe(true);
      expect(e.salary).toBeGreaterThan(0);
      expect(e.salary).toBeLessThanOrEqual(MAX_SALARY_MINOR_UNITS);
    }
  });

  it('stay inside the widest possible envelope for their band', () => {
    const lowest = Math.min(...EMPLOYMENT_TYPES.map((t) => t.payFactor)) * OUTLIER_LOW_FACTOR;
    const highest =
      Math.max(...EMPLOYMENT_TYPES.map((t) => t.payFactor)) *
      OUTLIER_HIGH_FACTOR *
      (1 + TENURE_YEARS_CAP * TENURE_UPLIFT_PER_YEAR);

    for (const { band, row } of employees.map(byId)) {
      expect(row.salary).toBeGreaterThanOrEqual(Math.floor(band.min * lowest * 0.99));
      expect(row.salary).toBeLessThanOrEqual(Math.ceil(band.max * highest * 1.01));
    }
  });

  it('put almost all full-time staff in their tenure-adjusted band, with a few real outliers', () => {
    const fullTime = employees.filter((e) => e.employmentType === 'FULL_TIME').map(byId);
    const outside = fullTime.filter(
      ({ band, row }) =>
        row.salary < band.min * 0.99 ||
        row.salary > band.max * (1 + TENURE_YEARS_CAP * TENURE_UPLIFT_PER_YEAR) * 1.01,
    );
    const share = outside.length / fullTime.length;

    expect(share).toBeGreaterThan(0.002);
    expect(share).toBeLessThan(0.03);
  });

  it('pay more in the US than in India for the same title, compared in USD', () => {
    const meanUsd = (code: string) => {
      const c = country(code);
      const rows = employees.filter(
        (e) =>
          e.country === code &&
          e.jobTitle === 'Software Engineer' &&
          e.employmentType === 'FULL_TIME',
      );
      const usd = rows.map(
        (e) => e.salary / 10 ** minorUnitExponent(c.currency) / APPROXIMATE_USD_RATES[c.currency],
      );
      return usd.reduce((sum, value) => sum + value, 0) / usd.length;
    };

    expect(meanUsd('US')).toBeGreaterThan(meanUsd('IN') * 2);
  });

  it('rise with tenure for the same title, country and employment type', () => {
    const rows = employees.filter(
      (e) =>
        e.country === 'US' &&
        e.jobTitle === 'Software Engineer' &&
        e.employmentType === 'FULL_TIME',
    );
    const mean = (subset: typeof rows) =>
      subset.reduce((sum, e) => sum + e.salary, 0) / subset.length;
    const newer = rows.filter((e) => e.hireDate >= new Date('2025-01-01'));
    const older = rows.filter((e) => e.hireDate <= new Date('2016-01-01'));

    expect(newer.length).toBeGreaterThan(20);
    expect(older.length).toBeGreaterThan(20);
    expect(mean(older)).toBeGreaterThan(mean(newer));
  });
});
