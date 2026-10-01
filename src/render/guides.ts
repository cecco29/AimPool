import type { Ball, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';
import { add, scale, sub, type Vec3 } from '../physics/vec';
import { ghostBallPosition } from '../table/aim';

export type GuideDraw =
  | { kind: 'line'; from: Vec3; to: Vec3; dashed?: boolean; color?: string }
  | { kind: 'ghost'; at: Vec3; color?: string }
  | { kind: 'cue'; at: Vec3; azimuth: number; pull?: number }
  | { kind: 'path'; points: Vec3[]; color?: string }
  | { kind: 'marker'; at: Vec3; color?: string };

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
    // bq < 0: la bola está adelante. Una bola pegada (s ≈ 0) cuenta como contacto inmediato.
    const s = Math.max(0, -bq - Math.sqrt(disc));
    if (bq < 0 && s < best) {
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

export function samplePath(tl: Timeline, ballId: string, p: PhysicsParams, n = 80): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const b = stateAt(tl, (tl.duration * i) / n, p).find((x) => x.id === ballId);
    if (!b) break;
    pts.push(b.r);
    if (b.motion === 'pocketed') break;
  }
  return pts;
}
