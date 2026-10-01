import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../content/types';
import { layoutToBalls } from '../content/layout';
import type { TableShot } from '../progress/types';
import { TableCanvas } from '../render/TableCanvas';
import type { GuideDraw } from '../render/guides';
import type { ExerciseEnv } from './env';

type RealEx = Extract<Exercise, { kind: 'realTable' }>;

function tendency(shots: TableShot[]): string | null {
  const fina = shots.filter((s) => s.miss === 'fina').length;
  const gruesa = shots.filter((s) => s.miss === 'gruesa').length;
  if (fina + gruesa < 2) return null;
  if (fina > gruesa * 1.5) return `Erraste ${fina} finas y ${gruesa} gruesas: tendés a cortar de más.`;
  if (gruesa > fina * 1.5) return `Erraste ${gruesa} gruesas y ${fina} finas: tendés a cortar de menos.`;
  return `Errores repartidos (${fina} finas, ${gruesa} gruesas): revisá la alineación y el golpe.`;
}

export function RealTableExercise({ exercise, env, onFinish, onContinue }: {
  exercise: RealEx; env: ExerciseEnv; onFinish: (shots: TableShot[]) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const balls = useMemo(() => layoutToBalls(exercise.setup, env.geometry, R), [exercise.setup, env.geometry, R]);
  const guides = useMemo<GuideDraw[]>(() => {
    const t = exercise.target;
    const ob = t && balls.find((b) => b.id === t.ball);
    return t && ob ? [{ kind: 'line', from: ob.r, to: env.geometry.pocketCenters[t.pocket], dashed: true }] : [];
  }, [exercise.target, balls, env.geometry]);

  const [shots, setShots] = useState<TableShot[]>([]);
  const [askMiss, setAskMiss] = useState(false);
  const [finished, setFinished] = useState(false);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => () => {
    if (!finishedRef.current && shotsRef.current.length > 0) {
      finishedRef.current = true;
      onFinishRef.current(shotsRef.current);
    }
  }, []);

  const finish = (list: TableShot[]) => {
    finishedRef.current = true;
    setFinished(true);
    onFinish(list);
  };
  const record = (s: TableShot) => {
    const list = [...shots, s];
    setShots(list);
    setAskMiss(false);
    if (list.length >= exercise.shots) finish(list);
  };
  const hits = shots.filter((s) => s.success).length;
  const advice = tendency(shots);

  return (
    <section className="exercise">
      <p className="prompt">{exercise.instructions}</p>
      <TableCanvas geometry={env.geometry} balls={balls} R={R} guides={guides} label="Ubicación de las bolas en la mesa real" />
      <ul className="positions">
        {exercise.setup.balls.map((b) => (
          <li key={b.id}>{b.id === 'cue' ? 'Blanca' : `Bola ${b.id}`}: diamante ({b.at.x}, {b.at.y})</li>
        ))}
      </ul>
      {!finished ? (
        <>
          <p className="counter" data-testid="real-counter">Tiro {shots.length + 1} de {exercise.shots} · {hits} adentro</p>
          {!askMiss ? (
            <div className="big-buttons">
              <button type="button" className="hit" aria-label="La metí" data-testid="real-hit" onClick={() => record({ success: true })}>✓</button>
              <button type="button" className="miss" aria-label="La erré" data-testid="real-miss"
                onClick={() => (exercise.diagnose ? setAskMiss(true) : record({ success: false }))}>✗</button>
            </div>
          ) : (
            <div className="miss-detail">
              <p>¿Cómo pasó la bola?</p>
              <button type="button" data-testid="miss-fina" onClick={() => record({ success: false, miss: 'fina' })}>Fina</button>
              <button type="button" data-testid="miss-gruesa" onClick={() => record({ success: false, miss: 'gruesa' })}>Gruesa</button>
              <button type="button" data-testid="miss-skip" onClick={() => record({ success: false })}>No sé</button>
            </div>
          )}
          {shots.length > 0 && (
            <button type="button" className="link" data-testid="real-finish" onClick={() => finish(shots)}>Terminar ahora</button>
          )}
        </>
      ) : (
        <div className="feedback ok" role="status" data-testid="real-summary">
          <p>Sesión guardada: {hits} de {shots.length} ({Math.round((100 * hits) / Math.max(1, shots.length))}%).</p>
          {advice && <p>{advice}</p>}
          <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">Continuar</button>
        </div>
      )}
    </section>
  );
}
