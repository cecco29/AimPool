import { dot, sub, unit, type Vec3, xy } from '../physics/vec';

export const azimuthTo = (from: Vec3, to: Vec3): number => Math.atan2(to[1] - from[1], to[0] - from[0]);

/** Centro de la bola fantasma: a 2R de la BO, del lado opuesto al objetivo. */
export function ghostBallPosition(ob: Vec3, target: Vec3, R: number): Vec3 {
  const d = unit(xy(sub(target, ob)));
  return [ob[0] - 2 * R * d[0], ob[1] - 2 * R * d[1], ob[2]];
}

/** Ángulo de corte: entre la línea BB→BF y la línea BO→objetivo (grados). */
export function cutAngleDeg(cb: Vec3, ob: Vec3, target: Vec3, R: number): number {
  const gb = ghostBallPosition(ob, target, R);
  const a = unit(xy(sub(gb, cb)));
  const b = unit(xy(sub(target, ob)));
  return (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;
}
