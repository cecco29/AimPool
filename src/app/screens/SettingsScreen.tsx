import type { ChangeEvent } from 'react';
import type { TableSize } from '../../table/geometry';
import { useProgress } from '../ProgressContext';
import { TopBar } from '../components/TopBar';

export function SettingsScreen() {
  const { settings, updateSettings, persistent } = useProgress();
  const num = (min: number, max: number, apply: (v: number) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= min && v <= max) apply(v);
  };
  return (
    <div className="screen">
      <TopBar title="Ajustes" back={{ name: 'home' }} />
      <label className="field">
        Tamaño de mesa
        <select value={settings.tableSize} data-testid="table-size" onChange={(e) => updateSettings({ tableSize: e.target.value as TableSize })}>
          <option value="9ft">9 pies (torneo)</option>
          <option value="8ft">8 pies</option>
          <option value="7ft">7 pies (bar)</option>
        </select>
      </label>
      <label className="field">
        Boca de tronera de esquina (pulgadas)
        <input type="number" min={4} max={5.5} step={0.125} defaultValue={settings.cornerMouthIn} onChange={num(4, 5.5, (v) => updateSettings({ cornerMouthIn: v }))} />
      </label>
      <label className="field">
        Boca de tronera del medio (pulgadas)
        <input type="number" min={4.5} max={6} step={0.125} defaultValue={settings.sideMouthIn} onChange={num(4.5, 6, (v) => updateSettings({ sideMouthIn: v }))} />
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.ignoreLocks} onChange={(e) => updateSettings({ ignoreLocks: e.target.checked })} />
        Desbloquear todas las lecciones
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.showGuidesByDefault} onChange={(e) => updateSettings({ showGuidesByDefault: e.target.checked })} />
        Mostrar guías (bola fantasma) en los diagramas de teoría
      </label>
      <p className="muted">{persistent ? 'Tu progreso se guarda en este dispositivo.' : 'Atención: el progreso no se está guardando en este navegador.'}</p>
    </div>
  );
}
