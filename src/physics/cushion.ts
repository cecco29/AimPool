import type { Ball } from './types';
import type { PhysicsParams } from './params';
import { slip } from './motion';
import { add, cross, dot, norm, scale, sub, unit, type Vec3, xy, Z } from './vec';

/** Banda: modelo de impulso de Han 2005 tal como lo implementa pooltool (§5.1). */
export function resolveCushion(ball: Ball, nIntoTable: Vec3, p: PhysicsParams): Ball {
  const X = scale(unit(xy(nIntoTable)), -1);
  const Y = cross(Z, X);
  const toLocal = (v: Vec3): Vec3 => [dot(v, X), dot(v, Y), v[2]];
  const fromLocal = (l: Vec3): Vec3 => add(add(scale(X, l[0]), scale(Y, l[1])), [0, 0, l[2]]);

  const [vx, vy, vz] = toLocal(ball.v);
  const [wx, wy, wz] = toLocal(ball.w);
  const { R, m } = p;
  const I = 0.4 * m * R * R;
  const thA = Math.asin(p.cushionHeight / R - 1);
  const sinA = Math.sin(thA);
  const cosA = Math.cos(thA);

  const sx = vx * sinA - vz * cosA + R * wy;
  const sy = -vy - R * wz * cosA + R * wx * sinA;
  const c = -vx * cosA;
  const A = 7 / (2 * m);
  const B = 1 / m;
  const PzE = (-(1 + p.eCushion) * c) / B;
  const s = Math.hypot(sx, sy);
  const PzS = s / A;
  let PxE: number;
  let PyE: number;
  if (PzS <= p.muCushion * PzE) {
    PxE = sx / A;
    PyE = sy / A;
  } else {
    PxE = (p.muCushion * PzE * sx) / s;
    PyE = (p.muCushion * PzE * sy) / s;
  }
  const PX = -PxE * sinA - PzE * cosA;
  const PY = PyE;
  const PZ = PxE * cosA - PzE * sinA;

  const vLocal: Vec3 = [vx + PX / m, vy + PY / m, vz];
  const wLocal: Vec3 = [
    wx - (R / I) * PY * sinA,
    wy + (R / I) * (PX * sinA - PZ * cosA),
    wz + (R / I) * PY * cosA,
  ];
  return { ...ball, v: fromLocal(vLocal), w: fromLocal(wLocal) };
}

/** Rebote contra el paño: restitución normal + fricción de Coulomb limitada al no-slip (§6). */
export function resolveTable(ball: Ball, p: PhysicsParams): Ball {
  const jn = (1 + p.eTable) * Math.abs(Math.min(0, ball.v[2]));
  let vz = -p.eTable * Math.min(0, ball.v[2]);
  let v: Vec3 = xy(ball.v);
  let w = ball.w;
  const u = slip(ball, p.R);
  const s = norm(u);
  if (s > 1e-12 && jn > 0) {
    const mag = Math.min(p.muSlide * jn, (2 / 7) * s);
    const d = scale(u, -mag / s);
    v = add(v, d);
    w = sub(w, scale(cross(Z, d), 5 / (2 * p.R)));
  }
  if ((vz * vz) / (2 * p.g) < p.minBounceHeight) vz = 0;
  return { ...ball, r: [ball.r[0], ball.r[1], p.R], v: [v[0], v[1], vz], w };
}
