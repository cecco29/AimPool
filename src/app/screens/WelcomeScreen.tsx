import { useState } from 'react';
import type { Settings } from '../../progress/types';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';

const OPTIONS: { value: Settings['hasTable']; title: string; text: string }[] = [
  { value: 'yes', title: 'Sí, tengo mesa', text: 'Las lecciones incluyen rutinas para practicar en la mesa real.' },
  { value: 'sometimes', title: 'A veces', text: 'Las rutinas de mesa son opcionales: aprobás con el simulador.' },
  { value: 'no', title: 'No tengo mesa', text: 'Aprendés y aprobás todo con el simulador.' },
];

export function WelcomeScreen() {
  const { updateSettings } = useProgress();
  const [step, setStep] = useState<1 | 2>(1);
  const choose = (hasTable: Settings['hasTable']) => {
    void updateSettings({ hasTable });
    setStep(2);
  };
  const finish = async (placement: boolean) => {
    await updateSettings({ onboardingDone: true });
    navigate(placement ? { name: 'placement' } : { name: 'home' });
  };
  return (
    <div className="screen welcome">
      <header className="hero">
        <h1>AimPool</h1>
        <p>Te enseñamos a apuntar en pool, desde cero.</p>
      </header>
      {step === 1 ? (
        <section className="welcome-step">
          <h2>¿Tenés una mesa de pool para practicar?</h2>
          {OPTIONS.map((o) => (
            <button key={o.value} type="button" className="choice-big" data-testid={`welcome-${o.value}`} onClick={() => choose(o.value)}>
              <strong>{o.title}</strong>
              <span>{o.text}</span>
            </button>
          ))}
        </section>
      ) : (
        <section className="welcome-step">
          <h2>¿Hacemos un test de ubicación?</h2>
          <p>Son unas preguntas en pantalla (unos 5 minutos). Si ya sabés algo, te salteás lo que dominás.</p>
          <button type="button" className="primary big" data-testid="welcome-placement" onClick={() => { void finish(true); }}>Hacer el test</button>
          <button type="button" className="big" data-testid="welcome-skip" onClick={() => { void finish(false); }}>Saltear, empiezo de cero</button>
        </section>
      )}
      <p className="muted">Podés cambiar esto cuando quieras en Ajustes.</p>
    </div>
  );
}
