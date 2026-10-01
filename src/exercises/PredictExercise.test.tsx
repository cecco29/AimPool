import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PredictExercise } from './PredictExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
const ex: Extract<Exercise, { kind: 'predict' }> = {
  kind: 'predict', prompt: '¿Dónde termina la blanca?', question: 'cueStop', tolerance: 0.5, explanation: 'porque sí',
  setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shot: { aim: { azimuthDeg: 0 }, power: 0.2 },
};

test('tap to mark, check, see the verdict and continue', async () => {
  const onAnswer = vi.fn();
  const onContinue = vi.fn();
  render(<PredictExercise exercise={ex} env={env} onAnswer={onAnswer} onContinue={onContinue} />);
  expect(screen.getByTestId('predict-submit')).toBeDisabled();
  fireEvent.pointerDown(screen.getByRole('img', { name: /predicción/ }), { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.click(screen.getByTestId('predict-submit'));
  fireEvent.click(await screen.findByTestId('skip-playback'));
  expect(await screen.findByTestId('predict-result')).toHaveTextContent('porque sí');
  expect(onAnswer).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId('exercise-continue'));
  expect(onContinue).toHaveBeenCalled();
});
