import { describe, expect, test } from 'vitest';
import type { Ball, Shot } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { squirtAngle, strike } from './strike';
import { classify } from './motion';
import { angleXY, norm, xy } from './vec';

const cue: Ball = { id: 'cue', r: [0, 0, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' };
const shot = (over: Partial<Shot>): Shot => ({ cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1, ...over });

describe('strike', () => {
  test('center hit efficiency is 1.5 with m/M = 1/3 and an elastic tip (§9 row 5)', () => {
    const q = { ...p, tipRestitution: 1, cueMass: 3 * p.m };
    const { ball } = strike(cue, shot({}), q);
    expect(ball.v[0]).toBeCloseTo(1.5, 9);
    expect(norm(ball.w)).toBeCloseTo(0, 9);
  });
  test('b = 0.4 gives natural roll immediately (§9 row 4)', () => {
    const { ball } = strike(cue, shot({ b: 0.4 }), p);
    expect(classify(ball, p)).toBe('rolling');
  });
  test('b = 0.5 gives 1.25× natural roll', () => {
    const { ball } = strike(cue, shot({ b: 0.5 }), p);
    expect((p.R * Math.abs(ball.w[1])) / ball.v[0]).toBeCloseTo(1.25, 6);
  });
  test('azimuth sets the travel direction', () => {
    const { ball } = strike(cue, shot({ azimuth: Math.PI / 3 }), p);
    expect(angleXY(ball.v)).toBeCloseTo(Math.PI / 3, 9);
  });
  test('right english spins clockwise and squirts left', () => {
    const { ball } = strike(cue, shot({ a: 0.3 }), p);
    expect(ball.w[2]).toBeLessThan(0);
    expect(angleXY(ball.v)).toBeGreaterThan(0);
  });
  test('squirt angle values with m/m_e = 30 (§9 row 6)', () => {
    expect((squirtAngle(0.25, p) * 180) / Math.PI).toBeCloseTo(1.04, 2);
    expect((squirtAngle(0.5, p) * 180) / Math.PI).toBeCloseTo(1.89, 2);
  });
  test('offset beyond the limit is a miscue: weak, spinless hit', () => {
    const r = strike(cue, shot({ a: 0.6 }), p);
    expect(r.miscue).toBe(true);
    expect(norm(r.ball.w)).toBeCloseTo(0, 9);
    expect(norm(r.ball.v)).toBeLessThan(norm(strike(cue, shot({}), p).ball.v));
  });
  test('elevated cue drives the ball into the slate', () => {
    const { ball } = strike(cue, shot({ elevation: 0.5 }), p);
    expect(ball.v[2]).toBeLessThan(0);
    expect(norm(xy(ball.v))).toBeGreaterThan(0);
  });
  test('zero cue speed leaves the ball at rest', () => {
    const { ball } = strike(cue, shot({ cueSpeed: 0 }), p);
    expect(classify(ball, p)).toBe('stationary');
  });
});
