import { describe, expect, test } from 'vitest';
import { quadraticRoots, realRootsInRange } from './roots';

describe('realRootsInRange', () => {
  test('quartic with four roots', () => {
    const r = realRootsInRange([1, -10, 35, -50, 24], 0, 10);
    expect(r).toHaveLength(4);
    [1, 2, 3, 4].forEach((x, i) => expect(r[i]).toBeCloseTo(x, 9));
  });
  test('filters by range (lo exclusive, hi inclusive)', () => {
    const r = realRootsInRange([1, -10, 35, -50, 24], 1.5, 3.5);
    expect(r.map((x) => Math.round(x * 1e9) / 1e9)).toEqual([2, 3]);
  });
  test('no real roots', () => {
    expect(realRootsInRange([1, 0, 0, 0, 1], -10, 10)).toEqual([]);
  });
  test('leading zeros reduce the degree', () => {
    const r = realRootsInRange([0, 0, 1, -3, 2], 0, Infinity);
    expect(r[0]).toBeCloseTo(1, 12);
    expect(r[1]).toBeCloseTo(2, 12);
  });
  test('cubic', () => {
    const r = realRootsInRange([1, -6, 11, -6], 0, Infinity);
    expect(r.map((x) => +x.toFixed(9))).toEqual([1, 2, 3]);
  });
  test('infinite hi uses the Cauchy bound', () => {
    expect(realRootsInRange([1, 0, -1e6], 0, Infinity)[0]).toBeCloseTo(1000, 9);
  });
});

describe('quadraticRoots', () => {
  test('stable for widely separated roots', () => {
    const r = quadraticRoots(1, -1e8, 1);
    expect(r[0]).toBeCloseTo(1e-8, 15);
    expect(r[1]).toBeCloseTo(1e8, 0);
  });
});
