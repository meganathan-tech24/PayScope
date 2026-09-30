export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly { value: T; weight: number }[]): T;
  chance(probability: number): boolean;
  /** UUID-shaped (version 4 layout) string drawn from the stream. */
  uuid(): string;
}

// mulberry32: tiny, fast, and good enough for seed data. Not for anything security related.
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));

  const pick = <T>(items: readonly T[]): T => {
    const item = items[int(0, items.length - 1)];
    if (item === undefined) throw new Error('pick() called with an empty list');
    return item;
  };

  const weighted = <T>(items: readonly { value: T; weight: number }[]): T => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = next() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item.value;
    }
    const last = items[items.length - 1];
    if (!last) throw new Error('weighted() called with an empty list');
    return last.value;
  };

  const uuid = (): string => {
    const bytes = Array.from({ length: 16 }, () => int(0, 255));
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
    const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  return { next, int, pick, weighted, chance: (p) => next() < p, uuid };
}
