import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Ball } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import { drawScene } from './draw';
import type { GuideDraw } from './guides';
import { fitViewport, screenToWorld } from './viewport';

export interface TableCanvasProps {
  geometry: TableGeometry;
  balls: Ball[];
  R: number;
  guides?: GuideDraw[];
  onPointer?: (p: Vec3, phase: 'down' | 'move' | 'up') => void;
  label?: string;
}

const NO_GUIDES: GuideDraw[] = [];

export function TableCanvas({ geometry, balls, R, guides = NO_GUIDES, onPointer, label = 'Mesa de pool' }: TableCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vp = useMemo(() => fitViewport(size.w, size.h, geometry.length, geometry.width), [size, geometry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    drawScene(ctx, geometry, vp, balls, guides, R);
  }, [size, vp, geometry, balls, guides, R]);

  const toWorld = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return screenToWorld(vp, e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div ref={wrapRef} className="table-wrap">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        style={{ width: '100%', height: '100%', touchAction: onPointer ? 'none' : 'auto', display: 'block' }}
        onPointerDown={onPointer && ((e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          onPointer(toWorld(e), 'down');
        })}
        onPointerMove={onPointer && ((e) => { if (dragging.current) onPointer(toWorld(e), 'move'); })}
        onPointerUp={onPointer && ((e) => {
          dragging.current = false;
          onPointer(toWorld(e), 'up');
        })}
      />
    </div>
  );
}
