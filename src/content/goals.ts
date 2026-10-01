import type { Ball, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';
import { dot, norm, sub, unit, type Vec3, xy } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import type { ShotGoal } from './types';

export interface GoalResult { success: boolean; messages: string[]; miss?: 'fina' | 'gruesa' }

export function finalBalls(tl: Timeline, p: PhysicsParams): Ball[] {
  return tl.truncated ? stateAt(tl, tl.duration, p) : tl.events[tl.events.length - 1].balls;
}

const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(unit(xy(a)), unit(xy(b))))));

/** Compara el corte real con el necesario en el primer contacto blanca → bola. */
export function diagnoseCut(tl: Timeline, ballId: string, target: Vec3, p: PhysicsParams): 'fina' | 'gruesa' | undefined {
  const ev = tl.events.find((e) => e.kind === 'ballBall' && e.ids.includes('cue') && e.ids.includes(ballId));
  if (!ev) return undefined;
  const cueBefore = stateAt(tl, ev.t - 1e-9, p).find((b) => b.id === 'cue')!;
  const obAfter = ev.balls.find((b) => b.id === ballId)!;
  const actual = angle(cueBefore.v, obAfter.v);
  const needed = angle(cueBefore.v, sub(target, obAfter.r));
  if (Math.abs(actual - needed) < (0.3 * Math.PI) / 180) return undefined;
  return actual > needed ? 'fina' : 'gruesa';
}

export function evaluateGoal(goal: ShotGoal, tl: Timeline, g: TableGeometry, p: PhysicsParams): GoalResult {
  const end = finalBalls(tl, p);
  const cue = end.find((b) => b.id === 'cue');
  const messages: string[] = [];
  let success = true;
  let miss: GoalResult['miss'];

  if (tl.miscue) {
    success = false;
    messages.push('Pifia (miscue): le pegaste demasiado lejos del centro de la blanca.');
  }
  if (cue?.motion === 'pocketed' && !goal.allowScratch) {
    success = false;
    messages.push('La blanca entró (scratch).');
  }
  if (goal.pocketBall) {
    const { ball, pocket } = goal.pocketBall;
    const ob = end.find((b) => b.id === ball);
    if (!ob || ob.motion !== 'pocketed') {
      success = false;
      messages.push(`La bola ${ball} no entró.`);
      if (!tl.events.some((e) => e.kind === 'ballBall' && e.ids.includes('cue') && e.ids.includes(ball))) {
        messages.push(`La blanca no tocó la bola ${ball}.`);
      } else if (pocket) {
        miss = diagnoseCut(tl, ball, g.pocketCenters[pocket], p);
        if (miss === 'fina') messages.push('Pasó fina: cortaste de más.');
        if (miss === 'gruesa') messages.push('Pasó gruesa: cortaste de menos.');
      }
    } else if (pocket && ob.pocket !== pocket) {
      success = false;
      messages.push(`La bola ${ball} entró, pero en otra tronera.`);
    }
  }
  if (goal.cueBallZone && cue && cue.motion !== 'pocketed') {
    const c = goal.cueBallZone.center;
    const dist = norm(sub(xy(cue.r), [c.x * g.diamond, c.y * g.diamond, 0])) / g.diamond;
    if (dist > goal.cueBallZone.radius) {
      success = false;
      messages.push('La blanca quedó fuera de la zona marcada.');
    }
  }
  if (success) messages.unshift('¡Bien! Objetivo cumplido.');
  return { success, messages, miss };
}
