import { describe, expect, test } from 'vitest';
import { simulateAsync } from './client';
import { DEFAULT_PARAMS as p } from '../physics/params';
import { DEFAULT_TABLE_SPEC } from '../table/geometry';

describe('simulateAsync', () => {
  test('falls back to in-thread simulation when Worker is unavailable', async () => {
    expect(typeof Worker).toBe('undefined');
    const tl = await simulateAsync(
      [{ id: 'cue', r: [0.6, 0.6, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' }],
      { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 },
      DEFAULT_TABLE_SPEC,
      p,
    );
    expect(tl.events[0].kind).toBe('strike');
    expect(tl.duration).toBeGreaterThan(0);
  });
  test('rejects on simulation errors', async () => {
    await expect(
      simulateAsync([], { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 }, DEFAULT_TABLE_SPEC, p),
    ).rejects.toThrow(/not found/);
  });
});
