import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FineWheel } from './FineWheel';

test('dragging the wheel rotates by 0.02° per pixel, incrementally', () => {
  const onRotate = vi.fn();
  render(<FineWheel azimuth={0} onRotate={onRotate} />);
  const wheel = screen.getByTestId('fine-wheel');
  fireEvent.pointerDown(wheel, { clientX: 100, pointerId: 1 });
  fireEvent.pointerMove(wheel, { clientX: 125, pointerId: 1, buttons: 1 });
  fireEvent.pointerMove(wheel, { clientX: 150, pointerId: 1, buttons: 1 });
  fireEvent.pointerUp(wheel, { clientX: 150, pointerId: 1 });
  const total = onRotate.mock.calls.reduce((s, [d]) => s + d, 0);
  expect(total).toBeCloseTo(Math.PI / 180, 9);
  expect(onRotate).toHaveBeenCalledTimes(2);
});

test('keyboard arrows nudge by 0.1°', () => {
  const onRotate = vi.fn();
  render(<FineWheel azimuth={0} onRotate={onRotate} />);
  fireEvent.keyDown(screen.getByTestId('fine-wheel'), { key: 'ArrowRight' });
  expect(onRotate).toHaveBeenCalledWith(expect.closeTo((0.1 * Math.PI) / 180, 9));
});
