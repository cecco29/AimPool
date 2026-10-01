import type { Ball } from '../physics/types';
import { add, scale, sub, type Vec3 } from '../physics/vec';
import { ghostBallPosition } from '../table/aim';

export type GuideDraw =
  | { kind: 'line'; from: Vec3; to: Vec3; dashed?: boolean; color?: string }
  | { kind: 'ghost'; at: Vec3; color?: string }
  | { kind: 'cue'; at: Vec3; azimuth: number; pull?: number };

/** Recorre en línea recta desde la blanca: primer contacto con una bola (a 2R) o con la banda. */
export function firstContact(
  cue: Ball, azimuth: number, balls: Ball[], length: number, width: number, R: number,
): { point: Vec3; ballId?: string } {
  const d: Vec3 = [Math.cos(azimuth), Math.sin(azimuth), 0];
  let best = Infinity;
  let ballId: string | undefined;
  for (const b of balls) {
    if (b.id === cue.id || b.motion === 'pocketed') continue;
    const m = sub(cue.r, b.r);
    const bq = m[0] * d[0] + m[1] * d[1];
    const c = m[0] * m[0] + m[1] * m[1] - 4 * R * R;
    const disc = bq * bq - c;
    if (disc < 0) continue;
    const s = -bq - Math.sqrt(disc);
    if (s > 1e-9 && s < best) {
      best = s;
      ballId = b.id;
    }
  }
  const toRail = (pos: number, dir: number, lo: number, hi: number) =>
    dir > 1e-12 ? (hi - pos) / dir : dir < -1e-12 ? (lo - pos) / dir : Infinity;
  const sRail = Math.min(toRail(cue.r[0], d[0], R, length - R), toRail(cue.r[1], d[1], R, width - R));
  if (sRail < best) {
    best = sRail;
    ballId = undefined;
  }
  return { point: add(cue.r, scale(d, Math.max(0, best))), ballId };
}

export function ghostGuides(ob: Vec3, pocketPoint: Vec3, cue: Vec3 | undefined, R: number): GuideDraw[] {
  const gb = ghostBallPosition(ob, pocketPoint, R);
  const out: GuideDraw[] = [{ kind: 'line', from: ob, to: pocketPoint, dashed: true }];
  if (cue) out.push({ kind: 'line', from: cue, to: gb, dashed: true, color: 'rgba(255,209,102,0.9)' });
  out.push({ kind: 'ghost', at: gb });
  return out;
}
