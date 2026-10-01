import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EstimateExercise } from './EstimateExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { layoutToBalls } from '../content/layout';
import { cutAngleDeg } from '../table/aim';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
const setup = { balls: [{ id: 'cue', at: { x: 3, y: 1.2 } }, { id: '1', at: { x: 6, y: 2 } }] };

describe('EstimateExercise', () => {
  test('choice: correct answer', () => {
    const onAnswer = vi.fn();
    const ex: Extract<Exercise, { kind: 'estimate' }> = { kind: 'estimate', prompt: 'p', setup, explanation: 'porque sí', answer: { kind: 'choice', options: ['a', 'b'], correct: 1 } };
    render(<EstimateExercise exercise={ex} env={env} onAnswer={onAnswer} onContinue={() => {}} />);
    expect(screen.getByTestId('estimate-submit')).toBeDisabled();
    fireEvent.click(screen.getByTestId('choice-1'));
    fireEvent.click(screen.getByTestId('estimate-submit'));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(String));
    expect(screen.getByTestId('estimate-feedback')).toHaveTextContent('porque sí');
  });
  test('cut angle within tolerance succeeds', () => {
    const onAnswer = vi.fn();
    const ex: Extract<Exercise, { kind: 'estimate' }> = { kind: 'estimate', prompt: 'p', setup, explanation: 'e', answer: { kind: 'cutAngle', ball: '1', pocket: 'c84', toleranceDeg: 5 } };
    const [cue, ob] = layoutToBalls(setup, env.geometry, DEFAULT_PARAMS.R);
    const correct = Math.round(cutAngleDeg(cue.r, ob.r, env.geometry.pocketCenters.c84, DEFAULT_PARAMS.R));
    render(<EstimateExercise exercise={ex} env={env} onAnswer={onAnswer} onContinue={() => {}} />);
    fireEvent.change(screen.getByTestId('angle-slider'), { target: { value: String(correct) } });
    fireEvent.click(screen.getByTestId('estimate-submit'));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.stringContaining(`${correct}°`));
  });
});
