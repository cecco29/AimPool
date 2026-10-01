import type { Lesson, Level } from './types';
import { ghostBall } from './lessons/ghost-ball';

export const LESSONS: Lesson[] = [ghostBall];

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);

export const isUnlocked = (lesson: Lesson, passed: Set<string>, ignoreLocks: boolean): boolean =>
  ignoreLocks || lesson.prerequisites.every((p) => passed.has(p));

export const lessonNeeds = (lesson: Lesson) => ({
  sim: lesson.exercises.some((e) => e.kind !== 'realTable'),
  table: lesson.exercises.some((e) => e.kind === 'realTable'),
});

const LEVEL_ORDER: Level[] = ['principiante', 'intermedio', 'avanzado'];

/** Orden topológico estable: por nivel y, dentro del nivel, respetando prerrequisitos. */
export function orderedLessons(lessons: Lesson[] = LESSONS): Lesson[] {
  const sorted = [...lessons].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const seen = new Set<string>();
  const out: Lesson[] = [];
  const add = (l: Lesson) => {
    if (seen.has(l.id)) return;
    seen.add(l.id);
    for (const pre of l.prerequisites) {
      const dep = byId.get(pre);
      if (dep) add(dep);
    }
    out.push(l);
  };
  sorted.forEach(add);
  return out;
}
