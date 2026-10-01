import { useRef } from 'react';
import { lessonById } from '../../content/curriculum';
import { EstimateExercise } from '../../exercises/EstimateExercise';
import { RealTableExercise } from '../../exercises/RealTableExercise';
import { SimShotExercise } from '../../exercises/SimShotExercise';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';
import { TopBar } from '../components/TopBar';
import { NotFound } from './LessonScreen';

export function ExerciseScreen({ id, index }: { id: string; index: number }) {
  const { geometry, params, tableSpec, recordAttempt, recordSession } = useProgress();
  const startedAt = useRef(Date.now());
  const lesson = lessonById(id);
  const ex = lesson?.exercises[index];
  if (!lesson || !ex) return <NotFound />;
  const env = { geometry, params, tableSpec };
  const next = () =>
    navigate(index + 1 < lesson.exercises.length ? { name: 'exercise', id, index: index + 1 } : { name: 'lesson', id });

  return (
    <div className="screen exercise-screen">
      <TopBar title={`${lesson.title} · ${index + 1}/${lesson.exercises.length}`} back={{ name: 'lesson', id }} />
      {ex.kind === 'estimate' && (
        <EstimateExercise exercise={ex} env={env} onContinue={next}
          onAnswer={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'estimate', success, detail })} />
      )}
      {ex.kind === 'simShot' && (
        <SimShotExercise exercise={ex} env={env} onContinue={next}
          onAttempt={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'simShot', success, detail })} />
      )}
      {ex.kind === 'realTable' && (
        <RealTableExercise exercise={ex} env={env} onContinue={next}
          onFinish={(shots) => recordSession({ lessonId: id, exerciseIndex: index, shots, startedAt: startedAt.current, endedAt: Date.now() })} />
      )}
    </div>
  );
}
