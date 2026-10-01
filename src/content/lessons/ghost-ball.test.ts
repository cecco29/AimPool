import { expect, test } from 'vitest';
import { ghostBall } from './ghost-ball';
import { applyVariation, layoutToBalls, mulberry32 } from '../layout';
import { evaluateGoal } from '../goals';
import { DEFAULT_PARAMS as P } from '../../physics/params';
import { simulate } from '../../physics/simulate';
import { buildTable, DEFAULT_TABLE_SPEC } from '../../table/geometry';
import { azimuthTo, ghostBallPosition } from '../../table/aim';
import { aimToShot, DEFAULT_AIM } from '../../input/aim';

test('the guided ghost-ball exercise is playable: aiming at the ghost with default power pockets ≥ 80%', () => {
  const ex = ghostBall.exercises.find((e) => e.kind === 'simShot')!;
  if (ex.kind !== 'simShot') throw new Error('expected a simShot exercise');
  const g = buildTable(DEFAULT_TABLE_SPEC, P.R);
  const rng = mulberry32(3);
  let made = 0;
  const N = 40;
  for (let i = 0; i < N; i++) {
    const balls = layoutToBalls(applyVariation(ex.setup, ex.variation, rng), g, P.R);
    const ob = balls.find((b) => b.id === '1')!;
    const ghost = ghostBallPosition(ob.r, g.pocketCenters.c84, P.R);
    const tl = simulate(balls, aimToShot({ ...DEFAULT_AIM, azimuth: azimuthTo(balls[0].r, ghost) }), g.boundary, P);
    if (evaluateGoal(ex.goal, tl, g, P).success) made++;
  }
  expect(made / N).toBeGreaterThanOrEqual(0.8);
});
