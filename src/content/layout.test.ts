import { describe, expect, test } from 'vitest';
import { applyVariation, layoutToBalls, mulberry32 } from './layout';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';

const R = 0.028575;
const g9 = buildTable(DEFAULT_TABLE_SPEC, R);
const g7 = buildTable({ ...DEFAULT_TABLE_SPEC, size: '7ft' }, R);

describe('layoutToBalls', () => {
  test('converts diamonds to metres at rest on the cloth', () => {
    const [b] = layoutToBalls({ balls: [{ id: 'cue', at: { x: 6, y: 2 } }] }, g9, R);
    expect(b.r[0]).toBeCloseTo(1.905, 9);
    expect(b.r[2]).toBe(R);
    expect(b.motion).toBe('stationary');
  });
  test('frozen-to-rail positions are clamped so the ball never overlaps the cushion', () => {
    const [b] = layoutToBalls({ balls: [{ id: 'cue', at: { x: 3, y: 0.09 } }] }, g7, R);
    expect(b.r[1]).toBeCloseTo(R, 12);
  });
});

describe('applyVariation', () => {
  const layout = { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] };
  test('deterministic with a seeded rng and only moves listed balls', () => {
    const a = applyVariation(layout, { balls: ['cue'], jitter: 0.3 }, mulberry32(7));
    const b = applyVariation(layout, { balls: ['cue'], jitter: 0.3 }, mulberry32(7));
    expect(a).toEqual(b);
    expect(a.balls[1].at).toEqual({ x: 6, y: 2 });
    expect(Math.abs(a.balls[0].at.x - 4)).toBeLessThanOrEqual(0.3);
  });
  test('no variation returns the same layout', () => {
    expect(applyVariation(layout, undefined, Math.random)).toBe(layout);
  });
});
