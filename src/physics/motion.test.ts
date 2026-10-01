import { describe, expect, test } from 'vitest';
import type { Ball } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { applyTransition, classify, evolve, slip, transitionTime, withMotion } from './motion';
import { add, cross, norm, scale, type Vec3, Z } from './vec';

const ball = (over: Partial<Ball>): Ball => ({
  id: 'b', r: [0, 0, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary', ...over,
});

describe('classify', () => {
  test('states', () => {
    expect(classify(ball({}), p)).toBe('stationary');
    expect(classify(ball({ v: [1, 0, 0] }), p)).toBe('sliding');
    expect(classify(ball({ v: [1, 0, 0], w: [0, 1 / p.R, 0] }), p)).toBe('rolling');
    expect(classify(ball({ w: [0, 0, 5] }), p)).toBe('spinning');
    expect(classify(ball({ r: [0, 0, p.R + 0.01] }), p)).toBe('airborne');
    expect(classify(ball({ motion: 'pocketed', v: [1, 0, 0] }), p)).toBe('pocketed');
  });
});

describe('stun shot (§2.5, §9 row 3)', () => {
  test('1 m/s slides 0.146 s over 0.125 m, then rolls at 5/7 v for 2.60 m', () => {
    const b = withMotion(ball({ v: [1, 0, 0] }), p);
    expect(b.motion).toBe('sliding');
    const tau = transitionTime(b, p);
    expect(tau).toBeCloseTo(0.1456, 3);
    const end = evolve(b, tau, p);
    expect(end.r[0]).toBeCloseTo(0.1248, 3);
    expect(end.v[0]).toBeCloseTo(5 / 7, 6);
    const rolling = applyTransition(end, p);
    expect(rolling.motion).toBe('rolling');
    const tauRoll = transitionTime(rolling, p);
    expect(tauRoll).toBeCloseTo(7.28, 2);
    const stop = applyTransition(evolve(rolling, tauRoll, p), p);
    expect(stop.motion).toBe('stationary');
    expect(stop.r[0] - end.r[0]).toBeCloseTo(2.6, 2);
  });
});

describe('masse/swerve final direction (§9 row 8)', () => {
  test.each([0.1, 0.3])('end-of-slide velocity is independent of μs = %s', (mu) => {
    const q = { ...p, muSlide: mu };
    const v0: Vec3 = [1.2, 0.3, 0];
    const w0: Vec3 = [12, -30, 40];
    const b = withMotion(ball({ v: v0, w: w0 }), q);
    const end = evolve(b, transitionTime(b, q), q);
    const expected = add(scale(v0, 5 / 7), scale(cross(w0, Z), (2 / 7) * q.R));
    expect(end.v[0]).toBeCloseTo(expected[0], 6);
    expect(end.v[1]).toBeCloseTo(expected[1], 6);
    expect(norm(slip(end, q.R))).toBeLessThan(1e-9);
  });
});

describe('spin decay (§9 row 9)', () => {
  test('z-spin of 10.9 rad/s stops after 1 s and never flips sign', () => {
    const b = withMotion(ball({ w: [0, 0, 10.9] }), p);
    expect(transitionTime(b, p)).toBeCloseTo(1, 6);
    expect(evolve(b, 2, p).w[2]).toBe(0);
  });
});

describe('airborne', () => {
  test('parabolic flight', () => {
    const b = withMotion(ball({ v: [1, 0, 2] }), p);
    expect(b.motion).toBe('airborne');
    const later = evolve(b, 0.1, p);
    expect(later.r[2]).toBeCloseTo(p.R + 0.2 - 0.5 * p.g * 0.01, 9);
    expect(later.v[2]).toBeCloseTo(2 - p.g * 0.1, 9);
  });
});
