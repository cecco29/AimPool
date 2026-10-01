import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../sim/client', async (orig) => {
  const m = await orig<typeof import('../../sim/client')>();
  return { ...m, simulateAsync: vi.fn(m.simulateAsync) };
});

import { simulateAsync } from '../../sim/client';
import { DemoView } from './DemoView';
import { DEFAULT_PARAMS } from '../../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../../table/geometry';

test('demo simulates on mount, can replay, and re-simulates when the spin changes', async () => {
  render(<DemoView geometry={buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R)} params={DEFAULT_PARAMS} tableSpec={DEFAULT_TABLE_SPEC}
    block={{ kind: 'demo', caption: 'Demo', interactive: 'spin', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }, { id: '1', at: { x: 4, y: 2 } }] }, shot: { aim: { at: { x: 4, y: 2 } }, power: 0.4 } }} />);
  await waitFor(() => expect(screen.getByTestId('demo-replay')).toBeEnabled());
  expect(simulateAsync).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Abajo (draw)' }));
  await waitFor(() => expect(simulateAsync).toHaveBeenCalledTimes(2));
});
