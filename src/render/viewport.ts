import type { Vec3 } from '../physics/vec';

/** Madera de banda que se dibuja por fuera de la nariz (m). */
export const RAIL_WIDTH = 0.12;

export interface Viewport { scale: number; ox: number; oy: number; portrait: boolean; length: number; width: number }

/** Ajusta mesa + bandas al contenedor. En vertical la cabecera (x = 0) queda abajo. */
export function fitViewport(cssW: number, cssH: number, length: number, width: number): Viewport {
  const portrait = cssH > cssW;
  const spanX = (portrait ? width : length) + 2 * RAIL_WIDTH;
  const spanY = (portrait ? length : width) + 2 * RAIL_WIDTH;
  const scale = Math.max(1e-6, Math.min(cssW / spanX, cssH / spanY));
  const ox = (cssW - spanX * scale) / 2 + RAIL_WIDTH * scale;
  const oy = (cssH - spanY * scale) / 2 + RAIL_WIDTH * scale;
  return { scale, ox, oy, portrait, length, width };
}

export function worldToScreen(vp: Viewport, p: Vec3): [number, number] {
  if (vp.portrait) return [vp.ox + (vp.width - p[1]) * vp.scale, vp.oy + (vp.length - p[0]) * vp.scale];
  return [vp.ox + p[0] * vp.scale, vp.oy + (vp.width - p[1]) * vp.scale];
}

export function screenToWorld(vp: Viewport, sx: number, sy: number): Vec3 {
  if (vp.portrait) return [vp.length - (sy - vp.oy) / vp.scale, vp.width - (sx - vp.ox) / vp.scale, 0];
  return [(sx - vp.ox) / vp.scale, vp.width - (sy - vp.oy) / vp.scale, 0];
}
