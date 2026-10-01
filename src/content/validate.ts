import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC, type TableSize } from '../table/geometry';
import { layoutToBalls } from './layout';
import type { BallLayout, Exercise, Lesson } from './types';

const SIZES: TableSize[] = ['7ft', '8ft', '9ft'];

function checkLayout(where: string, layout: BallLayout, needCue: boolean, errors: string[]) {
  const ids = layout.balls.map((b) => b.id);
  if (new Set(ids).size !== ids.length) errors.push(`${where}: ids de bola repetidos`);
  if (needCue && !ids.includes('cue')) errors.push(`${where}: falta la blanca ('cue')`);
  for (const b of layout.balls) {
    if (b.at.x < 0 || b.at.x > 8 || b.at.y < 0 || b.at.y > 4) errors.push(`${where}: bola ${b.id} fuera de la mesa`);
  }
  const R = DEFAULT_PARAMS.R;
  for (const size of SIZES) {
    const balls = layoutToBalls(layout, buildTable({ ...DEFAULT_TABLE_SPEC, size }, R), R);
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const d = Math.hypot(balls[i].r[0] - balls[j].r[0], balls[i].r[1] - balls[j].r[1]);
        if (d < 2 * R - 1e-9) errors.push(`${where}: bolas ${balls[i].id} y ${balls[j].id} se solapan en mesa ${size}`);
      }
    }
  }
}

function checkExercise(where: string, ex: Exercise, errors: string[]) {
  checkLayout(where, ex.setup, true, errors);
  const ids = new Set(ex.setup.balls.map((b) => b.id));
  if (ex.kind === 'estimate') {
    if (ex.answer.kind === 'choice' && (ex.answer.options.length < 2 || ex.answer.correct < 0 || ex.answer.correct >= ex.answer.options.length)) {
      errors.push(`${where}: opción 'correct' inválida`);
    }
    if (ex.answer.kind === 'cutAngle' && !ids.has(ex.answer.ball)) errors.push(`${where}: bola ${ex.answer.ball} no está en el setup`);
  }
  if (ex.kind === 'simShot') {
    if (ex.attempts < 1) errors.push(`${where}: attempts debe ser ≥ 1`);
    if (ex.goal.pocketBall && !ids.has(ex.goal.pocketBall.ball)) errors.push(`${where}: bola ${ex.goal.pocketBall.ball} no está en el setup`);
    for (const id of ex.variation?.balls ?? []) if (!ids.has(id)) errors.push(`${where}: variación sobre bola ${id} inexistente`);
  }
  if (ex.kind === 'realTable' && ex.shots < 1) errors.push(`${where}: shots debe ser ≥ 1`);
  if ((ex.kind === 'realTable' || ex.kind === 'estimate') && ex.target && !ids.has(ex.target.ball)) {
    errors.push(`${where}: bola ${ex.target.ball} no está en el setup`);
  }
}

export function validateCurriculum(lessons: Lesson[]): string[] {
  const errors: string[] = [];
  const ids = lessons.map((l) => l.id);
  for (const id of new Set(ids)) if (ids.indexOf(id) !== ids.lastIndexOf(id)) errors.push(`id de lección duplicado: ${id}`);
  const byId = new Map(lessons.map((l) => [l.id, l]));

  for (const l of lessons) {
    for (const pre of l.prerequisites) if (!byId.has(pre)) errors.push(`${l.id}: prerrequisito inexistente ${pre}`);
    if (l.exercises.length === 0) errors.push(`${l.id}: sin ejercicios`);
    const { simulator, realTable } = l.passCriteria;
    if (simulator < 0 || simulator > 1 || realTable < 0 || realTable > 1) errors.push(`${l.id}: passCriteria fuera de [0,1]`);
    l.theory.forEach((t, i) => {
      if (t.kind === 'diagram') checkLayout(`${l.id} teoría ${i}`, t.setup, false, errors);
    });
    l.exercises.forEach((ex, i) => checkExercise(`${l.id} ejercicio ${i}`, ex, errors));
  }

  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'done') return false;
    if (state.get(id) === 'visiting') return true;
    state.set(id, 'visiting');
    const cyclic = (byId.get(id)?.prerequisites ?? []).some(visit);
    state.set(id, 'done');
    return cyclic;
  };
  for (const l of lessons) {
    if (visit(l.id)) {
      errors.push(`hay un ciclo de prerrequisitos que pasa por ${l.id}`);
      break;
    }
  }
  return errors;
}
