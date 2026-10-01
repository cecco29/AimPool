import { motion } from 'motion/react';
import { lessonById } from '../../content/curriculum';
import { LEVEL_LABEL, pct, STATUS_LABEL } from '../format';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';
import { TopBar } from '../components/TopBar';
import { TheoryBlockView } from '../components/TheoryBlockView';

export function NotFound() {
  return (
    <div className="screen">
      <TopBar title="No encontrado" back={{ name: 'map' }} />
      <p>No encontramos esa lección. <a href={href({ name: 'map' })}>Volver al mapa</a>.</p>
    </div>
  );
}

export function LessonScreen({ id }: { id: string }) {
  const { geometry, params, tableSpec, stats, status, passed, settings } = useProgress();
  const lesson = lessonById(id);
  if (!lesson) return <NotFound />;
  const st = status(lesson);
  const unlocked = st !== 'locked';
  const s = stats(lesson);
  const missing = lesson.prerequisites.filter((p) => !passed.has(p)).map((p) => lessonById(p)?.title ?? p);
  return (
    <div className="screen lesson">
      <TopBar title={lesson.title} back={{ name: 'map' }} />
      <p className="meta">
        {LEVEL_LABEL[lesson.level]} · {lesson.module}
        {lesson.reliability && ` · Confiabilidad ${'★'.repeat(lesson.reliability.stars)}${'☆'.repeat(3 - lesson.reliability.stars)}`}
      </p>
      {!unlocked && <p className="warn">Lección bloqueada: primero aprobá {missing.join(', ')}. Podés desbloquear todo en Ajustes.</p>}
      <div className="progress-box" data-testid="lesson-progress">
        Simulador: {pct(s.simRate)} ({s.simAttempts}){settings.hasTable !== 'no' && ` · Mesa real: ${pct(s.tableRate)} (${s.tableShots} tiros)`} · {STATUS_LABEL[st]}
      </div>
      {lesson.theory.map((block, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
          <TheoryBlockView block={block} geometry={geometry} params={params} tableSpec={tableSpec} showGuides={settings.showGuidesByDefault} />
        </motion.div>
      ))}
      {lesson.reliability && <p className="muted">{lesson.reliability.note}</p>}
      <h2 className="level">Fuentes</h2>
      <ul className="sources">
        {lesson.sources.map((src) => (
          <li key={src.label}>{src.url ? <a href={src.url} target="_blank" rel="noreferrer">{src.label}</a> : src.label}</li>
        ))}
      </ul>
      {unlocked && (
        <a className="button primary big" href={href({ name: 'exercise', id, index: 0 })} data-testid="start-exercises">Empezar ejercicios</a>
      )}
    </div>
  );
}
