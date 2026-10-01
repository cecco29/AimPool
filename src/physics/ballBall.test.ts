import { describe, expect, test } from 'vitest';
import type { Ball } from './types';
import { DEFAULT_PARAMS } from './params';
import { resolveBallBall } from './ballBall';
import { energy } from './motion';
import { add, dot, norm, sub, unit, type Vec3 } from './vec';

const p = DEFAULT_PARAMS;
const deg = (r: number) => (r * 180) / Math.PI;
const mk = (id: string, r: Vec3, v: Vec3 = [0, 0, 0], w: Vec3 = [0, 0, 0]): Ball => ({ id, r, v, w, motion: 'sliding' });

/** CB en el origen moviéndose +x; OB en contacto con la línea de centros a φ de +x (corte hacia +y). */
function cutSetup(phiDeg: number, v: number, w: Vec3 = [0, 0, 0]) {
  const phi = (phiDeg * Math.PI) / 180;
  const cb = mk('cue', [0, 0, p.R], [v, 0, 0], w);
  const ob = mk('1', [2 * p.R * Math.cos(phi), 2 * p.R * Math.sin(phi), p.R]);
  return { cb, ob, n: unit(sub(ob.r, cb.r)) };
}

describe('resolveBallBall', () => {
  test('head-on, elastic and frictionless: cue stops, object takes all the speed', () => {
    const q = { ...p, eBall: 1, muBall: 0 };
    const [c, o] = resolveBallBall(mk('cue', [0, 0, p.R], [1, 0, 0]), mk('1', [2 * p.R, 0, p.R]), q);
    expect(c.v[0]).toBeCloseTo(0, 12);
    expect(o.v[0]).toBeCloseTo(1, 12);
  });
  test('linear momentum is conserved and energy never increases', () => {
    const { cb, ob } = cutSetup(37, 2.3, [15, -40, 22]);
    const [c, o] = resolveBallBall(cb, { ...ob, v: [-0.4, 0.2, 0], w: [3, 1, -8] }, p);
    const before = add(cb.v, [-0.4, 0.2, 0]);
    const after = add(c.v, o.v);
    for (let i = 0; i < 3; i++) expect(after[i]).toBeCloseTo(before[i], 12);
    const e0 = energy(cb, p) + energy({ ...ob, v: [-0.4, 0.2, 0], w: [3, 1, -8] }, p);
    expect(energy(c, p) + energy(o, p)).toBeLessThanOrEqual(e0 + 1e-12);
  });
  test.each([30, 45])('90° rule: stun, frictionless, elastic, %s° cut (§9 row 1)', (phi) => {
    const q = { ...p, eBall: 1, muBall: 0 };
    const { cb, ob } = cutSetup(phi, 1);
    const [c, o] = resolveBallBall(cb, ob, q);
    expect(deg(Math.acos(dot(unit(c.v), unit(o.v))))).toBeCloseTo(90, 6);
  });
  test.each([
    [30, 4.72],
    [45, 4.95],
  ])('cut-induced throw at 0.447 m/s, %s° cut ≈ %s° (§9 row 7)', (phi, expected) => {
    const q = { ...p, eBall: 1 };
    const { cb, ob, n } = cutSetup(phi, 0.447);
    const [, o] = resolveBallBall(cb, ob, q);
    expect(deg(Math.acos(dot(unit(o.v), n)))).toBeCloseTo(expected, 1);
  });
  test('gearing outside english gives zero throw (§9 row 7d)', () => {
    const v = 1;
    const phi = Math.PI / 6;
    const { cb, ob, n } = cutSetup(30, v, [0, 0, (v * Math.sin(phi)) / p.R]);
    const [, o] = resolveBallBall(cb, ob, { ...p, eBall: 1 });
    expect(deg(Math.acos(Math.min(1, dot(unit(o.v), n))))).toBeLessThan(0.01);
  });
  test('restitution 0.95 leaves the cue ball a little normal speed', () => {
    const [c] = resolveBallBall(mk('cue', [0, 0, p.R], [1, 0, 0]), mk('1', [2 * p.R, 0, p.R]), { ...p, muBall: 0 });
    expect(c.v[0]).toBeCloseTo(0.025, 9);
    expect(norm(c.w)).toBe(0);
  });
});
