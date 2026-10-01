import type { PointerEvent } from 'react';
import { spinFromPoint } from './aim';

function spinText(a: number, b: number): string {
  if (Math.hypot(a, b) < 0.05) return 'centro';
  const parts: string[] = [];
  if (Math.abs(b) >= 0.05) parts.push(`${b > 0 ? 'arriba' : 'abajo'} ${Math.abs(b).toFixed(2)}`);
  if (Math.abs(a) >= 0.05) parts.push(`${a > 0 ? 'derecha' : 'izquierda'} ${Math.abs(a).toFixed(2)}`);
  return parts.join(', ');
}

export function SpinPad({ a, b, onChange, size = 112, disabled }: {
  a: number; b: number; onChange: (a: number, b: number) => void; size?: number; disabled?: boolean;
}) {
  const r = size / 2;
  const handle = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const [na, nb] = spinFromPoint(((e.clientX - rect.left) * size) / rect.width, ((e.clientY - rect.top) * size) / rect.height, size);
    onChange(na, nb);
  };
  return (
    <svg
      className="spin-pad"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="group"
      aria-label={`Punto de contacto en la blanca: ${spinText(a, b)}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); handle(e); }}
      onPointerMove={(e) => { if (e.buttons) handle(e); }}
    >
      <circle cx={r} cy={r} r={r - 1} fill="#f5f3ea" />
      <circle cx={r} cy={r} r={(r - 1) * 0.5} fill="none" stroke="#d62828" strokeDasharray="4 3" />
      <line x1={r} y1={4} x2={r} y2={size - 4} stroke="rgba(0,0,0,0.15)" />
      <line x1={4} y1={r} x2={size - 4} y2={r} stroke="rgba(0,0,0,0.15)" />
      <circle cx={r + a * (r - 1)} cy={r - b * (r - 1)} r={7} fill="#2c6fb5" />
    </svg>
  );
}
