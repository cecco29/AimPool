import { type KeyboardEvent, type PointerEvent, useRef } from 'react';
import { wheelDelta } from './aim';

const KEY_STEP_DEG = 0.1;

/** Rueda de ajuste fino: deslizar el pulgar de costado gira el taco 0,02° por píxel. */
export function FineWheel({ azimuth, onRotate, disabled }: {
  azimuth: number; onRotate: (deltaRad: number) => void; disabled?: boolean;
}) {
  const lastX = useRef<number | null>(null);
  const deg = (((azimuth * 180) / Math.PI) % 360 + 360) % 360;

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    lastX.current = e.clientX;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (lastX.current === null) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    if (dx !== 0) onRotate(wheelDelta(dx));
  };
  const up = () => { lastX.current = null; };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = (KEY_STEP_DEG * Math.PI) / 180;
    if (e.key === 'ArrowRight') onRotate(step);
    if (e.key === 'ArrowLeft') onRotate(-step);
  };

  return (
    <div
      className="fine-wheel"
      data-testid="fine-wheel"
      role="slider"
      tabIndex={0}
      aria-label="Ajuste fino de dirección"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Number(deg.toFixed(1))}
      aria-valuetext={`${deg.toFixed(1)}°`}
      style={{ backgroundPositionX: `${-deg * 50}px` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      <span className="fine-wheel-value">{deg.toFixed(1)}°</span>
    </div>
  );
}
