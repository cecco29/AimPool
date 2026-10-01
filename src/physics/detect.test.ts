import { describe, expect, test } from 'vitest';
import type { Ball, Boundary } from './types';
import { DEFAULT_PARAMS } from './params';
import { withMotion } from './motion';
import { ballBallTime, jawTime, landingTime, nextEvent, pocketTime, segmentTime } from './detect';
import type { Vec3 } from './vec';

const p0 = { ...DEFAULT_PARAMS, muSlide: 0, muRoll: 0 }; // sin fricción: trayectorias rectas
const R = p0.R;
const mk = (id: string, r: Vec3, v: Vec3 = [0, 0, 0], p = p0): Ball =>
  withMotion({ id, r: [r[0], r[1], r[2] || R], v, w: [0, 0, 0], motion: 'stationary' }, p);
const bottomRail = { id: 'rail', p1: [0, 0, 0] as Vec3, p2: [2, 0, 0] as Vec3, n: [0, 1, 0] as Vec3 };

describe('ballBallTime', () => {
  test('head-on approach', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [1, 0, 0]), mk('b', [0.5, 0, 0]), p0)).toBeCloseTo(0.5 - 2 * R, 9);
  });
  test('frozen contacts: touching and approaching collide at t = 0', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [1, 0, 0]), mk('b', [2 * R, 0, 0]), p0)).toBe(0);
  });
  test('touching but separating never collide', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [-1, 0, 0]), mk('b', [2 * R, 0, 0]), p0)).toBe(Infinity);
  });
  test('passing wide misses', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [1, 0, 0]), mk('b', [0.5, 3 * R, 0]), p0)).toBe(Infinity);
  });
  test('two stationary balls never collide', () => {
    expect(ballBallTime(mk('a', [0, 0, 0]), mk('b', [2 * R, 0, 0]), p0)).toBe(Infinity);
  });
});

describe('cushions, jaws and pockets', () => {
  test('rail hit when the ball edge reaches the nose', () => {
    expect(segmentTime(mk('a', [1, 0.5, 0], [0, -1, 0]), bottomRail, p0)).toBeCloseTo(0.5 - R, 9);
  });
  test('outside the rail extent there is no hit', () => {
    expect(segmentTime(mk('a', [3, 0.5, 0], [0, -1, 0]), bottomRail, p0)).toBe(Infinity);
  });
  test('frozen to the rail and pushed into it collides at t = 0', () => {
    expect(segmentTime(mk('a', [1, R, 0], [0.3, -1, 0]), bottomRail, p0)).toBe(0);
  });
  test('moving away from the rail never hits it', () => {
    expect(segmentTime(mk('a', [1, 0.5, 0], [0, 1, 0]), bottomRail, p0)).toBe(Infinity);
  });
  test('pocket capture uses the ball center (no radius offset)', () => {
    const m = { id: 's40', p1: [0, 0, 0] as Vec3, p2: [1, 0, 0] as Vec3, n: [0, 1, 0] as Vec3 };
    expect(pocketTime(mk('a', [0.5, 0.3, 0], [0, -1, 0]), m, p0)).toBeCloseTo(0.3, 9);
  });
  test('jaw circle', () => {
    const jaw = { id: 'j', c: [1, 0, 0] as Vec3, radius: 0.02 };
    expect(jawTime(mk('a', [1, 0.5, 0], [0, -1, 0]), jaw, p0)).toBeCloseTo(0.5 - R - 0.02, 9);
  });
  test('landing time of an airborne ball', () => {
    const b = withMotion({ id: 'a', r: [0, 0, R + 0.01], v: [0, 0, 0], w: [0, 0, 0], motion: 'airborne' }, p0);
    expect(landingTime(b, p0)).toBeCloseTo(Math.sqrt(0.02 / p0.g), 9);
  });
});

describe('nextEvent', () => {
  const p = DEFAULT_PARAMS;
  const empty: Boundary = { segments: [], jaws: [], pockets: [] };
  test('nothing moving → null', () => {
    expect(nextEvent([mk('a', [0, 0, 0], [0, 0, 0], p)], empty, p)).toBeNull();
  });
  test('lone sliding ball → transition', () => {
    const e = nextEvent([mk('a', [0, 0, 0], [1, 0, 0], p)], empty, p)!;
    expect(e.kind).toBe('transition');
    expect(e.t).toBeCloseTo(0.1456, 3);
  });
  test('close object ball → ballBall before the slide ends', () => {
    const e = nextEvent([mk('cue', [0, 0, 0], [1, 0, 0], p), mk('1', [0.1, 0, 0], [0, 0, 0], p)], empty, p)!;
    expect(e.kind).toBe('ballBall');
    expect(e.ids).toEqual(['cue', '1']);
  });
});
