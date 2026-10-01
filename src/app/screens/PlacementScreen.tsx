import { useState } from 'react';
import { lessonById } from '../../content/curriculum';
import { PLACEMENT, scorePlacement } from '../../content/placement';
import { EstimateExercise } from '../../exercises/EstimateExercise';
import { PredictExercise } from '../../exercises/PredictExercise';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';
import { TopBar } from '../components/TopBar';

export function PlacementScreen() {
  const { geometry, params, tableSpec, updateSettings } = useProgress();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [passed, setPassed] = useState<string[] | null>(null);
  const env = { geometry, params, tableSpec };

  const answer = (ok: boolean) => setAnswers((a) => { const n = a.slice(); n[i] = ok; return n; });
  const advance = async () => {
    if (i + 1 < PLACEMENT.length) {
      setI(i + 1);
      return;
    }
    const p = scorePlacement(PLACEMENT, answers);
    await updateSettings({ placement: { completedAt: Date.now(), passed: p } });
    setPassed(p);
  };

  if (passed) {
    return (
      <div className="screen">
        <TopBar title="Test de ubicación" back={{ name: 'home' }} />
        <div className="feedback ok" role="status" data-testid="placement-summary">
          {passed.length === 0 ? (
            <p>Arrancás desde el principio: es el mejor camino para aprender bien la base.</p>
          ) : (
            <>
              <p>Aprobaste por ubicación:</p>
              <ul>{passed.map((id) => <li key={id}>{lessonById(id)?.title ?? id}</li>)}</ul>
              <p>Igual podés hacerlas cuando quieras para practicar.</p>
            </>
          )}
          <button type="button" className="primary" onClick={() => navigate({ name: 'map' })} data-testid="placement-done">Ir al mapa</button>
        </div>
      </div>
    );
  }

  const item = PLACEMENT[i];
  return (
    <div className="screen">
      <TopBar title={`Test de ubicación · ${i + 1}/${PLACEMENT.length}`} back={{ name: 'home' }} />
      {item.exercise.kind === 'estimate' ? (
        <EstimateExercise key={i} exercise={item.exercise} env={env} onAnswer={(ok) => answer(ok)} onContinue={() => { void advance(); }} />
      ) : (
        <PredictExercise key={i} exercise={item.exercise} env={env} onAnswer={(ok) => answer(ok)} onContinue={() => { void advance(); }} />
      )}
    </div>
  );
}
