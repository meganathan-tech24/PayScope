export { isIsoCountryCode, isIsoCurrencyCode } from './iso-codes.js';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function clampPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}
