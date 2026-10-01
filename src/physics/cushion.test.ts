import { describe, expect, test } from 'vitest';
import type { Ball } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { resolveCushion, resolveTable } from './cushion';
import { energy, slip } from './motion';
import { cross, norm, scale, type Vec3, Z } from './vec';

const deg = (r: number) => (r * 180) / Math.PI;
const N: Vec3 = [0, 1, 0]; // banda inferior (y = 0); la normal apunta hacia la mesa

function incoming(angleDeg: number, rolling: boolean): Ball {
  const a = (angleDeg * Math.PI) / 180;
  const v: Vec3 = [Math.sin(a), -Math.cos(a), 0];
  const w = rolling ? scale(cross(Z, v), 1 / p.R) : ([0, 0, 0] as Vec3);
  return { id: 'b', r: [1, p.R, p.R], v, w, motion: rolling ? 'rolling' : 'sliding' };
}
const outAngle = (b: Ball) => deg(Math.atan2(Math.abs(b.v[0]), b.v[1]));

describe('resolveCushion (Han 2005, §9 row 11 regression)', () => {
  test.each([
    [15, 12.3], [30, 26.6], [45, 43.7], [60, 61.8],
  ])('rolling in at %s° leaves at %s° immediately', (inA, out) => {
    expect(outAngle(resolveCushion(incoming(inA, true), N, p))).toBeCloseTo(out, 0);
  });
  test.each([
    [15, 14.6], [30, 29.3], [45, 44.1], [60, 62.1],
  ])('stun in at %s° leaves at %s° immediately', (inA, out) => {
    const r = resolveCushion(incoming(inA, false), N, p);
    expect(Math.abs(outAngle(r) - out)).toBeLessThan(0.3);
  });
  test('normal speed ratio for a straight-in stun ball is about 0.74', () => {
    const r = resolveCushion(incoming(0, false), N, p);
    expect(r.v[1]).toBeGreaterThan(0.7);
    expect(r.v[1]).toBeLessThan(0.85);
  });
  test('energy never increases', () => {
    const b = { ...incoming(40, true), w: [20, -10, 30] as Vec3 };
    expect(energy(resolveCushion(b, N, p), p)).toBeLessThanOrEqual(energy(b, p) + 1e-12);
  });
});

describe('resolveTable', () => {
  test('bounces with eTable and keeps the ball on the slate height', () => {
    const b: Ball = { id: 'b', r: [0, 0, p.R], v: [1, 0, -2], w: [0, 0, 0], motion: 'airborne' };
    const r = resolveTable(b, p);
    expect(r.v[2]).toBeCloseTo(1, 9);
    expect(r.r[2]).toBe(p.R);
    expect(norm(slip(r, p.R))).toBeLessThan(norm(slip(b, p.R)));
  });
  test('tiny bounces are cut to zero', () => {
    const b: Ball = { id: 'b', r: [0, 0, p.R], v: [1, 0, -0.1], w: [0, 0, 0], motion: 'airborne' };
    expect(resolveTable(b, p).v[2]).toBe(0);
  });
});
