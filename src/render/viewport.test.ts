import { describe, expect, test } from 'vitest';
import { fitViewport, screenToWorld, worldToScreen } from './viewport';

describe('viewport', () => {
  test.each([[400, 800], [800, 400]])('round trip at %sx%s', (w, h) => {
    const vp = fitViewport(w, h, 2.54, 1.27);
    const [sx, sy] = worldToScreen(vp, [1.1, 0.4, 0]);
    const p = screenToWorld(vp, sx, sy);
    expect(p[0]).toBeCloseTo(1.1, 9);
    expect(p[1]).toBeCloseTo(0.4, 9);
  });
  test('portrait when taller than wide; head rail at the bottom', () => {
    const vp = fitViewport(400, 800, 2.54, 1.27);
    expect(vp.portrait).toBe(true);
    expect(worldToScreen(vp, [0, 0.6, 0])[1]).toBeGreaterThan(worldToScreen(vp, [2.5, 0.6, 0])[1]);
  });
  test('the whole table fits inside the canvas', () => {
    const vp = fitViewport(400, 800, 2.54, 1.27);
    for (const p of [[0, 0, 0], [2.54, 1.27, 0], [0, 1.27, 0], [2.54, 0, 0]] as const) {
      const [x, y] = worldToScreen(vp, p);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(400);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(800);
    }
  });
  test('portrait is a rotation, not a mirror: c84 ends up top-left', () => {
    const vp = fitViewport(400, 800, 2.54, 1.27);
    const [x, y] = worldToScreen(vp, [2.54, 1.27, 0]);
    expect(x).toBeLessThan(200);
    expect(y).toBeLessThan(400);
  });
});
