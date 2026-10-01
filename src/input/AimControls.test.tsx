import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AimControls } from './AimControls';
import { DEFAULT_AIM } from './aim';

describe('AimControls', () => {
  test('the fine wheel rotates the aim (keyboard: 0.1° per arrow)', () => {
    const onChange = vi.fn();
    render(<AimControls aim={DEFAULT_AIM} onChange={onChange} />);
    fireEvent.keyDown(screen.getByTestId('fine-wheel'), { key: 'ArrowRight' });
    expect(onChange.mock.calls[0][0].azimuth).toBeCloseTo((0.1 * Math.PI) / 180, 12);
  });
  test('power is no longer a slider here (it moved to the cue)', () => {
    render(<AimControls aim={DEFAULT_AIM} onChange={() => {}} />);
    expect(screen.queryByLabelText('Fuerza')).toBeNull();
  });
  test('warns about miscue outside the red circle', () => {
    render(<AimControls aim={{ ...DEFAULT_AIM, a: 0.55 }} onChange={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/miscue/);
  });
});
