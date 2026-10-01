import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PowerCue } from './PowerCue';

const setup = () => {
  const onPowerChange = vi.fn();
  const onShoot = vi.fn();
  const onCancel = vi.fn();
  render(<PowerCue travel={200} onPowerChange={onPowerChange} onShoot={onShoot} onCancel={onCancel} />);
  return { el: screen.getByTestId('power-cue'), onPowerChange, onShoot, onCancel };
};

test('pulling back charges power live and releasing shoots with it', () => {
  const { el, onPowerChange, onShoot } = setup();
  fireEvent.pointerDown(el, { clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(el, { clientY: 110, pointerId: 1, buttons: 1 });
  expect(onPowerChange).toHaveBeenLastCalledWith(0.5);
  fireEvent.pointerUp(el, { clientY: 110, pointerId: 1 });
  expect(onShoot).toHaveBeenCalledWith(0.5);
});

test('releasing with almost no pull cancels', () => {
  const { el, onShoot, onCancel } = setup();
  fireEvent.pointerDown(el, { clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(el, { clientY: 13, pointerId: 1, buttons: 1 });
  fireEvent.pointerUp(el, { clientY: 13, pointerId: 1 });
  expect(onShoot).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalled();
});
