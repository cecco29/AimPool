import { orderedLessons } from '../../content/curriculum';
import { isPassed } from '../../progress/status';
import { LEVEL_LABEL, LEVELS, pct, STATUS_LABEL } from '../format';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';
import { TopBar } from '../components/TopBar';

export function LessonMapScreen() {
  const { stats, status, settings } = useProgress();
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
                const st = status(l);
                const s = stats(l);
                const body = (
                  <>
                    <span className="status">{l.module} · {STATUS_LABEL[st]}</span>
                    <strong>{l.title}</strong>
                    <span className="status">
                      Simulador {pct(s.simRate)}{settings.hasTable !== 'no' && ` · Mesa ${pct(s.tableRate)}`}
                    </span>
                  </>
                );
                return (
                  <li key={l.id} className={`path-item${isPassed(st) ? ' passed' : ''}${st === 'locked' ? ' locked' : ''}`}>
                    {st !== 'locked'
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
