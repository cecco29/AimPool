import type { Ball, Motion } from './types';
import type { PhysicsParams } from './params';
import { add, cross, dot, norm, scale, sub, unit, type Vec3, xy, Z, ZERO } from './vec';

const SLIP_EPS = 1e-9;
const SPEED_EPS = 1e-9;
const SPIN_EPS = 1e-9;
const HEIGHT_EPS = 1e-9;

/** Velocidad del punto de contacto con el paño: v + ω × (−R ẑ). */
export function slip(b: Ball, R: number): Vec3 {
  return [b.v[0] - R * b.w[1], b.v[1] + R * b.w[0], 0];
}

export function classify(b: Ball, p: PhysicsParams): Motion {
  if (b.motion === 'pocketed') return 'pocketed';
  if (b.r[2] > p.R + HEIGHT_EPS || b.v[2] > SPEED_EPS) return 'airborne';
  if (norm(slip(b, p.R)) > SLIP_EPS) return 'sliding';
  if (norm(xy(b.v)) > SPEED_EPS) return 'rolling';
  if (Math.abs(b.w[2]) > SPIN_EPS) return 'spinning';
  return 'stationary';
}

export function withMotion(b: Ball, p: PhysicsParams): Ball {
  const motion = classify(b, p);
  // Una bola quieta (o girando en el lugar) no arrastra residuos de velocidad en el plano.
  if (motion === 'stationary' || motion === 'spinning') return { ...b, v: [0, 0, b.v[2]], motion };
  return { ...b, motion };
}

/** r(t) = a t² + b t + c, válido hasta la próxima transición de la bola. */
export interface Quad { a: Vec3; b: Vec3; c: Vec3 }

export function trajectory(ball: Ball, p: PhysicsParams): Quad {
  switch (ball.motion) {
    case 'sliding': {
      const u = unit(slip(ball, p.R));
      return { a: scale(u, -0.5 * p.muSlide * p.g), b: ball.v, c: ball.r };
    }
    case 'rolling': {
      const d = unit(xy(ball.v));
      return { a: scale(d, -0.5 * p.muRoll * p.g), b: ball.v, c: ball.r };
    }
    case 'airborne':
      return { a: [0, 0, -0.5 * p.g], b: ball.v, c: ball.r };
    default:
      return { a: ZERO, b: ZERO, c: ball.r };
  }
}

export function transitionTime(ball: Ball, p: PhysicsParams): number {
  switch (ball.motion) {
    case 'sliding':
      return (2 * norm(slip(ball, p.R))) / (7 * p.muSlide * p.g);
    case 'rolling':
      return norm(xy(ball.v)) / (p.muRoll * p.g);
    case 'spinning':
      return Math.abs(ball.w[2]) / p.spinDecel;
    default:
      return Infinity;
  }
}

function decaySpin(wz: number, dt: number, p: PhysicsParams): number {
  const d = p.spinDecel * dt;
  return Math.abs(wz) <= d ? 0 : wz - Math.sign(wz) * d;
}

export function evolve(ball: Ball, dt: number, p: PhysicsParams): Ball {
  if (dt <= 0) return ball;
  switch (ball.motion) {
    case 'sliding': {
      const u = unit(slip(ball, p.R));
      const k = p.muSlide * p.g;
      const r = add(add(ball.r, scale(ball.v, dt)), scale(u, -0.5 * k * dt * dt));
      const v = sub(ball.v, scale(u, k * dt));
      const wxy = add([ball.w[0], ball.w[1], 0], scale(cross(Z, u), ((5 * k) / (2 * p.R)) * dt));
      return { ...ball, r, v, w: [wxy[0], wxy[1], decaySpin(ball.w[2], dt, p)] };
    }
    case 'rolling': {
      const speed = norm(xy(ball.v));
      const d = unit(xy(ball.v));
      const k = p.muRoll * p.g;
      if (k * dt >= speed) {
        const r = add(ball.r, scale(d, (speed * speed) / (2 * k)));
        return { ...ball, r, v: ZERO, w: [0, 0, decaySpin(ball.w[2], dt, p)] };
      }
      const r = add(add(ball.r, scale(ball.v, dt)), scale(d, -0.5 * k * dt * dt));
      const v = sub(ball.v, scale(d, k * dt));
      const wxy = scale(cross(Z, v), 1 / p.R);
      return { ...ball, r, v, w: [wxy[0], wxy[1], decaySpin(ball.w[2], dt, p)] };
    }
    case 'spinning':
      return { ...ball, w: [0, 0, decaySpin(ball.w[2], dt, p)] };
    case 'airborne': {
      const r = add(add(ball.r, scale(ball.v, dt)), [0, 0, -0.5 * p.g * dt * dt]);
      const v = sub(ball.v, [0, 0, p.g * dt]);
      return { ...ball, r, v };
    }
    default:
      return ball;
  }
}

/** Fija exactamente el estado de llegada de una transición (elimina residuos numéricos) y reclasifica. */
export function applyTransition(b: Ball, p: PhysicsParams): Ball {
  let out: Ball = b;
  if (b.motion === 'sliding') {
    const w = scale(cross(Z, xy(b.v)), 1 / p.R);
    out = { ...b, v: xy(b.v), w: [w[0], w[1], b.w[2]] };
  } else if (b.motion === 'rolling') {
    out = { ...b, v: ZERO, w: [0, 0, b.w[2]] };
  } else if (b.motion === 'spinning') {
    out = { ...b, w: ZERO };
  }
  return withMotion(out, p);
}

/** Energía cinética (traslación + rotación) + potencial sobre el paño. */
export function energy(b: Ball, p: PhysicsParams): number {
  if (b.motion === 'pocketed') return 0;
  const I = 0.4 * p.m * p.R * p.R;
  return 0.5 * p.m * dot(b.v, b.v) + 0.5 * I * dot(b.w, b.w) + p.m * p.g * Math.max(0, b.r[2] - p.R);
}
