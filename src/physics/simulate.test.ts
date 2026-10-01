import { describe, expect, test } from 'vitest';
import type { Ball, Boundary, Shot } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { simulate, stateAt } from './simulate';
import { energy, evolve } from './motion';
import { dot, unit, type Vec3, ZERO } from './vec';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { azimuthTo } from '../table/aim';

const open: Boundary = { segments: [], jaws: [], pockets: [] };
const B = (id: string, x: number, y: number): Ball => ({ id, r: [x, y, p.R], v: ZERO, w: ZERO, motion: 'stationary' });
const shot = (over: Partial<Shot>): Shot => ({ cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1, ...over });
const deg = (r: number) => (r * 180) / Math.PI;
const last = (balls: Ball[], id: string) => balls.find((b) => b.id === id)!;
const g = buildTable(DEFAULT_TABLE_SPEC, p.R);

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('physics rules (integration)', () => {
  test('30° rule: rolling CB at a half-ball hit deflects 33.67° (§9 row 2)', () => {
    const q = { ...p, eBall: 1, muBall: 0 };
    const tl = simulate([B('cue', 0.3, 0.6), B('1', 0.8, 0.6 + p.R)], shot({ b: 0.4 }), open, q);
    const hit = tl.events.findIndex((e) => e.kind === 'ballBall');
    expect(hit).toBeGreaterThan(0);
    const settle = tl.events.slice(hit + 1).find((e) => e.kind === 'transition' && e.ids[0] === 'cue')!;
    const cue = last(settle.balls, 'cue');
    expect(Math.abs(deg(Math.atan2(cue.v[1], cue.v[0])))).toBeCloseTo(33.67, 1);
  });

  test('90° rule: stun CB separates at 90° (§9 row 1)', () => {
    const q = { ...p, eBall: 1, muBall: 0, muSlide: 1e-6 };
    const tl = simulate([B('cue', 0.3, 0.6), B('1', 0.8, 0.6 + 2 * p.R * Math.SQRT1_2)], shot({}), open, q);
    const hit = tl.events.find((e) => e.kind === 'ballBall')!;
    const c = last(hit.balls, 'cue');
    const o = last(hit.balls, '1');
    expect(deg(Math.acos(dot(unit(c.v), unit(o.v))))).toBeCloseTo(90, 2);
  });
});

describe('table interactions', () => {
  test('straight into the corner pocket', () => {
    const tl = simulate([B('cue', 0.5, 0.5)], shot({ azimuth: azimuthTo([0.5, 0.5, 0], g.pocketCenters.c00), cueSpeed: 1.5 }), g.boundary, p);
    const end = last(tl.events.at(-1)!.balls, 'cue');
    expect(end.motion).toBe('pocketed');
    expect(end.pocket).toBe('c00');
  });
  test('straight into the side pocket', () => {
    const tl = simulate([B('cue', g.length / 2, 0.4)], shot({ azimuth: -Math.PI / 2, cueSpeed: 1.5 }), g.boundary, p);
    expect(last(tl.events.at(-1)!.balls, 'cue').pocket).toBe('s40');
  });
  test('running along the rail into the corner', () => {
    const tl = simulate([B('cue', 1.0, p.R + 0.002)], shot({ azimuth: Math.PI, cueSpeed: 2 }), g.boundary, p);
    expect(last(tl.events.at(-1)!.balls, 'cue').pocket).toBe('c00');
  });
  test('rail bounce keeps the ball on the table', () => {
    const tl = simulate([B('cue', 1.0, 0.6)], shot({ azimuth: -Math.PI / 2, cueSpeed: 1 }), g.boundary, p);
    expect(tl.events.some((e) => e.kind === 'cushion')).toBe(true);
    expect(last(tl.events.at(-1)!.balls, 'cue').motion).toBe('stationary');
  });
});

describe('robustness', () => {
  test('frozen chain: the third ball moves', () => {
    const tl = simulate([B('cue', 0.5, 0.6), B('1', 1.0, 0.6), B('2', 1.0 + 2 * p.R, 0.6)], shot({ cueSpeed: 1.5 }), open, p);
    expect(tl.truncated).toBe(false);
    expect(last(tl.events.at(-1)!.balls, '2').r[0]).toBeGreaterThan(1.2);
  });
  test('zero power ends immediately', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ cueSpeed: 0 }), g.boundary, p);
    expect(tl.events).toHaveLength(1);
    expect(tl.duration).toBe(0);
  });
  test('miscue finishes and is flagged', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ a: 0.7, cueSpeed: 3 }), g.boundary, p);
    expect(tl.miscue).toBe(true);
    expect(tl.truncated).toBe(false);
  });
  test('jump: elevated cue makes the ball fly and land', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ elevation: 0.6, cueSpeed: 3 }), open, p);
    expect(tl.events.some((e) => e.kind === 'table')).toBe(true);
    expect(stateAt(tl, 0.02, p)[0].r[2]).toBeGreaterThan(p.R);
    expect(tl.truncated).toBe(false);
  });
  test('event cap truncates', () => {
    const tl = simulate([B('cue', 1.0, 0.6)], shot({ cueSpeed: 4 }), g.boundary, p, { maxEvents: 2 });
    expect(tl.truncated).toBe(true);
    expect(tl.events.length).toBeLessThanOrEqual(2);
  });
  test('unknown cue ball id throws', () => {
    expect(() => simulate([B('x', 1, 1)], shot({}), open, p)).toThrow(/not found/);
  });

  test('balls never leave the table and energy never increases (randomized)', () => {
    const rand = rng(42);
    for (let i = 0; i < 40; i++) {
      const pos = (): Vec3 => [0.1 + rand() * (g.length - 0.2), 0.1 + rand() * (g.width - 0.2), p.R];
      const balls = ['cue', '1', '2'].map((id) => {
        const r = pos();
        return B(id, r[0], r[1]);
      });
      const tooClose = balls.some((a, j) => balls.some((b, k) => k > j && Math.hypot(a.r[0] - b.r[0], a.r[1] - b.r[1]) < 2.2 * p.R));
      if (tooClose) continue;
      const tl = simulate(balls, shot({
        azimuth: rand() * 2 * Math.PI, cueSpeed: 0.5 + rand() * 5,
        a: (rand() - 0.5) * 0.8, b: (rand() - 0.5) * 0.8, elevation: rand() < 0.2 ? 0.3 : 0,
      }), g.boundary, p);
      expect(tl.truncated).toBe(false);
      for (const b of tl.events.at(-1)!.balls) {
        if (b.motion === 'pocketed') continue;
        expect(b.r[0]).toBeGreaterThanOrEqual(p.R - 1e-6);
        expect(b.r[0]).toBeLessThanOrEqual(g.length - p.R + 1e-6);
        expect(b.r[1]).toBeGreaterThanOrEqual(p.R - 1e-6);
        expect(b.r[1]).toBeLessThanOrEqual(g.width - p.R + 1e-6);
      }
      let prev = Infinity;
      for (const e of tl.events) {
        const total = e.balls.reduce((s, b) => s + energy(b, p), 0);
        expect(total).toBeLessThanOrEqual(prev + 1e-9);
        prev = total;
      }
    }
  });
});

describe('stateAt', () => {
  test('evolves from the last event before t', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ cueSpeed: 1 }), open, p);
    const e1 = tl.events[1];
    const t = e1.t + 0.3;
    expect(stateAt(tl, t, p)[0].r[0]).toBeCloseTo(evolve(e1.balls[0], 0.3, p).r[0], 12);
    expect(stateAt(tl, 1e9, p)[0].r[0]).toBeCloseTo(tl.events.at(-1)!.balls[0].r[0], 12);
  });
});
