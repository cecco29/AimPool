import { isUnlocked, orderedLessons } from '../../content/curriculum';
import { computeStreak } from '../../progress/stats';
import { useProgress } from '../ProgressContext';
import { useEffect } from 'react';
import { href, navigate } from '../routes';

export function HomeScreen() {
  const { ready, persistent, attempts, sessions, passed, settings } = useProgress();
  const streak = computeStreak([...attempts.map((a) => a.createdAt), ...sessions.map((s) => s.endedAt)], Date.now());
  const lessons = orderedLessons();
  useEffect(() => {
    if (ready && !settings.onboardingDone) navigate({ name: 'welcome' }, { replace: true });
  }, [ready, settings.onboardingDone]);
  const next = lessons.find((l) => !passed.has(l.id) && isUnlocked(l, passed, settings.ignoreLocks)) ?? lessons[0];
  return (
    <div className="screen home">
      <header className="hero">
        <h1>AimPool</h1>
        <p>Academia de apuntado para pool: sistemas, simulador y rutinas para la mesa real.</p>
      </header>
      {!ready ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {!persistent && (
            <p className="warn" role="alert">Tu progreso no se está guardando en este navegador (¿modo privado?). Se pierde al cerrar.</p>
          )}
          <p className="streak">Racha: <strong>{streak}</strong> {streak === 1 ? 'día' : 'días'} seguidos</p>
          {next && (
            <a className="card primary-card" href={href({ name: 'lesson', id: next.id })} data-testid="continue-lesson">
              <span className="eyebrow">Seguí con</span>
              <strong>{next.title}</strong>
              <span>{next.summary}</span>
            </a>
          )}
          <nav className="menu" aria-label="Secciones">
            <a href={href({ name: 'map' })} data-testid="go-map">Mapa de lecciones</a>
            <a href={href({ name: 'stats' })}>Estadísticas</a>
            <a href={href({ name: 'settings' })}>Ajustes</a>
          </nav>
        </>
      )}
    </div>
  );
}
