import type { Ball, Shot } from './types';
import type { PhysicsParams } from './params';
import { withMotion } from './motion';
import { rotZ, scale, type Vec3 } from './vec';

/** Desvío de la blanca por efecto lateral (TP A.31). Positivo para a > 0; se aplica en sentido antihorario. */
export function squirtAngle(a: number, p: PhysicsParams): number {
  const ratio = p.m / p.cueEndMass;
  return Math.atan2(2.5 * a * Math.sqrt(Math.max(0, 1 - a * a)), 1 + ratio + 2.5 * (1 - a * a));
}

const MISCUE_SPEED_FACTOR = 0.2;

/** Impulso puntual instantáneo con taco elevado (modelo pooltool / TP A.30). */
export function strike(ball: Ball, shot: Shot, p: PhysicsParams): { ball: Ball; miscue: boolean } {
  const miscue = Math.hypot(shot.a, shot.b) > p.miscueLimit;
  const a = miscue ? 0 : shot.a;
  const b = miscue ? 0 : shot.b;
  const speed = miscue ? shot.cueSpeed * MISCUE_SPEED_FACTOR : shot.cueSpeed;

  const th = shot.elevation;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const c = Math.sqrt(Math.max(0, 1 - a * a - b * b));
  const R = p.R;
  const A = R * a;
  const C = R * (cos * c - sin * b);
  const B = R * (sin * c + cos * b);
  const Im = 0.4 * R * R;
  const denom = 1 + p.m / p.cueMass + (A * A + (B * cos - C * sin) ** 2) / Im;
  const vMag = ((1 + p.tipRestitution) * speed) / denom;

  const vLocal: Vec3 = [0, -vMag * cos, -vMag * sin];
  const wLocal: Vec3 = scale([-C * sin + B * cos, A * sin, -A * cos], vMag / Im);
  const rot = shot.azimuth + Math.PI / 2 + squirtAngle(a, p);
  return { ball: withMotion({ ...ball, v: rotZ(vLocal, rot), w: rotZ(wLocal, rot) }, p), miscue };
}
