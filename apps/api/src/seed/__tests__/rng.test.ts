import { describe, expect, it } from 'vitest';

import { createRng } from '../rng.js';

const sequence = (seed: number, length = 20) => {
  const rng = createRng(seed);
  return Array.from({ length }, () => rng.next());
};

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    expect(sequence(42)).toEqual(sequence(42));
  });

  it('produces a different sequence for a different seed', () => {
    expect(sequence(42)).not.toEqual(sequence(43));
  });

  it('keeps next() within [0, 1)', () => {
    for (const value of sequence(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int() is inclusive of both bounds and stays inside them', () => {
    const rng = createRng(1);
    const seen = new Set(Array.from({ length: 500 }, () => rng.int(3, 6)));

    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('pick() only returns members of the list and throws on an empty list', () => {
    const rng = createRng(5);
    const items = ['a', 'b', 'c'] as const;

    for (let i = 0; i < 50; i += 1) expect(items).toContain(rng.pick(items));
    expect(() => rng.pick([])).toThrow();
  });

  it('weighted() follows the weights and never picks a zero-weight item', () => {
    const rng = createRng(9);
    const counts = { common: 0, rare: 0, never: 0 };
    for (let i = 0; i < 5000; i += 1) {
      counts[
        rng.weighted([
          { value: 'common' as const, weight: 90 },
          { value: 'rare' as const, weight: 10 },
          { value: 'never' as const, weight: 0 },
        ])
      ] += 1;
    }

    expect(counts.never).toBe(0);
    expect(counts.common).toBeGreaterThan(counts.rare * 5);
  });

  it('uuid() is version-4 shaped, stable per seed, and accepted as a UUID', () => {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const a = createRng(11);
    const b = createRng(11);

    const ids = Array.from({ length: 100 }, () => a.uuid());
    expect(ids.every((id) => pattern.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(100);
    expect(ids).toEqual(Array.from({ length: 100 }, () => b.uuid()));
  });
});
