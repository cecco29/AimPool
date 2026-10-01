import type { Ball, Boundary, Shot, SimEvent, Timeline } from './types';
import { DEFAULT_PARAMS, type PhysicsParams } from './params';
import { applyTransition, evolve, withMotion } from './motion';
import { strike } from './strike';
import { resolveBallBall } from './ballBall';
import { resolveCushion, resolveTable } from './cushion';
import { type Candidate, nextEvent } from './detect';
import { sub, unit, xy, ZERO } from './vec';

export interface SimOptions { maxEvents?: number; maxDuration?: number }
const MAX_ZERO_DT_EVENTS = 100;

/** Una bola sobre el paño no puede tener velocidad hacia abajo: se apoya en la pizarra. */
function onSlate(b: Ball, p: PhysicsParams): Ball {
  return b.r[2] <= p.R + 1e-9 && b.v[2] < 0 ? { ...b, r: [b.r[0], b.r[1], p.R], v: [b.v[0], b.v[1], 0] } : b;
}

function resolveEvent(ev: Candidate, balls: Ball[], boundary: Boundary, p: PhysicsParams): Ball[] {
  const out = balls.slice();
  const i = out.findIndex((b) => b.id === ev.ids[0]);
  const b = out[i];
  switch (ev.kind) {
    case 'transition':
      out[i] = applyTransition(b, p);
      break;
    case 'ballBall': {
      const j = out.findIndex((x) => x.id === ev.ids[1]);
      const [r1, r2] = resolveBallBall(b, out[j], p);
      out[i] = withMotion(onSlate(r1, p), p);
      out[j] = withMotion(onSlate(r2, p), p);
      break;
    }
    case 'cushion': {
      const s = boundary.segments.find((x) => x.id === ev.target)!;
      out[i] = withMotion(onSlate(resolveCushion(b, s.n, p), p), p);
      break;
    }
    case 'jaw': {
      const c = boundary.jaws.find((x) => x.id === ev.target)!;
      out[i] = withMotion(onSlate(resolveCushion(b, unit(xy(sub(b.r, c.c))), p), p), p);
      break;
    }
    case 'pocket':
      out[i] = { ...b, v: ZERO, w: ZERO, motion: 'pocketed', pocket: ev.target };
      break;
    case 'table':
      out[i] = withMotion(resolveTable(b, p), p);
      break;
    case 'strike':
      break;
  }
  return out;
}

export function simulate(
  initial: Ball[],
  shot: Shot,
  boundary: Boundary,
  p: PhysicsParams = DEFAULT_PARAMS,
  opts: SimOptions = {},
): Timeline {
  const maxEvents = opts.maxEvents ?? 3000;
  const maxDuration = opts.maxDuration ?? 120;
  const idx = initial.findIndex((b) => b.id === shot.cueBallId);
  if (idx < 0) throw new Error(`Cue ball "${shot.cueBallId}" not found`);

  let balls = initial.map((b) => withMotion(b, p));
  const struck = strike(balls[idx], shot, p);
  balls[idx] = withMotion(struck.ball.v[2] < 0 ? resolveTable(struck.ball, p) : struck.ball, p);
  const events: SimEvent[] = [{ t: 0, kind: 'strike', ids: [shot.cueBallId], balls }];

  let t = 0;
  let truncated = false;
  let zeroStreak = 0;
  for (;;) {
    const next = nextEvent(balls, boundary, p);
    if (!next) break;
    if (events.length >= maxEvents || t + next.t > maxDuration) {
      truncated = true;
      break;
    }
    zeroStreak = next.t < 1e-12 ? zeroStreak + 1 : 0;
    if (zeroStreak > MAX_ZERO_DT_EVENTS) {
      truncated = true;
      break;
    }
    balls = balls.map((b) => evolve(b, next.t, p));
    t += next.t;
    balls = resolveEvent(next, balls, boundary, p);
    events.push({ t, kind: next.kind, ids: next.ids, target: next.target, balls });
  }
  return { events, duration: t, truncated, miscue: struck.miscue };
}

/** Estado de todas las bolas en el instante t (se recorta a [0, duration]). */
export function stateAt(tl: Timeline, t: number, p: PhysicsParams): Ball[] {
  const ev = tl.events;
  const time = Math.max(0, Math.min(t, tl.duration));
  let lo = 0;
  let hi = ev.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ev[mid].t <= time) lo = mid;
    else hi = mid - 1;
  }
  const base = ev[lo];
  return base.balls.map((b) => evolve(b, time - base.t, p));
}
