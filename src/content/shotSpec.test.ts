import { describe, expect, test } from 'vitest';
import { resolveShotSpec } from './shotSpec';
import { layoutToBalls } from './layout';
import { DEFAULT_PARAMS as P } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { azimuthTo, ghostBallPosition } from '../table/aim';
import { powerToCueSpeed } from '../input/aim';

const g = buildTable(DEFAULT_TABLE_SPEC, P.R);
const balls = layoutToBalls({ balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] }, g, P.R);

describe('resolveShotSpec', () => {
  test('ghostOf aims at the ghost ball', () => {
    const s = resolveShotSpec({ aim: { ghostOf: '1', pocket: 'c84' }, power: 0.5 }, balls, g, P.R);
    expect(s.azimuth).toBeCloseTo(azimuthTo(balls[0].r, ghostBallPosition(balls[1].r, g.pocketCenters.c84, P.R)), 12);
    expect(s.cueSpeed).toBeCloseTo(powerToCueSpeed(0.5), 12);
  });
  test('at aims at a diamond position; azimuthDeg is absolute; spin and elevation pass through', () => {
    const at = resolveShotSpec({ aim: { at: { x: 8, y: 1 } }, power: 0.3 }, balls, g, P.R);
    expect(at.azimuth).toBeCloseTo(0, 12);
    const ab = resolveShotSpec({ aim: { azimuthDeg: 90 }, power: 0.3, spin: { a: 0.1, b: -0.2 }, elevationDeg: 10 }, balls, g, P.R);
    expect(ab.azimuth).toBeCloseTo(Math.PI / 2, 12);
    expect(ab.a).toBe(0.1);
    expect(ab.b).toBe(-0.2);
    expect(ab.elevation).toBeCloseTo((10 * Math.PI) / 180, 12);
  });
  test('missing balls throw a readable error', () => {
    expect(() => resolveShotSpec({ aim: { ghostOf: '9', pocket: 'c84' }, power: 0.5 }, balls, g, P.R)).toThrow(/bola 9/);
  });
});
