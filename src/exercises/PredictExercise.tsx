import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../content/types';
import { layoutToBalls } from '../content/layout';
import { resolveShotSpec } from '../content/shotSpec';
import { evaluatePrediction, type PredictionResult } from '../content/predict';
import type { Timeline } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import { TableCanvas } from '../render/TableCanvas';
import { firstContact, type GuideDraw, samplePath } from '../render/guides';
import { usePlayback } from '../render/usePlayback';
import { simulateAsync } from '../sim/client';
import type { ExerciseEnv } from './env';

type PredictEx = Extract<Exercise, { kind: 'predict' }>;

export function PredictExercise({ exercise, env, onAnswer, onContinue }: {
  exercise: PredictEx; env: ExerciseEnv; onAnswer: (success: boolean, detail: string) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const balls = useMemo(() => layoutToBalls(exercise.setup, env.geometry, R), [exercise.setup, env.geometry, R]);
  const shot = useMemo(() => resolveShotSpec(exercise.shot, balls, env.geometry, R), [exercise.shot, balls, env.geometry, R]);
  const cue = balls.find((b) => b.id === 'cue')!;
  const [tap, setTap] = useState<Vec3 | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const playback = usePlayback(timeline, env.params);

  const guides = useMemo<GuideDraw[]>(() => {
    const out: GuideDraw[] = [];
    if (!timeline) {
      const contact = firstContact(cue, shot.azimuth, balls, env.geometry.length, env.geometry.width, R);
      out.push({ kind: 'line', from: cue.r, to: contact.point, dashed: true, color: 'rgba(255,209,102,0.85)' });
      out.push({ kind: 'cue', at: cue.r, azimuth: shot.azimuth });
    } else if (!playback.playing) {
      out.push({ kind: 'path', points: samplePath(timeline, 'cue', env.params), color: 'rgba(255,255,255,0.8)' });
      if (result?.actual) out.push({ kind: 'marker', at: result.actual, color: '#3ccf8e' });
    }
    if (tap) out.push({ kind: 'marker', at: tap });
    return out;
  }, [timeline, playback.playing, tap, result, cue, shot.azimuth, balls, env.geometry, env.params, R]);

  const check = async () => {
    if (!tap) return;
    setBusy(true);
    setError(null);
    try {
      const tl = await simulateAsync(balls, shot, env.tableSpec, env.params);
      if (!alive.current) return;
      const r = evaluatePrediction(exercise.question, exercise.tolerance, tap, tl, env.geometry, env.params);
      setTimeline(tl);
      setResult(r);
      onAnswer(r.success, r.text);
    } catch (err) {
      console.error('[PredictExercise]', err);
      if (alive.current) setError('No se pudo simular el tiro. Probá de nuevo.');
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  return (
    <section className="exercise">
      <p className="prompt">{exercise.prompt}</p>
      <TableCanvas geometry={env.geometry} balls={playback.balls ?? balls} R={R} guides={guides}
        onPointer={!timeline && !busy ? (p, phase) => { if (phase === 'down') setTap(p); } : undefined}
        label="Mesa: tocá para marcar tu predicción" />
      {!timeline && (
        <p className="hint">
          {tap ? 'Podés tocar de nuevo para mover la marca.' : 'Tocá la mesa para marcar tu predicción.'} La línea punteada muestra hacia dónde se tira.
        </p>
      )}
      {error && <p className="warn" role="alert">{error}</p>}
      {!timeline && (
        <button type="button" className="primary big" disabled={!tap || busy} onClick={() => { void check(); }} data-testid="predict-submit">
          {busy ? 'Calculando…' : 'Comprobar'}
        </button>
      )}
      {timeline && playback.playing && (
        <button type="button" onClick={playback.skip} data-testid="skip-playback">Saltar animación</button>
      )}
      {timeline && !playback.playing && result && (
        <div className={result.success ? 'feedback ok' : 'feedback bad'} role="status" data-testid="predict-result">
          <p>{result.text}</p>
          <p>{exercise.explanation}</p>
          <p className="muted">La cruz amarilla es tu marca; la verde muestra lo que pasó de verdad.</p>
          <div className="row">
            <button type="button" onClick={() => setTimeline({ ...timeline })} data-testid="replay">Ver de nuevo</button>
            <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">Continuar</button>
          </div>
        </div>
      )}
    </section>
  );
}
