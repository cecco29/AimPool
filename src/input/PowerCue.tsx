import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react';
import { POWER_CANCEL, powerLabel, pullToPower } from './aim';

/**
 * Taco de fuerza: se tira hacia abajo para cargar y se suelta para tirar.
 * Soltar casi sin carga cancela.
 */
export function PowerCue({ travel = 200, onPowerChange, onShoot, onCancel, disabled }: {
  travel?: number;
  onPowerChange: (power: number) => void;
  onShoot: (power: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  const startY = useRef<number | null>(null);
  const [pull, setPullState] = useState(0);
  const pullRef = useRef(0);
  const setPull = (p: number) => { pullRef.current = p; setPullState(p); };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startY.current = e.clientY;
    setPull(0);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const p = pullToPower(e.clientY - startY.current, travel);
    setPull(p);
    onPowerChange(p);
  };
  const up = () => {
    if (startY.current === null) return;
    startY.current = null;
    const p = pullRef.current;
    setPull(0);
    if (p < POWER_CANCEL) onCancel?.();
    else onShoot(p);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const p = Math.min(1, Math.max(0, pullRef.current + (e.key === 'ArrowDown' ? 0.05 : -0.05)));
      setPull(p);
      onPowerChange(p);
    }
    if (e.key === 'Enter' && pullRef.current >= POWER_CANCEL) {
      onShoot(pullRef.current);
      setPull(0);
    }
  };

  return (
    <div
      className={`power-cue${disabled ? ' disabled' : ''}`}
      data-testid="power-cue"
      role="slider"
      tabIndex={0}
      aria-label="Fuerza: tirá el taco hacia abajo y soltá para tirar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pull * 100)}
      aria-valuetext={pull > 0 ? `${Math.round(pull * 100)}% (${powerLabel(pull)})` : 'sin cargar'}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { startY.current = null; setPull(0); onCancel?.(); }}
      onKeyDown={key}
    >
      <div className="power-fill" style={{ height: `${pull * 100}%` }} />
      <div className="power-stick" style={{ transform: `translateY(${pull * 60}%)` }} />
      <span className="power-label">{pull > 0 ? powerLabel(pull) : 'Tirá ↓'}</span>
    </div>
  );
}
