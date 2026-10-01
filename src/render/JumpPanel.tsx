import { useEffect, useMemo, useRef } from 'react';
import type { Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';
import type { Vec3 } from '../physics/vec';

/** Vista lateral (distancia recorrida vs. altura) de una bola; solo se muestra si la bola vuela. */
export function JumpPanel({ timeline, ballId, p }: { timeline: Timeline; ballId: string; p: PhysicsParams }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const samples = useMemo(() => {
    const pts: { d: number; h: number }[] = [];
    const end = Math.min(timeline.duration, 3);
    let prev: Vec3 | null = null;
    let dist = 0;
    for (let i = 0; i <= 160; i++) {
      const b = stateAt(timeline, (end * i) / 160, p).find((x) => x.id === ballId);
      if (!b) break;
      if (prev) dist += Math.hypot(b.r[0] - prev[0], b.r[1] - prev[1]);
      prev = b.r;
      pts.push({ d: dist, h: Math.max(0, b.r[2] - p.R) });
    }
    return pts;
  }, [timeline, ballId, p]);
  const maxH = Math.max(0, ...samples.map((s) => s.h));
  const maxD = Math.max(0.01, ...samples.map((s) => s.d));

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || maxH < 0.001) return;
    const W = 320;
    const H = 90;
    const ground = H - 8;
    const sy = (ground - 8) / Math.max(maxH, 0.06);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.lineTo(W, ground);
    ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = (s.d / maxD) * (W - 8) + 4;
      const y = ground - s.h * sy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [samples, maxH, maxD]);

  if (maxH < 0.001) return null;
  return (
    <figure className="jump-panel">
      <canvas ref={ref} width={320} height={90} aria-label="Vista lateral del salto" />
      <figcaption>Vista lateral: la blanca subió hasta {Math.round(maxH * 1000)} mm.</figcaption>
    </figure>
  );
}
