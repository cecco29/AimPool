import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RealTableExercise } from './RealTableExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
const ex = (shots: number): Extract<Exercise, { kind: 'realTable' }> => ({
  kind: 'realTable', shots, diagnose: true, instructions: 'Tirá',
  setup: { balls: [{ id: 'cue', at: { x: 4, y: 2 } }, { id: '1', at: { x: 6, y: 2 } }] },
  target: { ball: '1', pocket: 'c84' },
});

describe('RealTableExercise', () => {
  test('completes after N shots', () => {
    const onFinish = vi.fn();
    render(<RealTableExercise exercise={ex(3)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-miss'));
    fireEvent.click(screen.getByTestId('miss-fina'));
    fireEvent.click(screen.getByTestId('real-hit'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toEqual([{ success: true }, { success: false, miss: 'fina' }, { success: true }]);
    expect(screen.getByTestId('real-summary')).toHaveTextContent('2 de 3');
  });
  test('finish early', () => {
    const onFinish = vi.fn();
    render(<RealTableExercise exercise={ex(10)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-finish'));
    expect(onFinish).toHaveBeenCalledWith([{ success: true }]);
  });
  test('partial session: leaving keeps the logged shots', () => {
    const onFinish = vi.fn();
    const { unmount } = render(<RealTableExercise exercise={ex(10)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-hit'));
    unmount();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toHaveLength(2);
  });
  test('leaving without shots saves nothing', () => {
    const onFinish = vi.fn();
    const { unmount } = render(<RealTableExercise exercise={ex(10)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    unmount();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
