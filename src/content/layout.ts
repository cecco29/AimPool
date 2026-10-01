import type { Ball } from '../physics/types';
import { ZERO } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import type { BallLayout, VariationSpec } from './types';

/** Convierte diamantes a metros. Recorta a [R, L−R] para que una bola "pegada a la banda" no la atraviese en mesas chicas. */
export function layoutToBalls(layout: BallLayout, g: TableGeometry, R: number): Ball[] {
  const clamp = (v: number, max: number) => Math.min(max - R, Math.max(R, v));
  return layout.balls.map(({ id, at }) => ({
    id,
    r: [clamp(at.x * g.diamond, g.length), clamp(at.y * g.diamond, g.width), R],
    v: ZERO,
    w: ZERO,
    motion: 'stationary',
  }));
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Separación mínima en diamantes, válida en la mesa más chica (7 pies) con margen. */
const MIN_SEPARATION = 0.25;

export function applyVariation(layout: BallLayout, variation: VariationSpec | undefined, rng: () => number): BallLayout {
  if (!variation || variation.jitter <= 0) return layout;
  for (let attempt = 0; attempt < 10; attempt++) {
    const balls = layout.balls.map((b) => {
      if (!variation.balls.includes(b.id)) return b;
      const x = Math.min(7.8, Math.max(0.2, b.at.x + (rng() * 2 - 1) * variation.jitter));
      const y = Math.min(3.8, Math.max(0.2, b.at.y + (rng() * 2 - 1) * variation.jitter));
      return { ...b, at: { x, y } };
    });
    const ok = balls.every((a, i) => balls.every((b, j) => j <= i || Math.hypot(a.at.x - b.at.x, a.at.y - b.at.y) >= MIN_SEPARATION));
    if (ok) return { balls };
  }
  return layout;
}
