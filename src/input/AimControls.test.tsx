import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AimControls } from './AimControls';
import { DEFAULT_AIM } from './aim';

describe('AimControls', () => {
  test('fine tune rotates by 0.1°', () => {
    const onChange = vi.fn();
    render(<AimControls aim={DEFAULT_AIM} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('fine-right'));
    expect(onChange.mock.calls[0][0].azimuth).toBeCloseTo((0.1 * Math.PI) / 180, 12);
  });
  test('power slider updates power', () => {
    const onChange = vi.fn();
    render(<AimControls aim={DEFAULT_AIM} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider', { name: 'Fuerza' }), { target: { value: '0.8' } });
    expect(onChange.mock.calls[0][0].power).toBe(0.8);
  });
  test('warns about miscue outside the red circle', () => {
    render(<AimControls aim={{ ...DEFAULT_AIM, a: 0.55 }} onChange={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/miscue/);
  });
});
