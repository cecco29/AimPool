import { describe, expect, test } from 'vitest';
import { buildTable, DEFAULT_TABLE_SPEC, diamondToPoint, pointToDiamond } from './geometry';
import { dot, norm, sub } from '../physics/vec';

const R = 0.028575;

describe('buildTable', () => {
  const g = buildTable(DEFAULT_TABLE_SPEC, R);
  test('9 ft dimensions and diamond spacing', () => {
    expect(g.length).toBeCloseTo(2.54, 9);
    expect(g.width).toBeCloseTo(1.27, 9);
    expect(g.diamond).toBeCloseTo(0.3175, 9);
  });
  test('6 rails, 12 jaws, 6 pockets', () => {
    expect(g.boundary.segments).toHaveLength(6);
    expect(g.boundary.jaws).toHaveLength(12);
    expect(g.boundary.pockets.map((m) => m.id).sort()).toEqual(['c00', 'c04', 'c80', 'c84', 's40', 's44']);
  });
  test('mouth widths match the spec', () => {
    const s = Object.fromEntries(g.boundary.segments.map((x) => [x.id, x]));
    expect(norm(sub(s['y0-head'].p1, s['x0'].p1))).toBeCloseTo(DEFAULT_TABLE_SPEC.cornerMouth, 9);
    expect(s['y0-foot'].p1[0] - s['y0-head'].p2[0]).toBeCloseTo(DEFAULT_TABLE_SPEC.sideMouth, 9);
  });
  test('rail normals point into the playing surface', () => {
    const center = [g.length / 2, g.width / 2, 0] as const;
    for (const s of g.boundary.segments) expect(dot(sub(center, s.p1), s.n)).toBeGreaterThan(0);
  });
  test('capture lines sit half a radius behind the mouth', () => {
    const c00 = g.boundary.pockets.find((m) => m.id === 'c00')!;
    expect(dot(sub(c00.p1, [0.1143 / Math.SQRT2, 0, 0]), c00.n)).toBeCloseTo(-0.5 * R, 9);
  });
  test('8 ft table', () => {
    expect(buildTable({ ...DEFAULT_TABLE_SPEC, size: '8ft' }, R).length).toBeCloseTo(2.3368, 9);
  });
});

describe('diamonds', () => {
  const g = buildTable(DEFAULT_TABLE_SPEC, R);
  test('foot spot (6,2)', () => {
    const pt = diamondToPoint(g, 6, 2);
    expect(pt[0]).toBeCloseTo(1.905, 9);
    expect(pt[1]).toBeCloseTo(0.635, 9);
  });
  test('round trip', () => {
    const d = pointToDiamond(g, diamondToPoint(g, 3.25, 1.5));
    expect(d.x).toBeCloseTo(3.25, 12);
    expect(d.y).toBeCloseTo(1.5, 12);
  });
});
