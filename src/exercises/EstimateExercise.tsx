import { useMemo, useState } from 'react';
import type { Exercise } from '../content/types';
import { layoutToBalls } from '../content/layout';
import { TableCanvas } from '../render/TableCanvas';
import { ghostGuides, type GuideDraw } from '../render/guides';
import { cutAngleDeg } from '../table/aim';
import type { ExerciseEnv } from './env';

type EstimateEx = Extract<Exercise, { kind: 'estimate' }>;

export function EstimateExercise({ exercise, env, onAnswer, onContinue }: {
  exercise: EstimateEx; env: ExerciseEnv; onAnswer: (success: boolean, detail: string) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const answer = exercise.answer;
  const balls = useMemo(() => layoutToBalls(exercise.setup, env.geometry, R), [exercise.setup, env.geometry, R]);
  const [choice, setChoice] = useState<number | null>(null);
  const [angle, setAngle] = useState(30);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  const reveal = exercise.target ?? (answer.kind === 'cutAngle' ? { ball: answer.ball, pocket: answer.pocket } : undefined);
  const correctAngle = useMemo(() => {
    if (answer.kind !== 'cutAngle') return null;
    const cue = balls.find((b) => b.id === 'cue')!;
    const ob = balls.find((b) => b.id === answer.ball)!;
    return cutAngleDeg(cue.r, ob.r, env.geometry.pocketCenters[answer.pocket], R);
  }, [answer, balls, env.geometry, R]);

  const guides = useMemo<GuideDraw[]>(() => {
    if (!result || !reveal) return [];
    const ob = balls.find((b) => b.id === reveal.ball);
    const cue = balls.find((b) => b.id === 'cue');
    return ob ? ghostGuides(ob.r, env.geometry.pocketCenters[reveal.pocket], cue?.r, R) : [];
  }, [result, reveal, balls, env.geometry, R]);

  const submit = () => {
    let success: boolean;
    let text: string;
    if (answer.kind === 'choice') {
      success = choice === answer.correct;
      text = success ? '¡Correcto!' : `No. La respuesta correcta es: «${answer.options[answer.correct]}».`;
    } else {
      const c = Math.round(correctAngle ?? 0);
      success = Math.abs(angle - (correctAngle ?? 0)) <= answer.toleranceDeg;
      text = `${success ? '¡Bien!' : 'Te alejaste.'} El corte es de ${c}° (dijiste ${angle}°).`;
    }
    setResult({ success, text });
    onAnswer(success, text);
  };

  return (
    <section className="exercise">
      <p className="prompt">{exercise.prompt}</p>
      <TableCanvas geometry={env.geometry} balls={balls} R={R} guides={guides} />
      {!result && answer.kind === 'choice' && (
        <div className="choices">
          {answer.options.map((o, i) => (
            <button key={i} type="button" className={choice === i ? 'choice selected' : 'choice'} aria-pressed={choice === i}
              data-testid={`choice-${i}`} onClick={() => setChoice(i)}>{o}</button>
          ))}
        </div>
      )}
      {!result && answer.kind === 'cutAngle' && (
        <label className="angle-input">
          <span>Ángulo estimado: <strong>{angle}°</strong></span>
          <input type="range" min={0} max={90} step={1} value={angle} data-testid="angle-slider" aria-label="Ángulo de corte estimado"
            onChange={(e) => setAngle(Number(e.target.value))} />
        </label>
      )}
      {!result && (
        <button type="button" className="primary big" disabled={answer.kind === 'choice' && choice === null}
          onClick={submit} data-testid="estimate-submit">Responder</button>
      )}
      {result && (
        <div className={result.success ? 'feedback ok' : 'feedback bad'} role="status" data-testid="estimate-feedback">
          <p>{result.text}</p>
          <p>{exercise.explanation}</p>
          <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">Continuar</button>
        </div>
      )}
    </section>
  );
}
