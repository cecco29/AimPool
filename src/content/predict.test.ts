import { describe, expect, test } from 'vitest';
import { evaluatePrediction } from './predict';
import { layoutToBalls } from './layout';
import { resolveShotSpec } from './shotSpec';
import { DEFAULT_PARAMS as P } from '../physics/params';
import { simulate } from '../physics/simulate';
import { add, scale, type Vec3 } from '../physics/vec';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';

const g = buildTable(DEFAULT_TABLE_SPEC, P.R);
const run = (layout: { id: string; at: { x: number; y: number } }[], aim: Parameters<typeof resolveShotSpec>[0]['aim'], power = 0.4) => {
  const balls = layoutToBalls({ balls: layout }, g, P.R);
  return simulate(balls, resolveShotSpec({ aim, power }, balls, g, P.R), g.boundary, P);
};

describe('evaluatePrediction', () => {
  test('cueStop: tapping the real final spot succeeds, far away fails', () => {
    const tl = run([{ id: 'cue', at: { x: 2, y: 2 } }], { azimuthDeg: 0 }, 0.2);
    const end = tl.events.at(-1)!.balls[0].r;
    expect(evaluatePrediction('cueStop', 0.5, end, tl, g, P).success).toBe(true);
    const far = evaluatePrediction('cueStop', 0.5, add(end, [1, 0, 0]), tl, g, P);
    expect(far.success).toBe(false);
    expect(far.text).toMatch(/diamantes/);
  });
  test('cueDirection: tapping along the real exit line succeeds, along the old line fails', () => {
    const tl = run([{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }], { ghostOf: '1', pocket: 'c84' }, 0.5);
    const hit = evaluatePrediction('cueDirection', 10, [0, 0, 0], tl, g, P);
    const from = hit.exitFrom!;
    const along = hit.actual!;
    expect(evaluatePrediction('cueDirection', 10, along, tl, g, P).success).toBe(true);
    const incoming = scale(add(from, scale(tl.events[0].balls[0].r, -1)), 1);
    expect(evaluatePrediction('cueDirection', 10, add(from, incoming), tl, g, P).success).toBe(false);
  });
  test('no contact: clear verdict, no NaN', () => {
    const tl = run([{ id: 'cue', at: { x: 2, y: 2 } }, { id: '1', at: { x: 6, y: 3.5 } }], { azimuthDeg: 0 }, 0.3);
    const r = evaluatePrediction('cueDirection', 10, [1, 1, 0] as Vec3, tl, g, P);
    expect(r.success).toBe(false);
    expect(r.text).toMatch(/no tocó/);
  });
  test.each([0.5, 1])('cueDirection: any tap on the real path before the first rail is correct (power %s)', async (power) => {
    const { stateAt } = await import('../physics/simulate');
    const tl = run([{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }], { ghostOf: '1', pocket: 'c84' }, power);
    const hitIdx = tl.events.findIndex((e) => e.kind === 'ballBall');
    const tHit = tl.events[hitIdx].t;
    const tRail = tl.events.slice(hitIdx + 1).find((e) => e.ids.includes('cue') && e.kind !== 'transition')?.t ?? tl.duration;
    for (const f of [0.2, 0.5, 0.8, 0.98]) {
      const at = stateAt(tl, tHit + f * (tRail - tHit), P).find((b) => b.id === 'cue')!.r;
      expect(evaluatePrediction('cueDirection', 10, at, tl, g, P).success).toBe(true);
    }
  });
  test('cueDirection: a tap beyond the first rail gets a hint to mark before the rail', async () => {
    const tl = run([{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }], { ghostOf: '1', pocket: 'c84' }, 0.5);
    const end = tl.events.at(-1)!.balls.find((b) => b.id === 'cue')!.r;
    expect(evaluatePrediction('cueDirection', 10, end, tl, g, P).text).toMatch(/antes de la banda/);
  });
});
