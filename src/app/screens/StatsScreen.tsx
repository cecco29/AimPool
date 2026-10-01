import { orderedLessons } from '../../content/curriculum';
import { computeStreak } from '../../progress/stats';
import type { TableSession } from '../../progress/types';
import { pct, STATUS_LABEL } from '../format';
import { useProgress } from '../ProgressContext';
import { TopBar } from '../components/TopBar';

function SessionBars({ sessions }: { sessions: TableSession[] }) {
  const W = 300;
  const H = 120;
  const bw = W / sessions.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label="Porcentaje de acierto de las últimas sesiones en la mesa real">
      <line x1={0} y1={H - H * 0.6} x2={W} y2={H - H * 0.6} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
      {sessions.map((s, i) => {
        const rate = s.shots.length ? s.shots.filter((x) => x.success).length / s.shots.length : 0;
        const h = Math.max(2, rate * H);
        return (
          <g key={s.id}>
            <rect x={i * bw + 4} y={H - h} width={bw - 8} height={h} rx={3} fill={rate >= 0.6 ? '#3ccf8e' : '#ffd166'} />
            <text x={i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="#9bb0a8">{Math.round(rate * 100)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatsScreen() {
  const { attempts, sessions, stats, status } = useProgress();
  const streak = computeStreak([...attempts.map((a) => a.createdAt), ...sessions.map((s) => s.endedAt)], Date.now());
  const recent = [...sessions].sort((a, b) => a.endedAt - b.endedAt).slice(-10);
  return (
    <div className="screen">
      <TopBar title="Estadísticas" back={{ name: 'home' }} />
      <p>Racha actual: <strong>{streak}</strong> {streak === 1 ? 'día' : 'días'}</p>
      <table className="stats-table">
        <thead><tr><th>Lección</th><th>Simulador</th><th>Mesa real</th><th>Estado</th></tr></thead>
        <tbody>
          {orderedLessons().map((l) => {
            const s = stats(l);
            return (
              <tr key={l.id}>
                <td>{l.title}</td>
                <td>{pct(s.simRate)} <small>({s.simAttempts})</small></td>
                <td>{pct(s.tableRate)} <small>({s.tableShots})</small></td>
                <td>{STATUS_LABEL[status(l)]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2 className="level">Últimas sesiones en la mesa real</h2>
      {recent.length === 0 ? <p className="muted">Todavía no registraste sesiones. La línea punteada marca el 60 % para aprobar.</p> : <SessionBars sessions={recent} />}
    </div>
  );
}
