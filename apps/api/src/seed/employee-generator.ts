import { APPROXIMATE_USD_RATES } from '@payscope/shared';

import {
  COUNTRIES,
  DEFAULT_EMPLOYEE_COUNT,
  DEFAULT_SEED,
  EARLIEST_HIRE_DATE,
  EMAIL_DOMAIN,
  EMPLOYMENT_TYPES,
  JOB_TITLES,
  NAME_POOLS,
  REFERENCE_DATE,
  type EmploymentTypeValue,
  type SeedCountry,
  type SeedJobTitle,
} from './reference-data.js';
import { createRng } from './rng.js';

export interface GeneratedEmployee {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  /** Integer minor units of `currency`. */
  salary: number;
  employmentType: EmploymentTypeValue;
  hireDate: Date;
}

export interface SalaryBand {
  /** Minor units of the country's currency. */
  min: number;
  max: number;
}

/** Extra pay per full year of tenure, capped, so pay-vs-tenure has a visible trend. */
export const TENURE_UPLIFT_PER_YEAR = 0.015;
export const TENURE_YEARS_CAP = 15;
export const OUTLIER_HIGH_FACTOR = 1.8;
export const OUTLIER_LOW_FACTOR = 0.55;
/** Share of employees that are deliberately paid far outside their band (each direction). */
export const OUTLIER_RATE = 0.005;

const MS_PER_DAY = 86_400_000;

// ISO 4217 minor-unit exponent (JPY 0, most currencies 2) straight from ICU.
const exponentCache = new Map<string, number>();

export function minorUnitExponent(currency: string): number {
  let exponent = exponentCache.get(currency);
  if (exponent === undefined) {
    exponent =
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    exponentCache.set(currency, exponent);
  }
  return exponent;
}

// Keep three significant figures so amounts look like real salaries (84,300 not 84,317).
function roundToThreeSignificant(value: number): number {
  if (value < 1000) return Math.round(value);
  const step = 10 ** (Math.floor(Math.log10(value)) - 2);
  return Math.round(value / step) * step;
}

function usdToMinorUnits(usd: number, country: SeedCountry): number {
  const localMajor = usd * country.costFactor * APPROXIMATE_USD_RATES[country.currency];
  return Math.round(
    roundToThreeSignificant(localMajor) * 10 ** minorUnitExponent(country.currency),
  );
}

/** Base pay band for a title in a country, before tenure, employment type and outliers. */
export function salaryBand(job: SeedJobTitle, country: SeedCountry): SalaryBand {
  return { min: usdToMinorUnits(job.minUsd, country), max: usdToMinorUnits(job.maxUsd, country) };
}

const FULL_TIME =
  EMPLOYMENT_TYPES.find((type) => type.value === 'FULL_TIME') ??
  (() => {
    throw new Error('EMPLOYMENT_TYPES must include FULL_TIME');
  })();

const stripAccents = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '');
const emailSlug = (text: string): string =>
  stripAccents(text)
    .toLowerCase()
    .replace(/[^a-z]/g, '');

export function generateEmployees(
  options: { count?: number; seed?: number } = {},
): GeneratedEmployee[] {
  const count = options.count ?? DEFAULT_EMPLOYEE_COUNT;
  const rng = createRng(options.seed ?? DEFAULT_SEED);

  const countryChoices = COUNTRIES.map((value) => ({ value, weight: value.weight }));
  const jobChoices = JOB_TITLES.map((value) => ({ value, weight: value.weight }));
  const typeChoices = EMPLOYMENT_TYPES.map((value) => ({ value, weight: value.weight }));
  const totalDays = Math.round(
    (REFERENCE_DATE.getTime() - EARLIEST_HIRE_DATE.getTime()) / MS_PER_DAY,
  );
  const emailCounts = new Map<string, number>();
  const employees: GeneratedEmployee[] = [];

  for (let index = 0; index < count; index += 1) {
    // Every iteration draws the same number of values in the same order, so
    // one row's branch never shifts the stream for the rows after it.
    const id = rng.uuid();
    const country = rng.weighted(countryChoices);
    const job = rng.weighted(jobChoices);
    const drawnType = rng.weighted(typeChoices);
    const pool = NAME_POOLS[country.region];
    const firstName = rng.pick(pool.first);
    const lastName = rng.pick(pool.last);
    const daysAgo = Math.floor(totalDays * rng.next() ** 1.5); // skewed towards recent hires
    const position = (rng.next() + rng.next()) / 2; // centre-weighted within the band
    const outlierRoll = rng.next();

    const employmentType =
      drawnType.value === 'INTERN' && !job.internEligible ? FULL_TIME : drawnType;
    const band = salaryBand(job, country);
    const tenureYears = Math.min(daysAgo / 365.25, TENURE_YEARS_CAP);
    const outlierFactor =
      outlierRoll < OUTLIER_RATE
        ? OUTLIER_HIGH_FACTOR
        : outlierRoll < OUTLIER_RATE * 2
          ? OUTLIER_LOW_FACTOR
          : 1;

    const base = band.min + position * (band.max - band.min);
    const raw =
      base * (1 + tenureYears * TENURE_UPLIFT_PER_YEAR) * employmentType.payFactor * outlierFactor;
    const scale = 10 ** minorUnitExponent(country.currency);
    const salary = Math.round(roundToThreeSignificant(raw / scale) * scale);

    const slug = `${emailSlug(firstName)}.${emailSlug(lastName)}`;
    const seen = emailCounts.get(slug) ?? 0;
    emailCounts.set(slug, seen + 1);

    employees.push({
      id,
      fullName: `${firstName} ${lastName}`,
      email: `${seen === 0 ? slug : `${slug}.${seen + 1}`}@${EMAIL_DOMAIN}`,
      jobTitle: job.title,
      department: job.department,
      country: country.code,
      currency: country.currency,
      salary,
      employmentType: employmentType.value,
      hireDate: new Date(REFERENCE_DATE.getTime() - daysAgo * MS_PER_DAY),
    });
  }

  return employees;
}
