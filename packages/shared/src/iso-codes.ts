import countries from 'i18n-iso-countries';

const ALPHA_2 = /^[A-Z]{2}$/;
const ALPHA_3 = /^[A-Z]{3}$/;

// Node/ICU ships the ISO 4217 list, so there is no hand-maintained copy to drift.
const CURRENCY_CODES = new Set(Intl.supportedValuesOf('currency'));

export function isIsoCountryCode(code: string): boolean {
  return ALPHA_2.test(code) && countries.isValid(code);
}

export function isIsoCurrencyCode(code: string): boolean {
  return ALPHA_3.test(code) && CURRENCY_CODES.has(code);
}

// Every ISO 3166-1 alpha-2 code, sorted, for country pickers.
export function listCountryCodes(): string[] {
  return Object.keys(countries.getAlpha2Codes()).sort();
}
