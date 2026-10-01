import { describe, expect, test } from 'vitest';
import { firstContact, ghostGuides } from './guides';
import { samplePath } from './guides';
import { simulate } from '../physics/simulate';
import { DEFAULT_PARAMS as P } from '../physics/params';
import type { Ball } from '../physics/types';

const R = 0.028575;
const B = (id: string, x: number, y: number): Ball => ({ id, r: [x, y, R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' });

describe('firstContact', () => {
  test('stops where the cue ball first touches an object ball', () => {
    const cue = B('cue', 0.5, 0.5);
    const c = firstContact(cue, 0, [cue, B('1', 1.0, 0.5)], 2.54, 1.27, R);
    expect(c.ballId).toBe('1');
    expect(c.point[0]).toBeCloseTo(1.0 - 2 * R, 9);
  });
  test('stops at the rail when nothing is in the way', () => {
    const cue = B('cue', 0.5, 0.5);
    const c = firstContact(cue, 0, [cue], 2.54, 1.27, R);
    expect(c.ballId).toBeUndefined();
    expect(c.point[0]).toBeCloseTo(2.54 - R, 9);
  });
});

describe('ghostGuides', () => {
  test('ghost circle, object-to-pocket line and cue-to-ghost line', () => {
    const g = ghostGuides([1, 0.5, R], [2, 0.5, 0], [0.2, 0.5, R], R);
    expect(g.map((x) => x.kind).sort()).toEqual(['ghost', 'line', 'line']);
  });
});

describe('firstContact with a frozen ball', () => {
  test('a ball frozen in front is hit immediately', () => {
    const cue = B('cue', 0.5, 0.5);
    const c = firstContact(cue, 0, [cue, B('1', 0.5 + 2 * R, 0.5)], 2.54, 1.27, R);
    expect(c.ballId).toBe('1');
    expect(c.point[0]).toBeCloseTo(0.5, 9);
  });
  test('a ball frozen behind is ignored', () => {
    const cue = B('cue', 0.5, 0.5);
    expect(firstContact(cue, 0, [cue, B('1', 0.5 - 2 * R, 0.5)], 2.54, 1.27, R).ballId).toBeUndefined();
  });
});

describe('samplePath', () => {
  test('samples the ball positions over the whole timeline', () => {
    const tl = simulate([B('cue', 0.5, 0.5)], { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 }, { segments: [], jaws: [], pockets: [] }, P);
    const pts = samplePath(tl, 'cue', P, 20);
    expect(pts).toHaveLength(21);
    expect(pts[0][0]).toBeCloseTo(0.5, 9);
    expect(pts[20][0]).toBeCloseTo(tl.events.at(-1)!.balls[0].r[0], 9);
  });
});
