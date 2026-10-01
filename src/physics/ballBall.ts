import type { Ball } from './types';
import { ballBallFriction, type PhysicsParams } from './params';
import { add, cross, dot, norm, scale, sub, unit, xy } from './vec';

/** Choque instantáneo inelástico con fricción entre bolas de igual masa (§4.1). */
export function resolveBallBall(b1: Ball, b2: Ball, p: PhysicsParams): [Ball, Ball] {
  // Sobre el paño el choque es plano: sin esto la fricción con efecto vertical hunde una bola en la pizarra.
  const planar = b1.motion !== 'airborne' && b2.motion !== 'airborne';
  const n = unit(planar ? xy(sub(b2.r, b1.r)) : sub(b2.r, b1.r));
  const e = p.eBall;
  const v1n = dot(b1.v, n);
  const v2n = dot(b2.v, n);
  const v1nAfter = 0.5 * ((1 - e) * v1n + (1 + e) * v2n);
  const v2nAfter = 0.5 * ((1 + e) * v1n + (1 - e) * v2n);
  const jn = Math.abs(v1nAfter - v1n);

  let v1 = add(b1.v, scale(n, v1nAfter - v1n));
  let v2 = add(b2.v, scale(n, v2nAfter - v2n));
  let w1 = b1.w;
  let w2 = b2.w;

  // Velocidad relativa de los puntos de contacto (bola 1 en +R n̂, bola 2 en −R n̂), parte tangencial.
  const u = sub(add(b1.v, scale(cross(b1.w, n), p.R)), sub(b2.v, scale(cross(b2.w, n), p.R)));
  const ut3 = sub(u, scale(n, dot(u, n)));
  const ut = planar ? xy(ut3) : ut3;
  const s = norm(ut);
  if (s > 1e-12) {
    const mag = Math.min(ballBallFriction(p, s) * jn, s / 7);
    const d = scale(ut, -mag / s);
    const dw = scale(cross(n, d), 5 / (2 * p.R));
    v1 = add(v1, d);
    v2 = sub(v2, d);
    w1 = add(w1, dw);
    w2 = add(w2, dw);
  }
  return [
    { ...b1, v: v1, w: w1 },
    { ...b2, v: v2, w: w2 },
  ];
}
