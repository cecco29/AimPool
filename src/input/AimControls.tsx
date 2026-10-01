import { DEFAULT_PARAMS } from '../physics/params';
import { type AimState, MAX_ELEVATION_DEG } from './aim';
import { FineWheel } from './FineWheel';
import { SpinPad } from './SpinPad';

/** Controles debajo de la mesa: rueda fina de dirección, efecto y elevación. La fuerza va en el taco (PowerCue). */
export function AimControls({ aim, onChange, disabled }: { aim: AimState; onChange: (a: AimState) => void; disabled?: boolean }) {
  const miscue = Math.hypot(aim.a, aim.b) > DEFAULT_PARAMS.miscueLimit;
  return (
    <div className="aim-controls">
      <FineWheel azimuth={aim.azimuth} disabled={disabled} onRotate={(d) => onChange({ ...aim, azimuth: aim.azimuth + d })} />
      <div className="aim-row">
        <SpinPad a={aim.a} b={aim.b} size={84} onChange={(a, b) => onChange({ ...aim, a, b })} disabled={disabled} />
        <div className="sliders">
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
