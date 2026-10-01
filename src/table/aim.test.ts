import { describe, expect, test } from 'vitest';
import { azimuthTo, cutAngleDeg, ghostBallPosition } from './aim';
import type { Vec3 } from '../physics/vec';

const R = 0.028575;

describe('aim helpers', () => {
  test('ghost ball sits 2R behind the object ball, opposite the target', () => {
    const gb = ghostBallPosition([1, 0, R], [2, 0, 0], R);
    expect(gb[0]).toBeCloseTo(1 - 2 * R, 12);
    expect(gb[1]).toBeCloseTo(0, 12);
    expect(gb[2]).toBe(R);
  });
  test('straight-in shot has a 0° cut', () => {
    expect(cutAngleDeg([0, 0, R], [1, 0, R], [2, 0, 0], R)).toBeCloseTo(0, 9);
  });
  test('30° cut', () => {
    const ob: Vec3 = [0, 0, R];
    const gb = ghostBallPosition(ob, [5, 0, 0], R);
    const a = Math.PI / 6;
    const cb: Vec3 = [gb[0] - Math.cos(a), gb[1] - Math.sin(a), R];
    expect(cutAngleDeg(cb, ob, [5, 0, 0], R)).toBeCloseTo(30, 9);
  });
  test('azimuthTo', () => {
    expect(azimuthTo([0, 0, 0], [0, 1, 0])).toBeCloseTo(Math.PI / 2, 12);
  });
});
