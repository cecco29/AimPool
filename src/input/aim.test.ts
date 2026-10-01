import { describe, expect, test } from 'vitest';
import { aimToShot, clampSpin, DEFAULT_AIM, MAX_SPIN, powerLabel, powerToCueSpeed, spinFromPoint } from './aim';

describe('aim helpers', () => {
  test('clampSpin keeps the point inside the allowed radius', () => {
    const [a, b] = clampSpin(1, 1);
    expect(Math.hypot(a, b)).toBeCloseTo(MAX_SPIN, 12);
    expect(clampSpin(0.1, 0.2)).toEqual([0.1, 0.2]);
  });
  test('spinFromPoint maps pad pixels to normalized offsets (up = +b)', () => {
    expect(spinFromPoint(50, 50, 100)).toEqual([0, 0]);
    const [a, b] = spinFromPoint(50, 30, 100);
    expect(a).toBeCloseTo(0, 12);
    expect(b).toBeCloseTo(0.4, 12);
  });
  test('power mapping', () => {
    expect(powerToCueSpeed(0)).toBeCloseTo(0.2, 12);
    expect(powerToCueSpeed(1)).toBeCloseTo(6, 12);
    expect(powerLabel(0.1)).toBe('suave');
    expect(powerLabel(0.5)).toBe('media');
    expect(powerLabel(0.9)).toBe('fuerte');
  });
  test('aimToShot converts elevation degrees to radians', () => {
    const s = aimToShot({ ...DEFAULT_AIM, elevation: 30 });
    expect(s.elevation).toBeCloseTo(Math.PI / 6, 12);
    expect(s.cueBallId).toBe('cue');
  });
});
