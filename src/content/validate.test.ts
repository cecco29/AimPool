import { describe, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { PLACEMENT } from './placement';
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

describe('validateCurriculum: new blocks, predict and placement', () => {
  test('shipped placement is valid', () => {
    expect(validateCurriculum(LESSONS, PLACEMENT)).toEqual([]);
  });
  test('placement items must reference existing lessons, and have ≥ 2 per lesson', () => {
    const one = [{ ...PLACEMENT[0], lessonId: 'zzz' }];
    const errs = validateCurriculum(LESSONS, one).join();
    expect(errs).toMatch(/zzz/);
    expect(errs).toMatch(/al menos 2/);
  });
  test('image blocks need a src under illustrations/ and an alt text; demo and predict need valid balls', () => {
    const bad = base({
      theory: [
        { kind: 'image', src: 'http://x.com/a.png', alt: '', caption: 'c' },
        { kind: 'demo', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shot: { aim: { ghostOf: '7', pocket: 'c84' }, power: 0.5 }, caption: 'd' },
      ],
      exercises: [{ kind: 'predict', prompt: 'p', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shot: { aim: { azimuthDeg: 0 }, power: 0.4 }, question: 'cueStop', tolerance: 0, explanation: 'e' }],
    });
    const errs = validateCurriculum([bad]).join();
    expect(errs).toMatch(/illustrations/);
    expect(errs).toMatch(/alt/);
    expect(errs).toMatch(/bola 7/);
    expect(errs).toMatch(/tolerance/);
  });
  test('every image block points to a file that exists in public/', () => {
    for (const l of LESSONS) for (const t of l.theory) if (t.kind === 'image') expect(existsSync(`public/${t.src}`)).toBe(true);
    expect(existsSync('public/illustrations/CREDITS.md')).toBe(true);
  });
});
