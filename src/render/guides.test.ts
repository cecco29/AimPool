import { describe, expect, test } from 'vitest';
import { firstContact, ghostGuides } from './guides';
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
