import type { Shot } from '../physics/types';
import type { Vec3 } from '../physics/vec';

export interface AimState {
  azimuth: number; // rad
  elevation: number; // grados (UI)
  a: number; // efecto lateral normalizado (+ derecha)
  b: number; // efecto vertical normalizado (+ arriba)
  power: number; // 0..1
}

export const DEFAULT_AIM: AimState = { azimuth: 0, elevation: 0, a: 0, b: 0, power: 0.5 };
/** Se deja pasar el límite de miscue (0,5) para que el jugador aprenda qué pasa. */
export const MAX_SPIN = 0.6;
export const MAX_ELEVATION_DEG = 60;

export function clampSpin(a: number, b: number, limit = MAX_SPIN): [number, number] {
  const r = Math.hypot(a, b);
  return r <= limit ? [a, b] : [(a * limit) / r, (b * limit) / r];
}

/** Punto tocado en la bola-diagrama (px desde su esquina superior izquierda) → (a, b). */
export function spinFromPoint(x: number, y: number, size: number): [number, number] {
  const r = size / 2;
  return clampSpin((x - r) / r, (r - y) / r);
}

/** Curva 1,5: la parte baja del slider sigue siendo útil para tiros suaves (0,3–6 m/s de taco). */
export const powerToCueSpeed = (power: number): number => 0.3 + 5.7 * power ** 1.5;

export const powerLabel = (power: number): string => (power < 0.34 ? 'suave' : power < 0.67 ? 'media' : 'fuerte');

export const aimToShot = (aim: AimState, cueBallId = 'cue'): Shot => ({
  cueBallId,
  azimuth: aim.azimuth,
  elevation: (aim.elevation * Math.PI) / 180,
  a: aim.a,
  b: aim.b,
  cueSpeed: powerToCueSpeed(aim.power),
});

/** Ganancia del arrastre relativo: rad de giro por metro de mesa recorrido de costado (~0,25°/px en un celu). */
export const DRAG_GAIN = 1;
/** Rueda de ajuste fino: grados por píxel. */
export const WHEEL_DEG_PER_PX = 0.02;
/** Por debajo de esta carga, soltar el taco cancela el tiro. */
export const POWER_CANCEL = 0.03;

/** Giro relativo: solo cuenta el desplazamiento del dedo perpendicular a la línea de tiro (+ = antihorario). */
export function relativeAimDelta(azimuth: number, from: Vec3, to: Vec3, gain = DRAG_GAIN): number {
  const px = -Math.sin(azimuth);
  const py = Math.cos(azimuth);
  return ((to[0] - from[0]) * px + (to[1] - from[1]) * py) * gain;
}

export const wheelDelta = (dxPx: number): number => (dxPx * WHEEL_DEG_PER_PX * Math.PI) / 180;

export const pullToPower = (pullPx: number, travelPx: number): number => Math.min(1, Math.max(0, pullPx / travelPx));
