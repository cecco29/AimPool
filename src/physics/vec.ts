export type Vec3 = readonly [number, number, number];

export const ZERO: Vec3 = [0, 0, 0];
export const Z: Vec3 = [0, 0, 1];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: Vec3): Vec3 => {
  const n = norm(a);
  return n < 1e-12 ? ZERO : scale(a, 1 / n);
};
export const xy = (a: Vec3): Vec3 => [a[0], a[1], 0];
export const rotZ = (a: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * a[0] - s * a[1], s * a[0] + c * a[1], a[2]];
};
export const angleXY = (a: Vec3): number => Math.atan2(a[1], a[0]);
