import { isUnlocked, orderedLessons } from '../../content/curriculum';
import { LEVEL_LABEL, LEVELS, pct } from '../format';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';
import { TopBar } from '../components/TopBar';

export function LessonMapScreen() {
  const { passed, settings, stats } = useProgress();
  const lessons = orderedLessons();
  return (
    <div className="screen">
      <TopBar title="Mapa de lecciones" back={{ name: 'home' }} />
      {LEVELS.map((level) => {
        const ls = lessons.filter((l) => l.level === level);
        if (ls.length === 0) return null;
        return (
          <section key={level}>
            <h2 className="level">{LEVEL_LABEL[level]}</h2>
            <ol className="path">
              {ls.map((l) => {
                const unlocked = isUnlocked(l, passed, settings.ignoreLocks);
                const s = stats(l);
                const status = s.passed ? 'Aprobada' : !unlocked ? 'Bloqueada' : s.simAttempts || s.tableShots ? 'En progreso' : 'Nueva';
                const body = (
                  <>
                    <span className="status">{l.module} · {status}</span>
                    <strong>{l.title}</strong>
                    <span className="status">Simulador {pct(s.simRate)} · Mesa {pct(s.tableRate)}</span>
                  </>
                );
                return (
                  <li key={l.id} className={`path-item${s.passed ? ' passed' : ''}${unlocked ? '' : ' locked'}`}>
                    {unlocked
                      ? <a href={href({ name: 'lesson', id: l.id })} data-testid={`lesson-card-${l.id}`}>{body}</a>
                      : <div aria-disabled="true">{body}</div>}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
