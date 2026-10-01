import { useEffect, useMemo, useRef } from 'react';
import { lessonById } from '../../content/curriculum';
import { EstimateExercise } from '../../exercises/EstimateExercise';
import { PredictExercise } from '../../exercises/PredictExercise';
import { RealTableExercise } from '../../exercises/RealTableExercise';
import { SimShotExercise } from '../../exercises/SimShotExercise';
import { newId } from '../../progress/store';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';
import { TopBar } from '../components/TopBar';
import { NotFound } from './LessonScreen';

export function ExerciseScreen({ id, index }: { id: string; index: number }) {
  const { geometry, params, tableSpec, settings, recordAttempt, recordSession } = useProgress();
  const startedAt = useRef(Date.now());
  const sessionId = useRef(newId());
  const lesson = lessonById(id);
  const visible = useMemo(
    () => (lesson?.exercises ?? [])
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => !(e.kind === 'realTable' && settings.hasTable === 'no'))
      .map(({ i }) => i),
    [lesson, settings.hasTable],
  );
  const exists = !!lesson && index < lesson.exercises.length;
  const hidden = exists && !visible.includes(index);
  const nextIndex = visible.find((i) => i > index);
  const goNext = () => navigate(nextIndex !== undefined ? { name: 'exercise', id, index: nextIndex } : { name: 'lesson', id });

  useEffect(() => {
    if (hidden) navigate(nextIndex !== undefined ? { name: 'exercise', id, index: nextIndex } : { name: 'lesson', id });
  }, [hidden, nextIndex, id]);

  const ex = lesson?.exercises[index];
  if (!lesson || !ex) return <NotFound />;
  if (hidden) return null;
  const env = { geometry, params, tableSpec };
  const optional = ex.kind === 'realTable' && settings.hasTable === 'sometimes';

  return (
    <div className="screen exercise-screen">
      <TopBar title={`${lesson.title} · ${visible.indexOf(index) + 1}/${visible.length}`} back={{ name: 'lesson', id }} />
      {optional && (
        <div className="optional-bar">
          <span className="chip">Opcional</span>
          <span>Si hoy no tenés mesa, podés saltearlo.</span>
          <button type="button" className="link" onClick={goNext} data-testid="skip-optional">Saltear</button>
        </div>
      )}
      {ex.kind === 'estimate' && (
        <EstimateExercise exercise={ex} env={env} onContinue={goNext}
          onAnswer={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'estimate', success, detail })} />
      )}
      {ex.kind === 'simShot' && (
        <SimShotExercise exercise={ex} env={env} onContinue={goNext}
          onAttempt={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'simShot', success, detail })} />
      )}
      {ex.kind === 'predict' && (
        <PredictExercise exercise={ex} env={env} onContinue={goNext}
          onAnswer={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'predict', success, detail })} />
      )}
      {ex.kind === 'realTable' && (
        <RealTableExercise exercise={ex} env={env} onContinue={goNext}
          onShots={(shots) => recordSession({ id: sessionId.current, lessonId: id, exerciseIndex: index, shots, startedAt: startedAt.current, endedAt: Date.now() })} />
      )}
    </div>
  );
}
