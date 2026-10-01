import type { Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { add, dot, norm, scale, sub, unit, type Vec3, xy } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import { finalBalls } from './goals';

export interface PredictionResult {
  success: boolean;
  text: string;
  /** cueDirection: punto de contacto desde donde sale la blanca. */
  exitFrom?: Vec3;
  /** cueStop: posición final real. cueDirection: un punto 0,5 m adelante sobre la salida real. */
  actual?: Vec3;
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

export function evaluatePrediction(
  question: 'cueStop' | 'cueDirection', tolerance: number, tap: Vec3, tl: Timeline, g: TableGeometry, p: PhysicsParams,
): PredictionResult {
  if (question === 'cueStop') {
    const cue = finalBalls(tl, p).find((b) => b.id === 'cue')!;
    if (cue.motion === 'pocketed') return { success: false, text: 'La blanca terminó adentro de una tronera (scratch).', actual: cue.r };
    const dist = norm(sub(xy(tap), xy(cue.r))) / g.diamond;
    return dist <= tolerance
      ? { success: true, text: `¡Muy bien! Quedaste a ${fmt(dist)} diamantes.`, actual: cue.r }
      : { success: false, text: `Le erraste por ${fmt(dist)} diamantes.`, actual: cue.r };
  }

  const hitIdx = tl.events.findIndex((e) => e.kind === 'ballBall' && e.ids.includes('cue'));
  if (hitIdx < 0) return { success: false, text: 'En este tiro la blanca no tocó ninguna bola.' };
  const hit = tl.events[hitIdx];
  const from = hit.balls.find((b) => b.id === 'cue')!.r;
  const settle = tl.events.slice(hitIdx + 1).find((e) => e.ids[0] === 'cue' && e.kind !== 'ballBall') ?? hit;
  let v = settle.balls.find((b) => b.id === 'cue')!.v;
  if (norm(xy(v)) < 1e-6) v = hit.balls.find((b) => b.id === 'cue')!.v;
  if (norm(xy(v)) < 1e-6) {
    const near = norm(sub(xy(tap), xy(from))) / g.diamond <= 0.3;
    return { success: near, text: near ? '¡Bien! La blanca se queda casi quieta.' : 'La blanca se queda casi quieta en el contacto.', exitFrom: from, actual: from };
  }
  const exit = unit(xy(v));
  const actual = add(from, scale(exit, 0.5));
  const mine = unit(xy(sub(tap, from)));
  const err = (Math.acos(Math.max(-1, Math.min(1, dot(exit, mine)))) * 180) / Math.PI;
  return err <= tolerance
    ? { success: true, text: `¡Muy bien! Le erraste por ${Math.round(err)}°.`, exitFrom: from, actual }
    : { success: false, text: `Le erraste por ${Math.round(err)}°.`, exitFrom: from, actual };
}
