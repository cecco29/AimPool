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
  test('persists after every shot and completes after N shots', () => {
    const onShots = vi.fn();
    render(<RealTableExercise exercise={ex(3)} env={env} onShots={onShots} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    expect(onShots).toHaveBeenLastCalledWith([{ success: true }]);
    fireEvent.click(screen.getByTestId('real-miss'));
    fireEvent.click(screen.getByTestId('miss-fina'));
    fireEvent.click(screen.getByTestId('real-hit'));
    expect(onShots).toHaveBeenCalledTimes(3);
    expect(onShots.mock.calls[2][0]).toEqual([{ success: true }, { success: false, miss: 'fina' }, { success: true }]);
    expect(screen.getByTestId('real-summary')).toHaveTextContent('2 de 3');
  });
  test('finish early shows the summary with the shots so far', () => {
    const onShots = vi.fn();
    render(<RealTableExercise exercise={ex(10)} env={env} onShots={onShots} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-finish'));
    expect(screen.getByTestId('real-summary')).toHaveTextContent('1 de 1');
    expect(onShots).toHaveBeenCalledTimes(1);
  });
  test('partial session: shots are already saved even if the app is killed (no unmount)', () => {
    const onShots = vi.fn();
    render(<RealTableExercise exercise={ex(10)} env={env} onShots={onShots} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-hit'));
    expect(onShots).toHaveBeenLastCalledWith([{ success: true }, { success: true }]);
  });
  test('no shots, nothing saved', () => {
    const onShots = vi.fn();
    const { unmount } = render(<RealTableExercise exercise={ex(10)} env={env} onShots={onShots} onContinue={() => {}} />);
    unmount();
    expect(onShots).not.toHaveBeenCalled();
  });
});
