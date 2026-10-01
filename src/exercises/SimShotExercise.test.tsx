import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SimShotExercise } from './SimShotExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };

test('one shot: simulate, skip playback, show result, then continue', async () => {
  const onAttempt = vi.fn();
  const onContinue = vi.fn();
  const ex: Extract<Exercise, { kind: 'simShot' }> = {
    kind: 'simShot', prompt: 'Meté la 1', attempts: 1,
    setup: { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
    goal: { pocketBall: { ball: '1', pocket: 'c84' } },
    showGuides: { aimLine: true, ghostBall: true, contactPreview: true },
  };
  render(<SimShotExercise exercise={ex} env={env} onAttempt={onAttempt} onContinue={onContinue} />);
  fireEvent.click(screen.getByTestId('shoot'));
  fireEvent.click(await screen.findByTestId('skip-playback'));
  expect(await screen.findByTestId('shot-result')).toBeInTheDocument();
  expect(onAttempt).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId('exercise-continue'));
  expect(onContinue).toHaveBeenCalled();
});

test('pulling back the power cue and releasing shoots', async () => {
  const onAttempt = vi.fn();
  const ex: Extract<Exercise, { kind: 'simShot' }> = {
    kind: 'simShot', prompt: 'p', attempts: 1,
    setup: { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
    goal: { pocketBall: { ball: '1', pocket: 'c84' } },
    showGuides: { aimLine: true, ghostBall: false, contactPreview: false },
  };
  render(<SimShotExercise exercise={ex} env={env} onAttempt={onAttempt} onContinue={() => {}} />);
  const cue = screen.getByTestId('power-cue');
  fireEvent.pointerDown(cue, { clientY: 0, pointerId: 1 });
  fireEvent.pointerMove(cue, { clientY: 120, pointerId: 1, buttons: 1 });
  fireEvent.pointerUp(cue, { clientY: 120, pointerId: 1 });
  fireEvent.click(await screen.findByTestId('skip-playback'));
  expect(await screen.findByTestId('shot-result')).toBeInTheDocument();
  expect(onAttempt).toHaveBeenCalledTimes(1);
});

test('leaving during "Calculando…" does not record an attempt', async () => {
  const onAttempt = vi.fn();
  const ex: Extract<Exercise, { kind: 'simShot' }> = {
    kind: 'simShot', prompt: 'p', attempts: 1,
    setup: { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
    goal: { pocketBall: { ball: '1', pocket: 'c84' } },
    showGuides: { aimLine: true, ghostBall: false, contactPreview: false },
  };
  const { unmount } = render(<SimShotExercise exercise={ex} env={env} onAttempt={onAttempt} onContinue={() => {}} />);
  fireEvent.click(screen.getByTestId('shoot'));
  unmount();
  await new Promise((r) => setTimeout(r, 50));
  expect(onAttempt).not.toHaveBeenCalled();
});
