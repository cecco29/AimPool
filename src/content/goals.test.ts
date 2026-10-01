import { describe, expect, test } from 'vitest';
import { evaluateGoal } from './goals';
import { DEFAULT_PARAMS as p } from '../physics/params';
import { simulate } from '../physics/simulate';
import type { Ball } from '../physics/types';
import { add, scale, sub, unit, type Vec3, xy, ZERO } from '../physics/vec';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { azimuthTo, ghostBallPosition } from '../table/aim';

const g = buildTable(DEFAULT_TABLE_SPEC, p.R);
const B = (id: string, r: Vec3): Ball => ({ id, r: [r[0], r[1], p.R], v: ZERO, w: ZERO, motion: 'stationary' });
const shoot = (balls: Ball[], aimAt: Vec3, cueSpeed = 1.5) =>
  simulate(balls, { cueBallId: 'cue', azimuth: azimuthTo(balls[0].r, aimAt), elevation: 0, a: 0, b: 0, cueSpeed }, g.boundary, p);
const goal = { pocketBall: { ball: '1', pocket: 'c00' as const } };

describe('evaluateGoal', () => {
  const ob: Vec3 = [0.6, 0.6, p.R];
  const target = g.pocketCenters.c00;

  test('straight-in shot succeeds', () => {
    const balls = [B('cue', [1.0, 1.0, 0]), B('1', ob)];
    // Con la blanca rodando, un tiro recto la hace seguir a la tronera: aceptamos el scratch para aislar la BO.
    const r = evaluateGoal({ ...goal, allowScratch: true }, shoot(balls, ob), g, p);
    expect(r.success).toBe(true);
    expect(r.messages[0]).toMatch(/Bien/);
  });

  test('missed cut is diagnosed as fina or gruesa', () => {
    const cue: Vec3 = [1.2, 0.6, p.R];
    const toCue = unit(xy(sub(cue, ob)));
    const ghostDir = unit(xy(sub(ghostBallPosition(ob, target, p.R), ob)));
    const thick = add(ob, scale(unit(add(ghostDir, scale(toCue, 0.3))), 2 * p.R));
    const thin = add(ob, scale(unit(sub(ghostDir, scale(toCue, 0.3))), 2 * p.R));
    const rThick = evaluateGoal(goal, shoot([B('cue', cue), B('1', ob)], thick), g, p);
    const rThin = evaluateGoal(goal, shoot([B('cue', cue), B('1', ob)], thin), g, p);
    expect(rThick.success).toBe(false);
    expect(rThick.miss).toBe('gruesa');
    expect(rThin.success).toBe(false);
    expect(rThin.miss).toBe('fina');
  });

  test('scratch fails unless allowed', () => {
    const balls = [B('cue', [0.5, 0.5, 0])];
    const tl = shoot(balls, g.pocketCenters.c00);
    expect(evaluateGoal({}, tl, g, p).success).toBe(false);
    expect(evaluateGoal({ allowScratch: true }, tl, g, p).success).toBe(true);
  });

  test('cue ball zone', () => {
    const balls = [B('cue', [1.0, 0.6, 0])];
    const tl = simulate(balls, { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 0.3 }, g.boundary, p);
    const endX = tl.events.at(-1)!.balls[0].r[0] / g.diamond;
    expect(evaluateGoal({ cueBallZone: { center: { x: endX, y: 0.6 / g.diamond }, radius: 0.3 } }, tl, g, p).success).toBe(true);
    expect(evaluateGoal({ cueBallZone: { center: { x: 7, y: 3 }, radius: 0.3 } }, tl, g, p).success).toBe(false);
  });
});
