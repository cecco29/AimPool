import { describe, expect, test } from 'vitest';
import { add, angleXY, cross, dot, norm, rotZ, scale, sub, unit, xy, ZERO } from './vec';

describe('vec', () => {
  test('basic arithmetic', () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    expect(sub([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3]);
    expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6]);
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });
  test('cross follows the right-hand rule', () => {
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(cross([0, 0, 1], [1, 0, 0])).toEqual([0, 1, 0]);
  });
  test('unit of a zero vector is zero (guarded)', () => {
    expect(unit(ZERO)).toEqual(ZERO);
    expect(norm(unit([3, 4, 0]))).toBeCloseTo(1, 12);
  });
  test('rotZ rotates counter-clockwise and keeps z', () => {
    const r = rotZ([1, 0, 5], Math.PI / 2);
    expect(r[0]).toBeCloseTo(0, 12);
    expect(r[1]).toBeCloseTo(1, 12);
    expect(r[2]).toBe(5);
  });
  test('xy drops z and angleXY measures azimuth', () => {
    expect(xy([1, 2, 3])).toEqual([1, 2, 0]);
    expect(angleXY([0, 1, 0])).toBeCloseTo(Math.PI / 2, 12);
  });
});
