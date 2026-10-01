import type { Ball, Boundary, Circle, EventKind, PocketMouth, Segment } from './types';
import type { PhysicsParams } from './params';
import { type Quad, trajectory, transitionTime } from './motion';
import { realRootsInRange } from './roots';
import { add, dot, scale, sub, type Vec3, xy } from './vec';

export const T_EPS = 1e-10;
const TOUCH_EPS = 1e-9;
/** Velocidad mínima de acercamiento para aceptar un contacto en t = 0 (evita bucles de choques rasantes). */
const MIN_APPROACH = 1e-7;

export interface Candidate { t: number; kind: EventKind; ids: string[]; target?: string }

export const isMoving = (b: Ball): boolean =>
  b.motion === 'sliding' || b.motion === 'rolling' || b.motion === 'airborne';

const at = (q: Quad, t: number): Vec3 => add(add(scale(q.a, t * t), scale(q.b, t)), q.c);
const vel = (q: Quad, t: number): Vec3 => add(scale(q.a, 2 * t), q.b);

export function landingTime(b: Ball, p: PhysicsParams): number {
  if (b.motion !== 'airborne') return Infinity;
  const q = trajectory(b, p);
  for (const t of realRootsInRange([q.a[2], q.b[2], q.c[2] - p.R], T_EPS, Infinity)) {
    if (vel(q, t)[2] < 0) return t;
  }
  return Infinity;
}

const horizon = (b: Ball, p: PhysicsParams): number =>
  b.motion === 'airborne' ? landingTime(b, p) : transitionTime(b, p);

/** Primer t en (0, h] con |A t² + B t + C| = D acercándose; 0 si ya están en contacto y acercándose. */
function contactTime(A: Vec3, B: Vec3, C: Vec3, D: number, h: number): number {
  if (dot(C, C) <= (D + TOUCH_EPS) ** 2 && -dot(C, B) > MIN_APPROACH * Math.sqrt(dot(C, C))) return 0;
  const coeffs = [dot(A, A), 2 * dot(A, B), dot(B, B) + 2 * dot(A, C), 2 * dot(B, C), dot(C, C) - D * D];
  for (const t of realRootsInRange(coeffs, T_EPS, h)) {
    const d = add(add(scale(A, t * t), scale(B, t)), C);
    if (dot(d, add(scale(A, 2 * t), B)) < 0) return t;
  }
  return Infinity;
}

export function ballBallTime(b1: Ball, b2: Ball, p: PhysicsParams): number {
  if (b1.motion === 'pocketed' || b2.motion === 'pocketed') return Infinity;
  if (!isMoving(b1) && !isMoving(b2)) return Infinity;
  const q1 = trajectory(b1, p);
  const q2 = trajectory(b2, p);
  const h = Math.min(horizon(b1, p), horizon(b2, p));
  return contactTime(sub(q2.a, q1.a), sub(q2.b, q1.b), sub(q2.c, q1.c), 2 * p.R, h);
}

export function jawTime(b: Ball, jaw: Circle, p: PhysicsParams): number {
  if (!isMoving(b)) return Infinity;
  const q = trajectory(b, p);
  return contactTime(xy(q.a), xy(q.b), sub(xy(q.c), xy(jaw.c)), p.R + jaw.radius, horizon(b, p));
}

/** La bola cruza la recta (p1, p2) a distancia `offset` moviéndose contra n, dentro del tramo. */
function lineTime(b: Ball, p1: Vec3, p2: Vec3, n: Vec3, offset: number, p: PhysicsParams): number {
  if (!isMoving(b)) return Infinity;
  const q = trajectory(b, p);
  const along = sub(p2, p1);
  const len2 = dot(along, along);
  const within = (r: Vec3) => {
    const u = dot(sub(r, p1), along) / len2;
    return u >= 0 && u <= 1;
  };
  const d0 = dot(sub(q.c, p1), n) - offset;
  if (d0 <= TOUCH_EPS && d0 > -p.R && dot(q.b, n) < -MIN_APPROACH && within(q.c)) return 0;
  for (const t of realRootsInRange([dot(q.a, n), dot(q.b, n), d0], T_EPS, horizon(b, p))) {
    if (dot(vel(q, t), n) < 0 && within(at(q, t))) return t;
  }
  return Infinity;
}

export const segmentTime = (b: Ball, s: Segment, p: PhysicsParams): number => lineTime(b, s.p1, s.p2, s.n, p.R, p);
export const pocketTime = (b: Ball, m: PocketMouth, p: PhysicsParams): number => lineTime(b, m.p1, m.p2, m.n, 0, p);

function pick(best: Candidate | null, t: number, kind: EventKind, ids: string[], target?: string): Candidate | null {
  return t < Infinity && (best === null || t < best.t) ? { t, kind, ids, target } : best;
}

export function nextEvent(balls: Ball[], boundary: Boundary, p: PhysicsParams): Candidate | null {
  let best: Candidate | null = null;
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (b.motion === 'pocketed') continue;
    best = b.motion === 'airborne'
      ? pick(best, landingTime(b, p), 'table', [b.id])
      : pick(best, transitionTime(b, p), 'transition', [b.id]);
    if (isMoving(b)) {
      for (const s of boundary.segments) best = pick(best, segmentTime(b, s, p), 'cushion', [b.id], s.id);
      for (const c of boundary.jaws) best = pick(best, jawTime(b, c, p), 'jaw', [b.id], c.id);
      for (const m of boundary.pockets) best = pick(best, pocketTime(b, m, p), 'pocket', [b.id], m.id);
    }
    for (let j = i + 1; j < balls.length; j++) {
      best = pick(best, ballBallTime(b, balls[j], p), 'ballBall', [b.id, balls[j].id]);
    }
  }
  return best;
}
