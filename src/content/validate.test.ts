import { describe, expect, test } from 'vitest';
import { validateCurriculum } from './validate';
import { LESSONS } from './curriculum';
import { DEFAULT_PASS, type Lesson } from './types';

const base = (over: Partial<Lesson>): Lesson => ({
  id: 'a', level: 'principiante', module: 'm', title: 't', summary: 's', prerequisites: [], theory: [], sources: [],
  exercises: [{ kind: 'realTable', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shots: 5, instructions: 'x', diagnose: false }],
  passCriteria: DEFAULT_PASS, ...over,
});

describe('validateCurriculum', () => {
  test('the shipped curriculum is valid on 7, 8 and 9 ft tables', () => {
    expect(validateCurriculum(LESSONS)).toEqual([]);
  });
  test('detects duplicate ids, missing prerequisites and cycles', () => {
    expect(validateCurriculum([base({}), base({})]).join()).toMatch(/duplicad/);
    expect(validateCurriculum([base({ prerequisites: ['zzz'] })]).join()).toMatch(/zzz/);
    expect(validateCurriculum([base({ id: 'a', prerequisites: ['b'] }), base({ id: 'b', prerequisites: ['a'] })]).join()).toMatch(/ciclo/);
  });
  test('detects overlapping balls and missing cue ball', () => {
    const overlap = base({ exercises: [{ kind: 'realTable', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }, { id: '1', at: { x: 2.1, y: 2 } }] }, shots: 5, instructions: 'x', diagnose: false }] });
    expect(validateCurriculum([overlap]).join()).toMatch(/se solapan/);
    const noCue = base({ exercises: [{ kind: 'realTable', setup: { balls: [{ id: '1', at: { x: 2, y: 2 } }] }, shots: 5, instructions: 'x', diagnose: false }] });
    expect(validateCurriculum([noCue]).join()).toMatch(/blanca/);
  });
  test('detects bad choice index and unknown goal ball', () => {
    const bad = base({
      exercises: [
        { kind: 'estimate', prompt: 'p', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, answer: { kind: 'choice', options: ['a', 'b'], correct: 5 }, explanation: 'e' },
        { kind: 'simShot', prompt: 'p', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, goal: { pocketBall: { ball: '9' } }, attempts: 3, showGuides: { aimLine: true, ghostBall: false, contactPreview: false } },
      ],
    });
    const errs = validateCurriculum([bad]).join();
    expect(errs).toMatch(/correct/);
    expect(errs).toMatch(/bola 9/);
  });
});
