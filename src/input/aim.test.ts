import { describe, expect, test } from 'vitest';
import { simulate } from '../physics/simulate';
import { DEFAULT_PARAMS as P } from '../physics/params';
import { aimToShot, clampSpin, DEFAULT_AIM, MAX_SPIN, powerLabel, powerToCueSpeed, pullToPower, relativeAimDelta, spinFromPoint, wheelDelta } from './aim';

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
  test('power mapping is usable across the whole slider', () => {
    const travel = (power: number) => {
      const tl = simulate([{ id: 'cue', r: [0, 0, P.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' }],
        aimToShot({ ...DEFAULT_AIM, power }), { segments: [], jaws: [], pockets: [] }, P);
      return tl.events.at(-1)!.balls[0].r[0];
    };
    expect(travel(0.2)).toBeGreaterThan(2.5); // "suave" todavía cruza una mesa de 9 pies
    expect(travel(0.05)).toBeGreaterThan(0.3); // el mínimo mueve la bola
    expect(powerToCueSpeed(1)).toBeLessThanOrEqual(6);
    expect(powerLabel(0.1)).toBe('suave');
    expect(powerLabel(0.5)).toBe('media');
    expect(powerLabel(0.9)).toBe('fuerte');
  });
  test('aimToShot converts elevation degrees to radians', () => {
    const s = aimToShot({ ...DEFAULT_AIM, elevation: 30 });
    expect(s.elevation).toBeCloseTo(Math.PI / 6, 12);
    expect(s.cueBallId).toBe('cue');
  });
  test('relative drag: only the finger motion perpendicular to the aim line rotates the cue', () => {
    expect(relativeAimDelta(0, [1, 1, 0], [1, 1.1, 0])).toBeCloseTo(0.1, 12); // a la izquierda del tiro → antihorario
    expect(relativeAimDelta(0, [1, 1, 0], [1.3, 1, 0])).toBeCloseTo(0, 12); // a lo largo del tiro → nada
    expect(relativeAimDelta(Math.PI / 2, [1, 1, 0], [0.9, 1, 0])).toBeCloseTo(0.1, 12);
  });
  test('fine wheel: 50 px = 1°', () => {
    expect(wheelDelta(50)).toBeCloseTo(Math.PI / 180, 12);
    expect(wheelDelta(-25)).toBeCloseTo(-Math.PI / 360, 12);
  });
  test('pullToPower clamps to [0, 1]', () => {
    expect(pullToPower(110, 220)).toBeCloseTo(0.5, 12);
    expect(pullToPower(-30, 220)).toBe(0);
    expect(pullToPower(500, 220)).toBe(1);
  });
});
