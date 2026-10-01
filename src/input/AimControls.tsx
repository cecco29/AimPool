import { DEFAULT_PARAMS } from '../physics/params';
import { type AimState, MAX_ELEVATION_DEG, powerLabel } from './aim';
import { SpinPad } from './SpinPad';

export function AimControls({ aim, onChange, disabled }: { aim: AimState; onChange: (a: AimState) => void; disabled?: boolean }) {
  const rotate = (deg: number) => onChange({ ...aim, azimuth: aim.azimuth + (deg * Math.PI) / 180 });
  const miscue = Math.hypot(aim.a, aim.b) > DEFAULT_PARAMS.miscueLimit;
  return (
    <div className="aim-controls">
      <div className="fine-tune" role="group" aria-label="Ajuste fino de dirección">
        <button type="button" onClick={() => rotate(-1)} disabled={disabled}>−1°</button>
        <button type="button" onClick={() => rotate(-0.1)} disabled={disabled} data-testid="fine-left">−0,1°</button>
        <button type="button" onClick={() => rotate(0.1)} disabled={disabled} data-testid="fine-right">+0,1°</button>
        <button type="button" onClick={() => rotate(1)} disabled={disabled}>+1°</button>
      </div>
      <div className="aim-row">
        <SpinPad a={aim.a} b={aim.b} onChange={(a, b) => onChange({ ...aim, a, b })} disabled={disabled} />
        <div className="sliders">
          <label>
            <span>Fuerza: <strong>{powerLabel(aim.power)}</strong></span>
            <input type="range" min={0} max={1} step={0.01} value={aim.power} aria-label="Fuerza" disabled={disabled}
              onChange={(e) => onChange({ ...aim, power: Number(e.target.value) })} />
          </label>
          <label>
            <span>Elevación del taco: {Math.round(aim.elevation)}°</span>
            <input type="range" min={0} max={MAX_ELEVATION_DEG} step={1} value={aim.elevation} aria-label="Elevación del taco" disabled={disabled}
              onChange={(e) => onChange({ ...aim, elevation: Number(e.target.value) })} />
          </label>
          <button type="button" className="link" onClick={() => onChange({ ...aim, a: 0, b: 0 })} disabled={disabled}>Centrar efecto</button>
        </div>
      </div>
      {miscue && <p className="warn" role="alert">Fuera del círculo rojo: riesgo de pifia (miscue).</p>}
    </div>
  );
}
