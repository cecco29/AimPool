import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../content/types';
import { applyVariation, layoutToBalls } from '../content/layout';
import { evaluateGoal, type GoalResult } from '../content/goals';
import type { Timeline } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import { TableCanvas } from '../render/TableCanvas';
import { firstContact, ghostGuides, type GuideDraw } from '../render/guides';
import { usePlayback } from '../render/usePlayback';
import { JumpPanel } from '../render/JumpPanel';
import { AimControls } from '../input/AimControls';
import { PowerCue } from '../input/PowerCue';
import { type AimState, aimToShot, DEFAULT_AIM, powerLabel, relativeAimDelta } from '../input/aim';
import { simulateAsync } from '../sim/client';
import { azimuthTo } from '../table/aim';
import type { ExerciseEnv } from './env';

type SimEx = Extract<Exercise, { kind: 'simShot' }>;

export function SimShotExercise({ exercise, env, onAttempt, onContinue }: {
  exercise: SimEx; env: ExerciseEnv; onAttempt: (success: boolean, detail: string) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const [round, setRound] = useState(0);
  const layout = useMemo(() => applyVariation(exercise.setup, exercise.variation, Math.random), [exercise, round]);
  const initial = useMemo(() => layoutToBalls(layout, env.geometry, R), [layout, env.geometry, R]);
  const cue = initial.find((b) => b.id === 'cue')!;
  const targetId = exercise.goal.pocketBall?.ball;
  const pocket = exercise.goal.pocketBall?.pocket;

  const [aim, setAim] = useState<AimState>(DEFAULT_AIM);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [result, setResult] = useState<GoalResult | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playback = usePlayback(timeline, env.params);
  const [charge, setCharge] = useState<number | null>(null);
  const lastDrag = useRef<Vec3 | null>(null);

  useEffect(() => {
    const c = initial.find((b) => b.id === 'cue')!;
    const ob = initial.find((b) => b.id === targetId);
    setAim((a) => ({ ...a, azimuth: ob ? azimuthTo(c.r, ob.r) : 0 }));
  }, [initial, targetId]);

  const aiming = !timeline && !busy;
  const guides = useMemo<GuideDraw[]>(() => {
    if (!aiming) return [];
    const out: GuideDraw[] = [];
    const ob = initial.find((b) => b.id === targetId);
    if (exercise.showGuides.ghostBall && ob && pocket) out.push(...ghostGuides(ob.r, env.geometry.pocketCenters[pocket], undefined, R));
    const contact = firstContact(cue, aim.azimuth, initial, env.geometry.length, env.geometry.width, R);
    if (exercise.showGuides.aimLine) out.push({ kind: 'line', from: cue.r, to: contact.point, color: 'rgba(255,209,102,0.85)' });
    if (exercise.showGuides.contactPreview && contact.ballId) out.push({ kind: 'ghost', at: contact.point, color: 'rgba(255,209,102,0.9)' });
    out.push({ kind: 'cue', at: cue.r, azimuth: aim.azimuth, pull: charge ?? 0 });
    return out;
  }, [aiming, initial, targetId, pocket, exercise.showGuides, cue, aim.azimuth, env.geometry, R, charge]);

  const shoot = async (power = aim.power) => {
    setCharge(null);
    setAim((a) => ({ ...a, power }));
    setBusy(true);
    setError(null);
    try {
      const tl = await simulateAsync(initial, aimToShot({ ...aim, power }), env.tableSpec, env.params);
      const res = evaluateGoal(exercise.goal, tl, env.geometry, env.params);
      setResult(res);
      setResults((r) => [...r, res.success]);
      setTimeline(tl);
      onAttempt(res.success, res.messages.join(' '));
    } catch (err) {
      console.error('[SimShotExercise]', err);
      setError('No se pudo simular el tiro. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const nextShot = () => {
    setTimeline(null);
    setResult(null);
    setRound((r) => r + 1);
  };
  // Arrastre relativo: el taco gira según el movimiento de costado del dedo, sin saltar a donde está el dedo.
  const onPointer = (p: Vec3, phase: 'down' | 'move' | 'up') => {
    if (phase === 'down') lastDrag.current = p;
    else if (phase === 'move' && lastDrag.current) {
      const from = lastDrag.current;
      lastDrag.current = p;
      setAim((a) => ({ ...a, azimuth: a.azimuth + relativeAimDelta(a.azimuth, from, p) }));
    } else lastDrag.current = null;
  };
  const hits = results.filter(Boolean).length;
  const shotNumber = Math.min(results.length + (timeline ? 0 : 1), exercise.attempts);

  return (
    <section className="exercise">
      <p className="prompt">{exercise.prompt}</p>
      <p className="counter">Tiro {shotNumber} de {exercise.attempts} · {hits} adentro</p>
      <div className="table-row">
        <TableCanvas geometry={env.geometry} balls={playback.balls ?? initial} R={R} guides={guides}
          onPointer={aiming ? onPointer : undefined} label="Mesa: arrastrá de costado para girar el taco" />
        <PowerCue disabled={!aiming} onPowerChange={setCharge} onShoot={(p) => { void shoot(p); }} onCancel={() => setCharge(null)} />
      </div>
      {aiming && <p className="hint">Arrastrá de costado sobre la mesa para girar el taco · tirá del taco hacia abajo y soltá para tirar.</p>}
      {timeline && <JumpPanel timeline={timeline} ballId="cue" p={env.params} />}
      {error && <p className="warn" role="alert">{error}</p>}
      {aiming && (
        <>
          <AimControls aim={aim} onChange={setAim} />
          <button type="button" className="shoot-small" onClick={() => { void shoot(); }} data-testid="shoot">Tirar con la última fuerza ({powerLabel(aim.power)})</button>
        </>
      )}
      {busy && <p className="muted">Calculando el tiro…</p>}
      {timeline && playback.playing && (
        <button type="button" onClick={playback.skip} data-testid="skip-playback">Saltar animación</button>
      )}
      {timeline && !playback.playing && result && (
        <div className={result.success ? 'feedback ok' : 'feedback bad'} role="status" data-testid="shot-result">
          {result.messages.map((m, i) => <p key={i}>{m}</p>)}
          <div className="row">
            <button type="button" onClick={() => setTimeline({ ...timeline })} data-testid="replay">Repetir</button>
            {results.length < exercise.attempts ? (
              <button type="button" className="primary" onClick={nextShot} data-testid="next-shot">Otro tiro</button>
            ) : (
              <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">
                Continuar ({hits}/{exercise.attempts})
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
